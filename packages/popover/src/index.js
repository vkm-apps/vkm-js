import { computePosition, arrow, flip, offset, shift, autoUpdate, autoPlacement, detectOverflow } from '@floating-ui/dom';

export default function (Alpine) {
    // Shared functionality for the popover
    function getPopoverOptions(el, modifiers) {
        let triggerEl = el.querySelector('[data-trigger]'),
            popoverEl = el.querySelector('[data-popover]'),
            isHoverable = modifiers.includes('hover');

        let position = getPlacement(modifiers) || 'bottom';
        let transition = getAnimation(modifiers);
        let colorClass = getColorClass(modifiers);  // Get color class from modifiers

        return { triggerEl, popoverEl, isHoverable, position, transition, colorClass };
    }

    function getPlacement(modifiers) {
        return ['top', 'top-start', 'top-end', 'right', 'right-start', 'right-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end'].find(i => modifiers.includes(i)) || '';
    }

    function getAnimation(modifiers) {
        return ['animate-none', 'animate-drop'].find(i => modifiers.includes(i)) || 'animate-fade';
    }

    // Function to get color class from modifiers
    function getColorClass(modifiers) {
        const colorMapping = {
            'danger': ['bg-red-200/90', 'text-red-900'],
            'success': ['bg-emerald-200/90', 'text-emerald-900'],
            'warning': ['bg-yellow-200/90', 'text-yellow-900'],
            'info': ['bg-sky-200/90', 'text-sky-900'],
            'primary': ['bg-blue-600', 'text-blue-900'],
            'secondary': ['bg-gray-600', 'text-gray-900'],
            'light': ['bg-gray-300/90', 'text-black'],
            'dark': ['bg-black/90', 'text-white'],
        };

        return modifiers.reduce((acc, modifier) => acc || colorMapping[modifier], '');
    }

    // Default color classes if no modifier is found
    const defaultColorClasses = [
        'text-black', 'bg-white', 'border', 'border-zinc-50',
        'dark:bg-zinc-900/90', 'dark:border-black/50', 'dark:text-white'
    ];

    Alpine.data('popover', (isHoverable) => ({
        open: false,
        isHoverable: isHoverable,
        show() {
            if (!this.open) {
                this.open = true;
            }
            else if (!this.isHoverable) {
                this.open = false;
            }
        },
        hide() {
            this.open = false;
        }
    }));

    // Popover Directive
    Alpine.directive('popover', (el, { expression, modifiers }, { cleanup }) => {
        let { triggerEl, popoverEl, isHoverable, position, transition, colorClass } = getPopoverOptions(el, modifiers);

        if (expression) {
            popoverEl.innerHTML = expression; // Can be HTML or text content
        }

        if (!triggerEl || !popoverEl) {
            return !triggerEl
                ? console.warn('Popover JS: Attribute data-trigger is not set!')
                : console.warn('Popover JS: Attribute data-popover is not set!');
        }

        // Default behavior for popover (clickable or hoverable if .hover is passed)
        el.setAttribute('x-data', `popover(${isHoverable})`);
        triggerEl.setAttribute('x-ref', 'button');
        popoverEl.id = 'popover-' + el.id;
        popoverEl.setAttribute('x-show', 'open');

        // Default popover classes + dynamic color classes if any
        const popoverClass = [
            'z-998',
            'w-96',
            'min-w-fit',
            'max-w-full',
            'sm:max-w-[320px]',
            'md:max-w-sm',
            'lg:max-w-md',
            'xl:max-w-lg',
            'rounded-lg',
            'whitespace-normal',
            'break-words',
            'font-normal',
            'text-sm',
            'shadow-lg',
            'shadow-black/20',
            'focus:outline-hidden',
            'dark:shadow-black/75',
            transition
        ];

        // If no colorClass found, use default color classes
        if (colorClass) {
            popoverClass.push(...colorClass);
        } else {
            popoverClass.push(...defaultColorClasses); // Apply default classes if no color modifier is passed
        }

        popoverEl.classList.add(...popoverClass);

        // Set popover event listeners (clickable by default, hoverable if .hover is passed)
        if (modifiers.includes('hover')) {
            triggerEl.setAttribute('x-on:mouseenter.self', 'show');
            triggerEl.setAttribute('x-on:mouseleave', 'hide');
        } else {
            triggerEl.setAttribute('x-on:click', 'show');
            popoverEl.setAttribute('x-on:click.outside', 'hide');
        }

        // Ensure Popover is positioned correctly and add the arrow
        Alpine.nextTick(() => {
            makeArrow(triggerEl, popoverEl, el.id, position, 'body', expression, colorClass);
        });

        cleanup(() => {
            triggerEl.removeAttribute('x-on:mouseenter.self');
            triggerEl.removeAttribute('x-on:mouseleave');
            triggerEl.removeAttribute('x-on:click');
            popoverEl.removeAttribute('x-on:click.outside');
            // Remove arrow element if exists
            const arrowEl = document.getElementById(`arrow-${el.id}`);
            if (arrowEl) arrowEl.remove();
        });
    });

    // Function to make and position the arrow
    function makeArrow(triggerEl, popoverEl, id, position, overflowEl, expression, colorClass) {
        let arrow_id = `arrow-${id}`;
        popoverEl.insertAdjacentHTML('afterbegin', `<span id="${arrow_id}" class="popover-arrow absolute z-999 h-3 w-3 animate-fade" x-show="open"></span>`);

        const arrowEl = document.getElementById(arrow_id);
        if (!arrowEl) return;

        // Apply the same color to the arrow if a color modifier is set
        if (colorClass) {
            arrowEl.classList.add(...colorClass);  // Apply the color class to the arrow as well
        } else {
            // Apply default color classes to the arrow
            arrowEl.classList.add(...defaultColorClasses);
        }

        const arrowLen = arrowEl.offsetWidth || 0;
        const floatingOffset = Math.sqrt(2 * arrowLen ** 2) / 2;
        const placement = position || 'bottom';

        const overflowMiddleware = {
            name: 'overflowMiddleware',
            async fn(state) {
                const overflow = await detectOverflow(state, {
                    boundary: overflowEl,
                });
                return {};
            },
        };

        autoUpdate(triggerEl, popoverEl, () => {
            computePosition(triggerEl, popoverEl, {
                placement,
                middleware: [
                    offset(10),
                    position ? flip() : autoPlacement(),
                    shift(),
                    overflowMiddleware,
                    arrow({ element: arrowEl }),
                ]
            }).then(({ x, y, middlewareData, placement }) => {
                Object.assign(popoverEl.style, {
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                });

                const side = placement.split('-')[0];

                const staticSide = {
                    top: 'bottom',
                    right: 'left',
                    bottom: 'top',
                    left: 'right'
                }[side];

                const transformArrow = {
                    top: 'rotate(225deg)',
                    right: 'rotate(315deg)',
                    bottom: 'rotate(45deg)',
                    left: 'rotate(135deg)',
                }[side];

                if (middlewareData.arrow) {
                    const { x, y } = middlewareData.arrow;
                    Object.assign(arrowEl.style, {
                        left: x != null ? `${x}px` : '',
                        top: y != null ? `${y}px` : '',
                        right: '',
                        bottom: '',
                        [staticSide]: `-6px`,
                        transform: transformArrow,
                    });
                }
            });
        });
    }
}
