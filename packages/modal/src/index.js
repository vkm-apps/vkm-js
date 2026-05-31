export default function (Alpine) {
    function getSize(modifiers) {
        return ['sm', 'md', 'lg', 'xl', 'xxl', 'fullscreen'].find(i => modifiers.includes(i)) || null;
    }

    function getPosition(modifiers) {
        return ['top', 'bottom'].find(i => modifiers.includes(i)) || null;
    }

    function getModalElements(el, modifiers, expression) {
        let triggerEl = el.querySelector('[data-trigger]'),
            modalEl = el.querySelector('[data-modal]'),
            closeEl = el.querySelector('[data-close]'),
            transition = expression || 'fade',
            size = getSize(modifiers),
            position = getPosition(modifiers),
            show = modifiers.includes('show'),
            overflow = modifiers.includes('overflow'),
            noCloseOnBackdrop = modifiers.includes('no-close');

        let backdropEl = el.querySelector('backdrop');
        if (!backdropEl) {
            // Create backdrop element dynamically if missing
            backdropEl = document.createElement('backdrop');
            el.insertBefore(backdropEl, modalEl);
        }

        if (show) {
            backdropEl.classList.add('show');
        }

        return { triggerEl, modalEl, closeEl, backdropEl, transition, size, position, show, overflow, noCloseOnBackdrop };
    }

    Alpine.data('modal', () => ({
        open: false,
        modalEl: null,
        backdropEl: null,
        overflow: false,

        init() {
            if (this.open) {
                this.showBackdrop();
                this.modalEl.classList.add('modal-show');
            }
        },

        toggleModal() {
            this.open = !this.open;
            if (this.open) {
                this.showBackdrop();
                this.modalEl.classList.add('modal-show');
            } else {
                this.modalEl.classList.remove('modal-show');
                this.removeBackdrop();
            }
        },

        showBackdrop() {
            this.backdropEl.classList.add('show');
            if (this.overflow) {
                document.body.style.overflow = 'hidden';
            }
        },

        removeBackdrop() {
            this.backdropEl.classList.remove('show');
            if (this.overflow) {
                document.body.style.overflow = '';
            }
        }
    }));

    Alpine.directive('modal', (el, { modifiers, expression }, { cleanup }) => {
        const { triggerEl, modalEl, closeEl, backdropEl, transition, size, position, show, overflow, noCloseOnBackdrop } = getModalElements(el, modifiers, expression);

        if (!modalEl) {
            return console.warn('Modal JS: Attribute data-modal is not set!');
        }

        if (!el.id) {
            el.id = crypto.getRandomValues(new Uint32Array(1))[0].toString(36) + Date.now().toString(36);
        }

        el.setAttribute('x-data', 'modal');
        el.setAttribute('x-init', `modalEl = $el.querySelector('[data-modal]'); backdropEl = $el.querySelector('backdrop'); overflow = ${overflow}; open = ${show}`);

        // Add modal base class and size/position classes
        modalEl.classList.add('modal');
        if (size) modalEl.classList.add(`modal-${size}`);
        if (position) modalEl.classList.add(`modal-${position}`);

        // Set bindings for modal visibility & transitions
        modalEl.setAttribute(':class', "{'modal-show': open}");
        modalEl.setAttribute('x-show', 'open');
        modalEl.setAttribute('x-transition:enter-start', `modal-${transition}-hide`);
        modalEl.setAttribute('x-transition:enter-end', `modal-${transition}-show`);
        modalEl.setAttribute('x-transition:leave-start', `modal-${transition}-show`);
        modalEl.setAttribute('x-transition:leave-end', `modal-${transition}-hide`);

        // Wrap content inside modal-content if missing
        let modalContent = modalEl.querySelector('.modal-content');
        if (!modalContent) {
            const content = modalEl.innerHTML;
            modalEl.innerHTML = `<div class="modal-content">${content}</div>`;
            modalContent = modalEl.querySelector('.modal-content');
        }
        modalContent.setAttribute('x-cloak', '');
        modalContent.setAttribute('x-show', 'open');

        // Setup triggers
        if (triggerEl) {
            triggerEl.id = `btn-${el.id}`;
            triggerEl.setAttribute('x-on:click', 'toggleModal');
        }

        // Setup close button behavior
        if (closeEl) {
            closeEl.setAttribute('x-on:click', 'toggleModal');
            closeEl.setAttribute('x-on:close-modal.window', 'if (open) toggleModal()');
        } else {
            // Add a close button if none exists
            const closeBtn = document.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = "relative text-initial z-20 float-right flex items-center justify-center transition-all w-8 h-8 rounded-md text-light active:bg-dark/10 hover:bg-dark/5 dark:hover:bg-white/5 shadow-none!";
            closeBtn.setAttribute('x-on:click', 'toggleModal');
            closeBtn.setAttribute('x-on:close-modal.window', 'if (open) toggleModal()');
            closeBtn.setAttribute('data-close', '');
            closeBtn.innerHTML = `<svg width="20" height="20" class="fill-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
            if (modalEl.querySelector('.modal-header')) {
                modalEl.querySelector('.modal-header').appendChild(closeBtn);
            } else {
                modalEl.querySelector('.modal-content').insertAdjacentElement('beforebegin', closeBtn);
                closeBtn.classList.add('absolute', 'top-6', 'right-6');
            }
        }

        // Backdrop click closes modal unless no-close is set
        if (!noCloseOnBackdrop) {
            const closeModalOnBackdrop = (e) => {
                if (!e.composedPath().includes(modalEl) && modalEl.classList.contains('modal-show')) {
                    const closeButton = modalEl.querySelector('[data-close]');
                    if (closeButton) closeButton.click();
                }
            };
            backdropEl.addEventListener('click', closeModalOnBackdrop);
            cleanup(() => backdropEl.removeEventListener('click', closeModalOnBackdrop));
        }
    });
}
