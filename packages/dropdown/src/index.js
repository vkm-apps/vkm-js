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
        }
    }));

    Alpine.directive('dropdown', (el, { modifiers }, { cleanup }) => {
        // Prevent double initialization during Livewire morphs
        if (el._x_dropdown_initialized) return;
        el._x_dropdown_initialized = true;

        let { triggerEl, dropdownEl, position, closeOnClickInside, isHoverable } = getDropdownOptions(el, modifiers);

        if (!triggerEl || !dropdownEl) {
            return !triggerEl
                ? console.warn('Dropdown JS: Attribute data-trigger is not set!')
                : console.warn('Dropdown JS: Attribute data-dropdown is not set!');
        }

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
        triggerEl.setAttribute('aria-label', 'Dropdown');

        if (isHoverable) {
            triggerEl.setAttribute('x-on:mouseenter', 'clearHover(); open = true');
            triggerEl.setAttribute('x-on:mouseleave', 'startHoverClose()');
        } else {
            triggerEl.setAttribute('x-on:click', 'toggle()');
        }

        triggerEl.setAttribute('x-on:keydown.space.prevent', 'keyboardTrigger = true; open = true');
        triggerEl.setAttribute('x-on:keydown.enter.prevent', 'keyboardTrigger = true; open = true');
        triggerEl.setAttribute('x-on:keydown.down.prevent', 'keyboardTrigger = true; open = true');

        // 3. Teleport & Template Setup
        // x-teleport strictly requires a <template> tag.
        let templateEl;
        let panelEl;

        if (dropdownEl.tagName.toLowerCase() === 'template') {
            templateEl = dropdownEl;
            panelEl = templateEl.content.firstElementChild;
            if (!panelEl) {
                console.warn('Dropdown JS: <template data-dropdown> must contain a single root element.');
                return;
            }
        } else {
            // If data-dropdown is a <div>, wrap it into a <template> dynamically
            templateEl = document.createElement('template');
            // If inside Livewire, prevent morph engine from replacing the dynamic template
            templateEl.setAttribute('wire:ignore', '');
            dropdownEl.parentNode.insertBefore(templateEl, dropdownEl);
            templateEl.content.appendChild(dropdownEl);
            panelEl = dropdownEl;
        }

        templateEl.setAttribute('x-teleport', 'body');

        // 4. Configure Teleported Panel Element
        const placement = position || 'bottom-start';
        const isFixed = modifiers.includes('fixed') ? '.fixed' : '';
        const anchorAttr = `x-anchor${isFixed}.${placement}`;

        // Fallback to document.getElementById if $refs is resolving during a Livewire morph cycle
        panelEl.setAttribute(anchorAttr, `$refs.dropdownBtn || document.getElementById('${triggerEl.id}')`);
        panelEl.setAttribute('x-ref', 'panel');
        panelEl.setAttribute('x-cloak', '');
        panelEl.setAttribute('x-show', 'open || keyboardTrigger');
        panelEl.setAttribute('x-trap', 'keyboardTrigger');
        panelEl.setAttribute('x-transition.origin.top.left', '');
        panelEl.setAttribute('role', 'menu');
        panelEl.setAttribute('aria-orientation', 'vertical');
        panelEl.setAttribute('aria-labelledby', triggerEl.id);

        if (!modifiers.includes('custom')) {
            panelEl.classList.add(
                'absolute', 'mt-2', 'shadow-lg', 'backdrop-blur-lg',
                'bg-white/70', 'dark:bg-black/70', 'rounded-sm',
                'flex', 'flex-col', 'w-full', 'min-w-72', 'z-1000', 'py-2'
            );
        } else {
            panelEl.classList.add('absolute', 'z-1000');
        }

        // Fix click.outside racing with trigger button
        panelEl.setAttribute('x-on:click.outside', `if (!$refs.dropdownBtn || !$refs.dropdownBtn.contains($event.target)) close()`);

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

        // 5. Cleanup memory leaks during SPA navigation (wire:navigate)
        cleanup(() => {
            delete el._x_dropdown_initialized;
        });
    });

    function getDropdownOptions(el, modifiers) {
        let triggerEl = el.querySelector('[data-trigger]'),
            dropdownEl = el.querySelector('[data-dropdown]'),
            position = getPlacement(modifiers),
            isHoverable = modifiers.includes('hover'),
            closeOnClickInside = modifiers.includes('select');

        return { triggerEl, dropdownEl, position, closeOnClickInside, isHoverable };
    }

    function getPlacement(modifiers) {
        return ['top', 'top-start', 'top-end', 'right', 'right-start', 'right-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end'].find(i => modifiers.includes(i)) || '';
    }
}
