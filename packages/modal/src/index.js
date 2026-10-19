export default function (Alpine) {
    function getSize(modifiers) {
        return ['sm', 'md', 'lg', 'xl', 'xxl', 'fullscreen'].find(i => modifiers.includes(i)) || null;
    }

    function getPosition(modifiers) {
        return ['top', 'bottom'].find(i => modifiers.includes(i)) || null;
    }

    Alpine.data('modal', () => ({
        open: false,
        overflow: false,

        init() {
            // Backdrop / modal visibility is bound with Alpine; only the body scroll lock is imperative
            this.$watch('open', (value) => this.lockBody(value));
        },

        toggleModal() {
            this.open = !this.open;
        },

        lockBody(locked) {
            if (this.overflow) {
                document.body.style.overflow = locked ? 'hidden' : '';
            }
        },

        // Delegated [data-close] handling, so close buttons added later (e.g. Livewire) just work
        closeFromClick(event, root) {
            const closeEl = event.target && event.target.closest ? event.target.closest('[data-close]') : null;
            if (this.open && closeEl && root.contains(closeEl)) {
                this.toggleModal();
            }
        },

        destroy() {
            if (this.open) this.lockBody(false);
        }
    }));

    /**
     * All markup preparation happens in interceptInit: Alpine calls it for every element
     * BEFORE it reads that element's attributes and before it walks the children. That way the
     * attributes we add (x-data, x-init, x-teleport, x-show...) are processed in the very same
     * pass and in the right order, including when the user wrote their own x-teleport.
     */
    Alpine.interceptInit((el) => {
        const found = findDirective(el, 'modal');
        // mutateDom: keep Alpine's MutationObserver from re-processing the attributes we add
        if (found) Alpine.mutateDom(() => setupModal(el, found.modifiers, found.expression));
    });

    Alpine.directive('modal', (el, _, { cleanup }) => {
        cleanup(() => {
            delete el._x_modal_initialized;
        });
    });

    function findDirective(el, name) {
        if (!el.getAttributeNames) return null;
        const full = Alpine.prefixed(name);
        for (const attr of el.getAttributeNames()) {
            if (attr === full || attr.startsWith(full + '.')) {
                return { modifiers: attr.split('.').slice(1), expression: el.getAttribute(attr) };
            }
        }
        return null;
    }

    function setupModal(el, modifiers, expression) {
        // Prevent double initialization during Livewire morphs
        if (el._x_modal_initialized) return;

        const triggerEl = el.querySelector('[data-trigger]'),
            templateEl = el.querySelector(':scope > template'),
            transition = expression || 'fade',
            size = getSize(modifiers),
            position = getPosition(modifiers),
            show = modifiers.includes('show'),
            overflow = modifiers.includes('overflow'),
            noCloseOnBackdrop = modifiers.includes('no-close');

        if (!templateEl) {
            return console.warn(
                el.querySelector('[data-modal]')
                    ? 'Modal JS: data-modal is no longer supported. Put the modal content in a <template> that is a direct child of the x-modal element.'
                    : 'Modal JS: expected a <template> as a direct child of the x-modal element.',
                el
            );
        }

        if (!templateEl.content.children.length && !templateEl.content.textContent.trim()) {
            return console.warn('Modal JS: the <template> is empty.', templateEl);
        }

        el._x_modal_initialized = true;

        if (!el.id) {
            el.id = crypto.getRandomValues(new Uint32Array(1))[0].toString(36) + Date.now().toString(36);
        }

        el.setAttribute('x-data', 'modal');
        el.setAttribute('x-init', `overflow = ${overflow}; open = ${show}`);

        // Build the teleported structure once. x-teleport only clones the first root element, so
        // the backdrop and the modal live together inside one generated root:
        // <div data-vkm-modal> <backdrop> + <div.modal> <div.modal-content>…</div> </div> </div>
        if (!templateEl._vkm_wrapped) {
            templateEl._vkm_wrapped = true;
            buildModalStructure(templateEl, { size, position, transition, noCloseOnBackdrop, id: el.id });
        }

        // Livewire must not morph the (inert) template content
        templateEl.setAttribute('wire:ignore', '');

        // x-teleport target: honour the one written by the user, default to <body>
        applyTeleportTarget(templateEl, 'Modal JS');

        // Setup trigger
        if (triggerEl) {
            if (!triggerEl.id) triggerEl.id = `btn-${el.id}`;
            triggerEl.setAttribute('x-on:click', 'toggleModal');
            triggerEl.setAttribute('aria-haspopup', 'dialog');
            triggerEl.setAttribute(':aria-expanded', 'open.toString()');
        }
    }

    function buildModalStructure(templateEl, { size, position, transition, noCloseOnBackdrop, id }) {
        const content = templateEl.content;
        const doc = content.ownerDocument;

        // Pick up a user supplied <backdrop>, otherwise create one
        let backdropEl = [...content.children].find(c => c.tagName === 'BACKDROP');
        if (backdropEl) {
            backdropEl.remove();
        } else {
            backdropEl = doc.createElement('backdrop');
        }

        // The modal element receives the template's class, id, style, role and aria-* attributes
        const modalEl = doc.createElement('div');
        for (const attr of [...templateEl.attributes]) {
            if (['class', 'id', 'style', 'role'].includes(attr.name) || attr.name.startsWith('aria-')) {
                modalEl.setAttribute(attr.name, attr.value);
            }
        }
        templateEl.removeAttribute('id');

        while (content.firstChild) {
            modalEl.appendChild(content.firstChild);
        }

        // Wrap content inside modal-content if missing
        let modalContent = modalEl.querySelector('.modal-content');
        if (!modalContent) {
            modalContent = doc.createElement('div');
            modalContent.className = 'modal-content';
            while (modalEl.firstChild) {
                modalContent.appendChild(modalEl.firstChild);
            }
            modalEl.appendChild(modalContent);
        }

        // Apply global configuration overrides from window.vkmConfig.modal
        const userConfig = (typeof window !== 'undefined' && window.vkmConfig && window.vkmConfig.modal) || {};
        if (userConfig.colors) {
            const customColors = Array.isArray(userConfig.colors) ? userConfig.colors : userConfig.colors.split(' ').filter(Boolean);
            modalContent.classList.add(...customColors);
        }
        if (userConfig.contentClasses) {
            const extraClasses = Array.isArray(userConfig.contentClasses) ? userConfig.contentClasses : userConfig.contentClasses.split(' ').filter(Boolean);
            modalContent.classList.add(...extraClasses);
        }
        if (userConfig.backdropClasses) {
            backdropEl.className = userConfig.backdropClasses;
        }

        modalEl.classList.add('modal');
        if (size) modalEl.classList.add(`modal-${size}`);
        if (position) modalEl.classList.add(`modal-${position}`);
        if (!modalEl.hasAttribute('role')) modalEl.setAttribute('role', 'dialog');
        modalEl.setAttribute('aria-modal', 'true');

        // Bindings for modal visibility & transitions
        modalEl.setAttribute(':class', "{'modal-show': open}");
        modalEl.setAttribute('x-show', 'open');
        modalEl.setAttribute('x-transition:enter-start', `modal-${transition}-hide`);
        modalEl.setAttribute('x-transition:enter-end', `modal-${transition}-show`);
        modalEl.setAttribute('x-transition:leave-start', `modal-${transition}-show`);
        modalEl.setAttribute('x-transition:leave-end', `modal-${transition}-hide`);

        modalContent.setAttribute('x-cloak', '');
        modalContent.setAttribute('x-show', 'open');

        // Add a close button if none exists
        if (!modalEl.querySelector('[data-close]')) {
            const userConfig = (window.vkmConfig && window.vkmConfig.modal) || {};
            const closeBtn = doc.createElement('button');
            closeBtn.type = 'button';
            closeBtn.className = userConfig.closeButtonClasses || "relative text-initial z-20 float-right flex items-center justify-center transition-all w-8 h-8 rounded-lg text-black/50 dark:text-white/60 hover:text-black/80 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 shadow-none!";
            closeBtn.setAttribute('data-close', '');
            closeBtn.innerHTML = `<svg width="20" height="20" class="fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>`;
            if (modalEl.querySelector('.modal-header')) {
                modalEl.querySelector('.modal-header').appendChild(closeBtn);
            } else {
                modalContent.insertAdjacentElement('beforebegin', closeBtn);
                closeBtn.classList.add('absolute', 'top-6', 'right-6');
            }
        }

        // Backdrop click closes modal unless no-close is set
        backdropEl.setAttribute(':class', "{'show': open}");
        if (!noCloseOnBackdrop) {
            backdropEl.setAttribute('x-on:click', 'if (open) toggleModal()');
        }

        // Single teleported root
        const root = doc.createElement('div');
        root.setAttribute('data-vkm-modal', id);
        root.setAttribute('x-on:click', 'closeFromClick($event, $el)');
        root.setAttribute('x-on:close-modal.window', 'if (open) toggleModal()');
        root.appendChild(backdropEl);
        root.appendChild(modalEl);
        content.appendChild(root);
    }

    /**
     * Keeps a user-written x-teleport (e.g. x-teleport="#app-root") and falls back to <body>
     * when it is missing or points to an element that does not exist.
     */
    function applyTeleportTarget(templateEl, label) {
        const attrName = templateEl.getAttributeNames().find(n => n === 'x-teleport' || n.startsWith('x-teleport.'));

        if (!attrName) {
            templateEl.setAttribute('x-teleport', 'body');
            return;
        }

        const selector = templateEl.getAttribute(attrName);
        let found = true;
        try {
            found = !!document.querySelector(selector);
        } catch (e) {
            found = false;
        }

        if (!found) {
            console.warn(`${label}: x-teleport target "${selector}" was not found, using <body> instead.`);
            templateEl.removeAttribute(attrName);
            templateEl.setAttribute('x-teleport', 'body');
        }
    }
}
