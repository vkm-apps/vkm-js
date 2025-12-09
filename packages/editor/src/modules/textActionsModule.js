import selectionHelpers from './selectionModule.js';

export default function textActionsModule(editorModule) {
    return {
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrikethrough: false,

        // Track whether text is bold/italic/etc. for toolbar state
        updateFormattingState() {
            const sel = selectionHelpers(editorModule.editor);
            if (sel.isCollapsed()) return;

            const parent = sel.anchorNode?.parentElement;
            if (!parent) return;

            this.isBold = document.queryCommandState('bold');
            this.isItalic = document.queryCommandState('italic');
            this.isUnderline = document.queryCommandState('underline');
            this.isStrikethrough = document.queryCommandState('strikeThrough');
        },

        uppercase() { this.transformText('uppercase'); },
        lowercase() { this.transformText('lowercase'); },
        titlecase() { this.transformText('titlecase'); },

        toggleBold() {
            document.execCommand('bold');
            this.isBold = ! this.isBold;
        },

        toggleItalic() {
            document.execCommand('italic');
            this.isItalic = ! this.isItalic;
        },

        toggleUnderline() {
            document.execCommand('underline');
            this.isUnderline = ! this.isUnderline;
        },

        toggleStrikethrough() {
            document.execCommand('strikethrough');
            this.isStrikethrough = ! this.isStrikethrough;
        },

        toggleSuperscript() {
            document.execCommand('superscript');
        },

        toggleSubscript() {
        document.execCommand('subscript');
        },

        toggleFormat(tag) {
            const sel = selectionHelpers(editorModule.editor);
            if (sel.isCollapsed()) return;

            const range = sel.range();

            // Check if selection is fully inside the tag
            let ancestor = range.commonAncestorContainer;
            while (ancestor.nodeType === 3) ancestor = ancestor.parentNode;

            if (ancestor.tagName && ancestor.tagName.toLowerCase() === tag) {
                // Partial selection: unwrap only the selection
                sel.replace(fragment => {
                    const container = document.createDocumentFragment();

                    fragment.childNodes.forEach(node => {
                        if (node.nodeType === 3) {
                            // Text node: just append
                            container.appendChild(node.cloneNode());
                        } else if (node.nodeType === 1 && node.tagName.toLowerCase() === tag) {
                            // Unwrap this node
                            while (node.firstChild) container.appendChild(node.firstChild);
                        } else {
                            container.appendChild(node.cloneNode(true));
                        }
                    });

                    return container;
                });
            } else {
                // Wrap the selection
                sel.wrap(tag);
            }
        },

        alignLeft() {
            document.execCommand('justifyLeft');
        },

        alignCenter() {
            document.execCommand('justifyCenter');
        },

        alignRight() {
            document.execCommand('justifyRight');
        },

        // --- Text Transform ---
        transformText(type) {
            const sel = selectionHelpers(editorModule.editor);
            const range = sel.range();
            if (!range) return;

            const fragment = range.extractContents(); // Extract directly
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(fragment);

            const transformNode = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (type === 'uppercase') node.textContent = node.textContent.toUpperCase();
                    else if (type === 'lowercase') node.textContent = node.textContent.toLowerCase();
                    else if (type === 'titlecase') {
                        node.textContent = node.textContent.replace(/\b\p{L}/gu, c => c.toUpperCase());
                    }
                } else {
                    Array.from(node.childNodes).forEach(transformNode);
                }
            };

            transformNode(tempDiv);

            const newFragment = document.createDocumentFragment();
            Array.from(tempDiv.childNodes).forEach(node => newFragment.appendChild(node));

            range.insertNode(newFragment);

            // Collapse selection to the end of the inserted content
            const lastNode = tempDiv.lastChild || newFragment.lastChild;
            if (lastNode) {
                const newRange = document.createRange();
                newRange.setStartAfter(lastNode);
                newRange.collapse(true);
                sel.raw.removeAllRanges();
                sel.raw.addRange(newRange);
            }

            editorModule.save();
        },

        fontsize(px) {
            const sel = selectionHelpers(editorModule.editor);

            sel.replace(frag => {
                const wrapper = document.createElement('span');
                wrapper.style.fontSize = px + 'px';
                wrapper.appendChild(frag);
                return wrapper;
            });

            editorModule.save();
        },

        // --- Paragraph / Block Formatting ---
        paragraph() { this.wrapBlock('p'); },

        heading(level = 1) {
            if (level < 1 || level > 6) level = 1;
            this.wrapBlock('h' + level);
        },

        wrapBlock(tag) {
            const sel = selectionHelpers(editorModule.editor);
            const root = editorModule.editor;

            // If selectionHelpers.parent() returns null → treat root as parent
            const parent = sel.parent() || root;

            const blockTags = ["P", "H1", "H2", "H3", "H4", "H5", "H6", "DIV", "BLOCKQUOTE"];

            // Find nearest block ancestor
            const blockParent = parent.closest(blockTags.join(","));

            // ============================================================
            // CASE A — There is a block parent AND it's not the root
            // ============================================================
            if (blockParent && blockParent !== root) {

                const wrapper = document.createElement(tag);

                // Preserve attributes except id
                for (const attr of blockParent.attributes) {
                    if (attr.name !== "id") {
                        wrapper.setAttribute(attr.name, attr.value);
                    }
                }

                wrapper.innerHTML = blockParent.innerHTML;
                blockParent.replaceWith(wrapper);
                editorModule.save();
                return;
            }

            // ============================================================
            // CASE B — Selection spans multiple blocks → wrap each block
            // ============================================================
            const range = sel.range();
            if (!range) return;

            const fragment = range.cloneContents();

            // Identify block-like nodes inside selection
            const blocks = [];
            fragment.childNodes.forEach(node => {

                if (node.nodeType === Node.ELEMENT_NODE && blockTags.includes(node.tagName)) {
                    blocks.push(node);
                    return;
                }

                if (node.nodeType === Node.TEXT_NODE) {
                    const lines = node.textContent.split(/\n/).filter(t => t.trim() !== "");
                    lines.forEach(text => {
                        const p = document.createElement("p");
                        p.textContent = text;
                        blocks.push(p);
                    });
                    return;
                }

                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
                    return;
                }
            });

            // Multiple blocks → wrap each as its own new tag
            if (blocks.length > 1) {
                const fragment2 = document.createDocumentFragment();

                blocks.forEach(b => {
                    const wrapper = document.createElement(tag);
                    wrapper.innerHTML = b.innerHTML ?? b.textContent ?? "";
                    fragment2.appendChild(wrapper);
                });

                range.deleteContents();
                range.insertNode(fragment2);
                editorModule.save();
                return;
            }

            // ============================================================
            // CASE C — Fallback: single block or inside root with no block
            // ============================================================
            const wrapper = document.createElement(tag);
            wrapper.appendChild(range.extractContents());
            range.insertNode(wrapper);

            editorModule.save();
        },


        // --- Lists ---
        toggleList(type = 'ul', list_class = 'disc') {
            const tailwind_type = {
                'disc': 'list-disc',
                'lower-alpha': 'list-lower-alpha',
                'decimal': 'list-decimal',
            };

            const sel = window.getSelection();
            const root = editorModule.editor;
            const parent = selectionHelpers(root).parent() || root;

            const listAncestor = parent.closest?.('ul, ol');

            // ================================================================
            // A. Already inside a list
            // ================================================================
            if (listAncestor) {

                // A1. Same type -> unwrap
                if (listAncestor.tagName.toLowerCase() === type) {
                    const fragment = document.createDocumentFragment();

                    [...listAncestor.children].forEach(li => {
                        const p = document.createElement('p');
                        p.innerHTML = li.innerHTML;
                        fragment.appendChild(p);
                    });

                    listAncestor.replaceWith(fragment);
                    editorModule.save();
                    return;
                }

                // A2. Convert UL <-> OL
                const newList = document.createElement(type);
                newList.classList.add(tailwind_type[list_class] || 'list-disc');
                newList.classList.add('list-inside');

                [...listAncestor.children].forEach(li => newList.appendChild(li));

                listAncestor.replaceWith(newList);
                editorModule.save();
                return;
            }

            // ================================================================
            // B. Turn selection into a list
            // ================================================================
            const range = sel.rangeCount ? sel.getRangeAt(0) : null;
            if (!range) return;

            const fragment = range.cloneContents();
            let blocks = [];

            fragment.childNodes.forEach(node => {

                if (node.nodeType === Node.ELEMENT_NODE &&
                    (node.tagName === 'P' || node.tagName === 'DIV')) {

                    blocks.push(node);
                    return;
                }

                if (node.nodeType === Node.TEXT_NODE) {
                    const parts = node.textContent.split(/\n/).filter(t => t.trim() !== "");
                    parts.forEach(t => {
                        const p = document.createElement('p');
                        p.textContent = t;
                        blocks.push(p);
                    });
                    return;
                }

                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
                    return;
                }

                if (node.textContent.trim() !== "") {
                    const p = document.createElement('p');
                    p.innerHTML = node.innerHTML ?? node.textContent;
                    blocks.push(p);
                }
            });

            // B1. No blocks (single line)
            if (blocks.length === 0) {
                let block = parent.closest?.('p, li, div') || parent;

                if (block === root) {
                    const list = document.createElement(type);
                    list.classList.add(tailwind_type[list_class] || 'list-disc');
                    list.classList.add('list-inside');

                    const li = document.createElement('li');
                    li.innerHTML = root.innerHTML;

                    list.appendChild(li);

                    root.innerHTML = "";
                    root.appendChild(list);

                    editorModule.save();
                    return;
                }

                const list = document.createElement(type);
                list.classList.add(tailwind_type[list_class] || 'list-disc');
                list.classList.add('list-inside');

                const li = document.createElement('li');
                li.innerHTML = block.innerHTML;

                list.appendChild(li);
                block.replaceWith(list);

                editorModule.save();
                return;
            }

            // B2. Multi-block selection → multi <li>
            const list = document.createElement(type);
            list.classList.add(tailwind_type[list_class] || 'list-disc');
            list.classList.add('list-inside');

            blocks.forEach(b => {
                const li = document.createElement('li');
                li.innerHTML = b.innerHTML ?? b.textContent ?? "";
                list.appendChild(li);
            });

            range.deleteContents();
            range.insertNode(list);

            editorModule.save();
        },


        // --- Insert HTML Snippets ---
        insertHTML(html) {
            const sel = selectionHelpers(editorModule.editor);
            sel.insert(html);
            editorModule.save();
        },

        changeIndent(increase = true) {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const range = selection.getRangeAt(0);
            let block = range.startContainer.nodeType === Node.TEXT_NODE
                ? range.startContainer.parentElement
                : range.startContainer;

            // Find nearest block element
            while (
                block &&
                !['P', 'DIV', 'LI', 'BLOCKQUOTE', 'PRE'].includes(block.tagName) &&
                !(block.tagName.startsWith('H') && block.tagName.length === 2)
                ) {
                block = block.parentElement;
            }
            if (!block) return;

            const anchorNode = selection.anchorNode;
            const anchorOffset = selection.anchorOffset;

            // If block is contenteditable, insert non-breaking spaces
            if (block.getAttribute('contenteditable')) {
                const originalRange = range.cloneRange();
                const firstNode = block.firstChild || block;

                const nbspNode = document.createTextNode('\u00A0\u00A0\u00A0\u00A0');
                const startRange = document.createRange();
                if (firstNode.nodeType === Node.TEXT_NODE) {
                    startRange.setStart(firstNode, 0);
                } else {
                    startRange.setStartBefore(firstNode);
                }
                startRange.insertNode(nbspNode);

                selection.removeAllRanges();
                selection.addRange(originalRange);
                return;
            }

            // Otherwise, adjust margin
            const currentMargin = parseInt(window.getComputedStyle(block).marginLeft) || 0;
            block.style.marginLeft = `${Math.max(0, currentMargin + (increase ? 20 : -20))}px`;

            // Restore caret
            if (anchorNode && document.body.contains(anchorNode)) {
                try {
                    const newRange = document.createRange();
                    newRange.setStart(anchorNode, Math.min(anchorOffset, anchorNode.length || 0));
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } catch (err) {
                    console.warn('Unable to restore selection:', err);
                }
            }
        },


        // --- Tables ---
        insertTable(rows = 2, cols = 2) {
            let tableHTML = '<table class="table-auto border-collapse w-full">';
            tableHTML += '<thead><tr>';
            for (let c = 0; c < cols; c++) {
                tableHTML += `<th class="border px-2 py-1">Header ${c + 1}</th>`;
            }
            tableHTML += '</tr></thead><tbody>';
            for (let r = 0; r < rows; r++) {
                tableHTML += '<tr>';
                for (let c = 0; c < cols; c++) {
                    tableHTML += `<td class="border px-2 py-1">Row ${r + 1}, Cell ${c + 1}</td>`;
                }
                tableHTML += '</tr>';
            }
            tableHTML += '</tbody></table>';

            this.insertHTML(tableHTML);
        },
    };
}
