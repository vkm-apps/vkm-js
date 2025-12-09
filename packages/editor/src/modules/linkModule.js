export default function linkModule(editorModule) {
    return {
        linkText: '',
        linkUrl: '',
        linkTarget: '_self',
        selectedLink: null,
        range: null,
        popupId: null,
        popupEl: null,
        toolbarButtonEl: null, // store toolbar button ref if needed

        init(editorElement, toolbarButtonSelector = null) {
            this.popupId = 'link-popup-' + editorElement.id;
            // Allow passing toolbar button selector
            if (toolbarButtonSelector) {
                // Accept either an element or selector string
                this.toolbarButtonEl =
                    typeof toolbarButtonSelector === 'string'
                        ? document.querySelector(toolbarButtonSelector)
                        : toolbarButtonSelector;
            }

            editorElement.addEventListener('mouseup', (event) => this.checkForLinkClick(event));

            // Close popup on outside click
            document.addEventListener('click', (e) => {
                if (
                    this.popupEl &&
                    !this.popupEl.contains(e.target) &&
                    e.target !== this.toolbarButtonEl &&
                    !e.target.closest('a')
                ) {
                    this.closePopup();
                }
            });
        },

        checkForLinkClick(event) {
            if (event.target.tagName === 'A') {
                this.selectedLink = event.target;
                this.linkText = this.selectedLink.textContent;
                this.linkUrl = this.selectedLink.getAttribute('href') || '';
                this.linkTarget = this.selectedLink.getAttribute('target') || '_self';
                this.range = null;

                this.showLinkPopup();
                this.positionPopup(event.target);
            }
        },

        showPopup(event) {
            // If popup is already visible and triggered by button → toggle it
            if (this.popupEl && event?.currentTarget === this.toolbarButtonEl) {
                this.closePopup();
                return;
            }

            this.selectedLink = null;
            const selection = window.getSelection();
            this.range = selection.rangeCount ? selection.getRangeAt(0) : null;
            this.linkText = this.range?.toString() || '';
            this.linkUrl = '';
            this.linkTarget = '_self';

            this.showLinkPopup();

            // Position depending on trigger
            if (event?.currentTarget === this.toolbarButtonEl) {
                this.positionPopup(this.toolbarButtonEl);
            } else if (this.range) {
                this.positionPopup(this.range);
            }
        },

        showLinkPopup() {
            this.closePopup(); // remove old popup

            const label_class = 'block text-xs font-medium mt-2 mb-1';
            const input_class = 'rounded-md border border-black/5 dark:border-white/10 bg-transparent p-1 w-full text-xs h-7';
            const popup = document.createElement('div');
            popup.id = this.popupId;
            popup.className = 'absolute backdrop-blur-lg bg-white/90 dark:bg-black/90 p-4 shadow-lg border border-dark/5 rounded-md flex flex-col w-64 z-50';
            popup.innerHTML = `
                <label class="${label_class}">URL:</label>
                <input type="text" id="link-url" class="${input_class}" value="${this.linkUrl}">
                <label class="${label_class}">Text (Optional):</label>
                <input type="text" id="link-text" class="${input_class}" value="${this.linkText}">
                <label class="${label_class}">Target:</label>
                <select id="link-target" class="${input_class} px-2">
                    <option value="_self" ${this.linkTarget === '_self' ? 'selected' : ''}>Same Window (_self)</option>
                    <option value="_blank" ${this.linkTarget === '_blank' ? 'selected' : ''}>New Tab (_blank)</option>
                    <option value="_parent" ${this.linkTarget === '_parent' ? 'selected' : ''}>Parent Frame (_parent)</option>
                    <option value="_top" ${this.linkTarget === '_top' ? 'selected' : ''}>Top Window (_top)</option>
                </select>

                <button type="button" id="insert-link-btn" class="mt-3 bg-blue-500 text-sm text-white px-3 py-1 rounded-md hover:cursor-pointer hover:opacity-80">Insert Link</button>
            `;

            document.body.appendChild(popup);
            this.popupEl = popup;

            popup.querySelector('#insert-link-btn').addEventListener('click', () => this.insertOrUpdateLink());
        },

        closePopup() {
            if (this.popupEl) {
                this.popupEl.remove();
                this.popupEl = null;
            }
        },

        positionPopup(target) {
            const popup = this.popupEl;
            if (!popup) return;

            let rect;
            if (target instanceof Range) {
                rect = target.getBoundingClientRect();
            } else {
                rect = target.getBoundingClientRect();
            }

            const top = rect.bottom + window.scrollY + 6;
            const left = Math.min(rect.left + window.scrollX, window.innerWidth - popup.offsetWidth - 10);

            popup.style.top = `${top}px`;
            popup.style.left = `${left}px`;
        },

        insertOrUpdateLink() {
            const textVal = document.getElementById('link-text').value.trim();
            let urlVal = document.getElementById('link-url').value.trim();
            const targetVal = document.getElementById('link-target').value;

            if (!urlVal) return;

            if (!urlVal.startsWith('http://') && !urlVal.startsWith('https://')) {
                urlVal = `https://${urlVal}`;
            }

            const linkStyle = "color:#007bff;text-decoration:underline;font-weight:bold;transition:color 0.2s;";

            if (this.selectedLink) {
                this.selectedLink.href = urlVal;
                this.selectedLink.target = targetVal;
                this.selectedLink.textContent = textVal || urlVal;
                this.selectedLink.setAttribute("style", linkStyle);
            } else if (this.range) {
                const link = document.createElement('a');
                link.href = urlVal;
                link.target = targetVal;
                link.textContent = textVal || urlVal;
                link.setAttribute("style", linkStyle);
                this.range.deleteContents();
                this.range.insertNode(link);
            }

            this.closePopup();
            editorModule.save();
        }
    };
}
