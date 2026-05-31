import selectionHelpers from './selectionModule.js';

export default function editorCleaner(editorModule) {
    return {
        sanitize(node) {
            if (node.nodeType === Node.TEXT_NODE) return;

            // Sanitize children first (bottom-up) to prevent recursion bypasses
            [...node.children].forEach(child => this.sanitize(child));

            const allowedTags = [
                // Formatting
                'P','BR','H1','H2','H3','STRONG','B','I','EM','U','CODE','PRE','A',
                // Layout
                'DIV','SPAN',
                // Lists
                'UL','OL','LI',
                // Tables
                'TABLE','THEAD','TBODY','TFOOT','TR','TH','TD',
                // Media
                'IMG','IFRAME'
            ];

            // Remove tag if not allowed (unwrap children)
            if (!allowedTags.includes(node.tagName)) {
                node.replaceWith(...Array.from(node.childNodes));
                return;
            }

            // Allowed attributes
            const allowedAttributes = {
                'IMG': ['src', 'alt'],
                'A': ['href'],
                'IFRAME': ['src', 'allow', 'allowfullscreen', 'loading'],
                'DEFAULT': []
            };

            const tag = node.tagName;
            const allowed = allowedAttributes[tag] || allowedAttributes.DEFAULT;

            [...node.attributes].forEach(attr => {
                const name = attr.name.toLowerCase();

                // Remove event handlers (onclick, onload…)
                if (name.startsWith('on')) {
                    node.removeAttribute(attr.name);
                    return;
                }

                // Remove disallowed attributes
                if (!allowed.includes(name)) {
                    node.removeAttribute(attr.name);
                }
            });

            // Special validation for iframes
            if (tag === 'IFRAME') {
                const src = node.getAttribute('src') || "";

                const trustedSources = [
                    "youtube.com",
                    "youtu.be",
                    "player.vimeo.com"
                ];

                let isTrusted = false;
                try {
                    const url = new URL(src, window.location.origin);
                    isTrusted = trustedSources.some(domain => url.hostname.endsWith(domain));
                } catch (e) {
                    isTrusted = false;
                }

                if (!isTrusted) {
                    node.replaceWith(...Array.from(node.childNodes));
                    return;
                }

                node.setAttribute(
                    "sandbox",
                    "allow-scripts allow-same-origin allow-presentation allow-popups"
                );
            }
        },

        stripStylesAndAttributes(node) {
            if (node.nodeType === Node.TEXT_NODE) return;

            // Remove all attributes but keep the element itself
            [...node.attributes].forEach(attr => node.removeAttribute(attr.name));

            // Recursively clean children
            [...node.childNodes].forEach(child => this.stripStylesAndAttributes(child));
        },

        flattenTags(node) {
            if (node.nodeType === Node.TEXT_NODE) return;

            // Recursively flatten children first
            [...node.childNodes].forEach(child => this.flattenTags(child));

            // Remove empty elements only (no children and no text)
            const isEmpty =
                node.parentNode !== editorModule &&
                node.nodeType === Node.ELEMENT_NODE &&
                node.childNodes.length === 0 &&
                node.textContent.trim() === "";

            if (isEmpty) {
                node.remove();
            }
        },

        removeFormattingTags(node) {
            if (node.nodeType === Node.TEXT_NODE) return;

            // List of tags to unwrap
            const formattingTags = ["B", "I", "U", "STRONG", "EM", "SPAN"];

            // Recursively process children first
            [...node.childNodes].forEach(child => this.removeFormattingTags(child));

            // If this node is a formatting tag, replace it with its children
            if (formattingTags.includes(node.tagName)) {
                node.replaceWith(...node.childNodes);
            }
        },

        // --- Main runner ---
        run() {
            // Get the selection object from your helper
            const sel = selectionHelpers(editorModule.editor);
            const range = sel.range(); // Get the current range

            // If there is no range or nothing is actually selected, return empty
            if (!range || range.collapsed) {
                return ""; // Nothing selected
            }

            const editorText = editorModule.editor?.textContent.replace(/\s+/g, ' ').trim();
            const selectionText = range.cloneContents().textContent.replace(/\s+/g, ' ').trim(); 

            const container = document.createElement("div");

            if (selectionText === editorText) {
                // Selection matches the whole editor
                container.innerHTML = editorModule.editor.innerHTML;
                
                this.sanitize(container);
                this.stripStylesAndAttributes(container);
                this.flattenTags(container);
                this.removeFormattingTags(container);
                
                editorModule.editor.innerHTML = container.innerHTML;
                editorModule.save();
            } else {
                // For partial selections, we want to clean the cloned contents.
                // If we want to clean the parent block (e.g. a paragraph or bold tag),
                // we should expand the range or just clean the clone.
                // We shouldn't move live nodes out of the editor before replacing.
                
                // Let's use the cloned contents to avoid breaking the range.
                // If the user selected text inside a tag, they only clean the selected part.
                container.appendChild(range.cloneContents());
                
                this.sanitize(container);
                this.stripStylesAndAttributes(container);
                this.flattenTags(container);
                this.removeFormattingTags(container);
                
                this.replaceHtml(container.innerHTML);
            }
        },

        replaceHtml(html) {
            const sel = selectionHelpers(editorModule.editor);
            if (!sel.range()) return;

            sel.replace(() => {
                const temp = document.createElement("div");
                temp.innerHTML = html;
                const fragment = document.createDocumentFragment();
                while (temp.firstChild) fragment.appendChild(temp.firstChild);
                return fragment;
            });

            editorModule.save();
        }
    };
}
