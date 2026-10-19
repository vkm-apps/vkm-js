export default function (Alpine) {
    Alpine.data('dropdown', () => ({
        open: false,
        exitHover: null,
        keyboardTrigger: false,

        toggle() {
            this.open ? this.close() : this.openDropdown();
        },
        openDropdown() {
            this.open = true;
        },
        close(focusAfter) {
            this.open = false;
            this.keyboardTrigger = false;
            this.clearHover();
            if (focusAfter && typeof focusAfter.focus === 'function') {
                focusAfter.focus();
            }
        },
        clearHover() {
            if (this.exitHover) {
                clearTimeout(this.exitHover);
                this.exitHover = null;
            }
        },
        startHoverClose() {
            this.clearHover();
            this.exitHover = setTimeout(() => {
                this.close();
            }, 150); // 150ms buffer to cross the gap to the teleported menu
        },

        /**
         * Used by the panel's click.outside handler. A click is "inside" when it lands on
         * the trigger, on this dropdown's panel, or on the panel of a dropdown nested in this
         * one (the nested panel is teleported, so it is not a DOM child of ours).
         */
        isInside(event, ownId) {
            const target = event.target;
            if (!target || typeof target.closest !== 'function') return false;

            const trigger = this.$refs.dropdownBtn;
            if (trigger && trigger.contains(target)) return true;

            let panel = target.closest('[data-vkm-dropdown-panel]');
            while (panel) {
                const owner = panel.getAttribute('data-vkm-dropdown-panel');
                if (owner === ownId) return true;
                const ownerEl = document.getElementById(owner);
                panel = ownerEl && ownerEl.parentElement
                    ? ownerEl.parentElement.closest('[data-vkm-dropdown-panel]')
                    : null;
            }
            return false;
        }
    }));

    /**
     * All markup preparation happens in interceptInit: Alpine calls it for every element
     * BEFORE it reads that element's attributes and before it walks the children. That way the
     * attributes we add (x-data, x-ref, x-teleport, x-show...) are processed in the very same
     * pass and in the right order, including when the user wrote their own x-teleport.
     */
    Alpine.interceptInit((el) => {
        const found = findDirective(el, 'dropdown');
        // mutateDom: keep Alpine's MutationObserver from re-processing the attributes we add
        if (found) Alpine.mutateDom(() => setupDropdown(el, found.modifiers));
    });

    Alpine.directive('dropdown', (el, _, { cleanup }) => {
        // Cleanup memory leaks during SPA navigation (wire:navigate)
        cleanup(() => {
            delete el._x_dropdown_initialized;
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

    function setupDropdown(el, modifiers) {
        // Prevent double initialization during Livewire morphs
        if (el._x_dropdown_initialized) return;

        let { triggerEl, templateEl, position, closeOnClickInside, isHoverable } = getDropdownOptions(el, modifiers);

        if (!triggerEl) {
            return console.warn('Dropdown JS: Attribute data-trigger is not set!', el);
        }

        if (!templateEl) {
            return console.warn(
                el.querySelector('[data-dropdown]')
                    ? 'Dropdown JS: data-dropdown is no longer supported. Put the dropdown content in a <template> that is a direct child of the x-dropdown element.'
                    : 'Dropdown JS: expected a <template> as a direct child of the x-dropdown element.',
                el
            );
        }

        if (!templateEl.content.children.length && !templateEl.content.textContent.trim()) {
            return console.warn('Dropdown JS: the <template> is empty.', templateEl);
        }

        el._x_dropdown_initialized = true;

        // Generate stable IDs for DOM resilience
        if (!el.id) {
            el.id = 'dd-' + (crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36));
        }
        if (!triggerEl.id) {
            triggerEl.id = `btn-${el.id}`;
        }

        // 1. Ensure el has x-data="dropdown" initialized
        if (!el.hasAttribute('x-data')) {
            el.setAttribute('x-data', 'dropdown');
        }

        el.classList.add('relative');
        el.setAttribute('x-on:keydown.esc.window', 'close($refs.dropdownBtn)');
        el.setAttribute('x-on:keydown.escape.prevent.stop', 'close($refs.dropdownBtn)');

        // 2. Configure Trigger Element
        triggerEl.setAttribute('x-ref', 'dropdownBtn');
        triggerEl.setAttribute(':aria-expanded', '(open || keyboardTrigger).toString()');
        triggerEl.setAttribute('aria-haspopup', 'true');
        if (!triggerEl.hasAttribute('aria-label')) {
            triggerEl.setAttribute('aria-label', 'Dropdown');
        }

        if (isHoverable) {
            triggerEl.setAttribute('x-on:mouseenter', 'clearHover(); open = true');
            triggerEl.setAttribute('x-on:mouseleave', 'startHoverClose()');
        } else {
            triggerEl.setAttribute('x-on:click', 'toggle()');
        }

        triggerEl.setAttribute('x-on:keydown.space.prevent', 'keyboardTrigger = true; open = true');
        triggerEl.setAttribute('x-on:keydown.enter.prevent', 'keyboardTrigger = true; open = true');
        triggerEl.setAttribute('x-on:keydown.down.prevent', 'keyboardTrigger = true; open = true');

        // 3. Panel setup: the template content is always wrapped in one generated element,
        // because x-teleport only clones the first root element of a template.
        const panelEl = wrapTemplateContent(templateEl);

        // Livewire must not morph the (inert) template content
        templateEl.setAttribute('wire:ignore', '');

        // x-teleport target: honour the one written by the user, default to <body>
        applyTeleportTarget(templateEl, 'Dropdown JS');

        // 4. Configure Teleported Panel Element
        const placement = position || 'bottom-start';
        const isFixed = modifiers.includes('fixed') ? '.fixed' : '';
        const anchorAttr = `x-anchor${isFixed}.${placement}`;

        // Fallback to document.getElementById if $refs is resolving during a Livewire morph cycle
        panelEl.setAttribute(anchorAttr, `$refs.dropdownBtn || document.getElementById('${triggerEl.id}')`);
        panelEl.setAttribute('x-ref', 'panel');
        panelEl.setAttribute('data-vkm-dropdown-panel', el.id);
        panelEl.setAttribute('x-cloak', '');
        panelEl.setAttribute('x-show', 'open || keyboardTrigger');
        panelEl.setAttribute('x-trap', 'keyboardTrigger');
        panelEl.setAttribute('x-transition.origin.top.left', '');
        if (!panelEl.hasAttribute('role')) panelEl.setAttribute('role', 'menu');
        panelEl.setAttribute('aria-orientation', 'vertical');
        if (!panelEl.hasAttribute('aria-labelledby')) panelEl.setAttribute('aria-labelledby', triggerEl.id);

        // Smart class resolution: respect classes on <template> and global config in window.vkmConfig
        const userConfig = (typeof window !== 'undefined' && window.vkmConfig && window.vkmConfig.dropdown) || (Alpine.vkm && Alpine.vkm.dropdown) || {};
        const existingClasses = (panelEl.className || '').split(/\s+/).filter(Boolean);

        const hasUserWidth = existingClasses.some(c => /^w-(?!max$)/.test(c));
        const hasUserMinWidth = existingClasses.some(c => /^min-w-/.test(c));
        const hasUserMaxWidth = existingClasses.some(c => /^max-w-/.test(c));
        const hasUserBg = existingClasses.some(c => /^bg-/.test(c));
        const hasUserBorder = existingClasses.some(c => /^(border$|border-)/.test(c));
        const hasUserText = existingClasses.some(c => /^text-/.test(c));

        if (!modifiers.includes('custom')) {
            if (userConfig.classes) {
                const customClasses = Array.isArray(userConfig.classes) ? userConfig.classes : userConfig.classes.split(' ').filter(Boolean);
                panelEl.classList.add(...customClasses);
            } else {
                // Structural classes
                panelEl.classList.add('absolute', 'mt-2', 'shadow-xl', 'backdrop-blur-md', 'rounded-lg', 'flex', 'flex-col', 'z-1000', 'py-1');

                // Sizing: w-max and min-w-48 (user friendly width) unless user specified in template
                if (!hasUserWidth) panelEl.classList.add('w-max');
                if (!hasUserMinWidth) panelEl.classList.add(userConfig.minWidth || 'min-w-48');
                if (!hasUserMaxWidth) panelEl.classList.add('max-w-[calc(100vw-2rem)]');

                // Colors: user colors via app.js (window.vkmConfig.dropdown.colors) or default translucent x-form style
                if (userConfig.colors) {
                    const customColors = Array.isArray(userConfig.colors) ? userConfig.colors : userConfig.colors.split(' ').filter(Boolean);
                    panelEl.classList.add(...customColors);
                } else {
                    if (!hasUserBg) panelEl.classList.add('bg-white/95', 'dark:bg-black/85');
                    if (!hasUserBorder) panelEl.classList.add('border', 'border-black/20', 'dark:border-white/25');
                    if (!hasUserText) panelEl.classList.add('text-black/80', 'dark:text-white/90');
                }
            }
        } else {
            panelEl.classList.add('absolute', 'z-1000');
            if (!hasUserWidth) panelEl.classList.add('w-max');
            if (!hasUserMinWidth) panelEl.classList.add(userConfig.minWidth || 'min-w-48');
            if (!hasUserMaxWidth) panelEl.classList.add('max-w-[calc(100vw-2rem)]');
        }

        // Fix click.outside racing with trigger button (and with nested, teleported dropdowns)
        panelEl.setAttribute('x-on:click.outside', `if (!isInside($event, ${JSON.stringify(el.id)})) close()`);

        if (closeOnClickInside) {
            panelEl.setAttribute('x-on:click', 'close($refs.dropdownBtn)');
        }

        // Hover handling on teleported element
        if (isHoverable) {
            panelEl.setAttribute('x-on:mouseenter', 'clearHover()');
            panelEl.setAttribute('x-on:mouseleave', 'startHoverClose()');
        }

        // Keyboard navigation
        panelEl.setAttribute('x-on:keydown.down.prevent', '$focus.wrap().next()');
        panelEl.setAttribute('x-on:keydown.up.prevent', '$focus.wrap().previous()');
        panelEl.setAttribute('x-on:keydown.tab', 'close()');
        panelEl.setAttribute('x-on:keydown.shift.tab', 'close()');
    }

    function getDropdownOptions(el, modifiers) {
        let triggerEl = el.querySelector('[data-trigger]'),
            templateEl = el.querySelector(':scope > template'),
            position = getPlacement(modifiers),
            isHoverable = modifiers.includes('hover'),
            closeOnClickInside = modifiers.includes('select');

        return { triggerEl, templateEl, position, closeOnClickInside, isHoverable };
    }

    function getPlacement(modifiers) {
        return ['top', 'top-start', 'top-end', 'right', 'right-start', 'right-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end'].find(i => modifiers.includes(i)) || '';
    }

    /**
     * Moves everything inside the template into a single generated <div>.
     * The template's class, id, style, role and aria-* attributes are copied onto that div,
     * so `<template class="w-64 p-2">` styles the panel. Idempotent.
     */
    function wrapTemplateContent(templateEl) {
        if (templateEl._vkm_wrapped) return templateEl.content.firstElementChild;
        templateEl._vkm_wrapped = true;

        const wrapper = templateEl.content.ownerDocument.createElement('div');

        for (const attr of [...templateEl.attributes]) {
            if (['class', 'id', 'style', 'role'].includes(attr.name) || attr.name.startsWith('aria-')) {
                wrapper.setAttribute(attr.name, attr.value);
            }
        }
        // The id now lives on the panel, avoid a duplicate in the document
        templateEl.removeAttribute('id');

        while (templateEl.content.firstChild) {
            wrapper.appendChild(templateEl.content.firstChild);
        }
        templateEl.content.appendChild(wrapper);

        return wrapper;
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
