export default function selectionHelpers(editorEl) {
    const sel = window.getSelection();

    function getRange() {
        return sel.rangeCount ? sel.getRangeAt(0) : null;
    }

    return {
        raw: sel,

        text() {
            return sel.toString();
        },

        isCollapsed() {
            return sel.isCollapsed;
        },

        range() {
            return getRange();
        },

        parent() {
            const p = sel.anchorNode?.parentElement ?? null;
            if (!p) return null;

            // Prevent returning the root contenteditable element
            return p === editorEl ? null : p;
        },

        wrap(tag) {
            const range = getRange();
            if (!range || range.collapsed) return null;

            const wrapper = document.createElement(tag);
            const fragment = range.extractContents();
            wrapper.appendChild(fragment);
            range.insertNode(wrapper);

            // Move cursor after wrapper
            sel.removeAllRanges();
            const newRange = document.createRange();
            if (wrapper.parentNode) {
                newRange.setStartAfter(wrapper);
            }
            newRange.collapse(true);
            sel.addRange(newRange);

            return wrapper;
        },

        insert(html) {
            const range = getRange();
            if (!range) return null;

            const temp = document.createElement("div");
            temp.innerHTML = html;

            const fragment = document.createDocumentFragment();
            Array.from(temp.childNodes).forEach(node => fragment.appendChild(node));

            range.deleteContents();
            range.insertNode(fragment);

            // Collapse selection to the end
            sel.removeAllRanges();
            const newRange = document.createRange();
            const last = fragment.lastChild;
            if (last && last.parentNode) {
                newRange.setStartAfter(last);
            }
            newRange.collapse(true);
            sel.addRange(newRange);

            return fragment;
        },

        surround(node) {
            const range = getRange();
            if (!range || range.collapsed) return null;

            try {
                range.surroundContents(node);

                sel.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(node);
                sel.addRange(newRange);

                return node;
            } catch (err) {
                console.warn("Selection cannot be surrounded:", err);
                return null;
            }
        },

        replace(fn) {
            const range = getRange();
            if (!range) return null;

            const fragment = range.extractContents();
            const replacement = fn(fragment);

            // Normalize replacement
            let nodeToInsert;
            if (replacement instanceof DocumentFragment) {
                nodeToInsert = replacement;
            } else if (replacement instanceof Node) {
                nodeToInsert = replacement;
            } else {
                nodeToInsert = document.createTextNode(String(replacement ?? ""));
            }

            range.insertNode(nodeToInsert);

            // Collapse selection safely
            sel.removeAllRanges();
            const newRange = document.createRange();

            if (nodeToInsert instanceof DocumentFragment) {
                const last = nodeToInsert.lastChild;
                if (last && last.parentNode) {
                    newRange.setStartAfter(last);
                }
            } else if (nodeToInsert instanceof Node) {
                if (nodeToInsert.parentNode) {
                    newRange.setStartAfter(nodeToInsert);
                }
            } else {
                newRange.setStart(range.endContainer, range.endOffset);
            }

            newRange.collapse(true);
            sel.addRange(newRange);

            return nodeToInsert;
        }
    };
}
