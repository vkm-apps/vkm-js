export default function (Alpine) {
    Alpine.data('dropdown', () => ({
        open: false,
        exitHover: false,
        keyboardTrigger: false,
        toggle() {
            this.open = this.open ? this.close() : true;
        },
        close(focusAfter) {
            this.open = false;
            this.keyboardTrigger = false;
            focusAfter && focusAfter.focus();
        }
    }));

    Alpine.directive('dropdown', (el, {modifiers}, {cleanup}) => {
        let {triggerEl, dropdownEl, position, closeOnClickInside, isHoverable} = getDropdownOptions(el, modifiers);
        const placement = 'x-anchor.' + (position || 'bottom-start');

        if (!triggerEl || !dropdownEl) {
            return !triggerEl
                ? console.warn('Dropdown JS: Attribute data-trigger is not set!')
                : console.warn('Dropdown JS: Attribute data-dropdown is not set!');
        }

        if (!el.id) {
            //random id for parent element if not exists
            el.id = crypto.getRandomValues(new Uint32Array(1))[0].toString(36) + Date.now().toString(36);
        }

        //Popover wrapper add x-data
        el.setAttribute('x-data', 'dropdown');
        el.classList.add('relative');
        el.setAttribute('x-on:keydown.esc.window', 'close()');
        el.setAttribute('x-on:keydown.escape.prevent.stop', 'close()');
        // el.setAttribute('x-on:focusin.window', '$refs.panel.contains($event.target) && close()');

        //Element on click via data-toggle
        if (isHoverable) {
            triggerEl.setAttribute('x-on:mouseover', 'open = true');
            el.setAttribute('x-on:mouseenter', "exitHover ? clearTimeout(exitHover) : true");
            el.setAttribute('x-on:mouseleave.prevent', "exitHover = setTimeout(() => { open = false }, 50)");
        }
        else {
            triggerEl.setAttribute('x-on:click', 'toggle()');
        }

        if (!triggerEl.id) {
            triggerEl.id = `btn-${el.id}`;
        }

        triggerEl.setAttribute('x-ref', 'dropdownBtn');
        triggerEl.setAttribute('x-on:keydown.space.prevent', 'keyboardTrigger = true');
        triggerEl.setAttribute('x-on:keydown.enter.prevent', 'keyboardTrigger = true');
        triggerEl.setAttribute('x-on:keydown.down.prevent', 'keyboardTrigger = true');
        triggerEl.setAttribute(':aria-expanded', '(open || keyboardTrigger).toString()');
        triggerEl.setAttribute('aria-haspopup', 'true');
        triggerEl.setAttribute('aria-label', 'Dropdown');

        //Popover element data-popover
        dropdownEl.setAttribute('x-cloak', '');
        dropdownEl.setAttribute('x-transition.origin.top.left', '');
        dropdownEl.setAttribute('x-trap', 'keyboardTrigger');
        dropdownEl.setAttribute(placement, '$refs.dropdownBtn');
        dropdownEl.setAttribute('x-ref', 'panel');
        dropdownEl.setAttribute('x-show', 'open || keyboardTrigger');

        if (!modifiers.includes('custom')) {
            dropdownEl.classList.add('absolute', 'mt-2', 'shadow-lg', 'backdrop-blur-lg', 'bg-white/70', 'dark:bg-black/70', 'rounded-sm', 'flex', 'flex-col', 'w-full', 'min-w-72', 'z-1000', 'py-2');
        }
        else {
            dropdownEl.classList.add('absolute', 'z-1000');
        }

        dropdownEl.setAttribute('x-on:click.outside', 'close()');

        if (closeOnClickInside) {
            dropdownEl.setAttribute('x-on:click', 'close()');
        }

        dropdownEl.setAttribute('x-on:keydown.down.prevent', '$focus.wrap().next()');
        dropdownEl.setAttribute('x-on:keydown.up.prevent', '$focus.wrap().previous()');
        dropdownEl.setAttribute('x-on:keydown.tab', 'close()');
        dropdownEl.setAttribute('x-on:keydown.shift.tab', 'close()');
        dropdownEl.setAttribute('role', 'menu');
        dropdownEl.setAttribute('aria-orientation', 'vertical');
        dropdownEl.setAttribute('aria-labelledby', triggerEl.id);

        el.setAttribute('x-data', 'dropdown');
    });

    function getDropdownOptions(el, modifiers) {
        let triggerEl = el.querySelector('[data-trigger]'),
            dropdownEl = el.querySelector('[data-dropdown]'),
            position = getPlacement(modifiers),
            isHoverable = modifiers.includes('hover'),
            closeOnClickInside = modifiers.includes('select');

        return {triggerEl, dropdownEl, position, closeOnClickInside, isHoverable};
    }

    function getPlacement(modifiers) {
        return ['top', 'top-start', 'top-end', 'right', 'right-start', 'right-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end'].find(i => modifiers.includes(i)) || '';
    }
}
