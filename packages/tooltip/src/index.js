import { computePosition, arrow, flip, offset, shift, autoUpdate } from '@floating-ui/dom';

export default function (Alpine) {
    Alpine.directive('tooltip', (el, { expression, modifiers }, { cleanup }) => {
        // Prevent duplicate initialization during Livewire morphs
        if (el._x_tooltip_initialized) return;
        el._x_tooltip_initialized = true;

        // Parse options from modifiers & element
        const isClick = modifiers.includes('click') || modifiers.includes('popover');
        const isHtml = modifiers.includes('html') || modifiers.includes('raw');
        const hasNoArrow = modifiers.includes('no-arrow') || modifiers.includes('noarrow');

        const placement = getPlacement(modifiers) || 'top';
        const theme = getTheme(modifiers);

        // Find trigger and template
        const triggerEl = el.querySelector('[data-trigger]') || el;
        const templateEl = el.querySelector('template[data-html]')
            || (el.parentElement ? el.parentElement.querySelector(':scope > template[data-html]') : null)
            || (expression && expression.startsWith('#') ? document.querySelector(expression) : null);

        // Determine if interactive hover bridge should be enabled
        const isInteractive = isClick || modifiers.includes('interactive') || Boolean(templateEl);

        let tooltipWrapper = null;
        let tooltipCard = null;
        let contentEl = null;
        let arrowEl = null;
        let cleanupAutoUpdate = null;
        let hideTimeout = null;
        let isOpen = false;

        // Stable ID for ARIA linkage
        const tooltipId = 'vkm-tip-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 9));

        if (isClick) {
            triggerEl.setAttribute('aria-haspopup', 'dialog');
            triggerEl.setAttribute('aria-expanded', 'false');
        } else {
            triggerEl.setAttribute('aria-describedby', tooltipId);
        }

        const resolveContent = () => {
            const rawAttr = el.getAttribute('x-tooltip') || expression || '';
            if (!expression || templateEl) return rawAttr;

            const trimmed = typeof expression === 'string' ? expression.trim() : '';

            // 1. Explicitly quoted strings (e.g. "'Hello world'" or '"Hello world"')
            if (
                (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
                (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                (trimmed.startsWith('`') && trimmed.endsWith('`'))
            ) {
                return trimmed.slice(1, -1);
            }

            // 2. Safely evaluate against Alpine reactive scope + window without triggering Alpine's error logger
            try {
                const scope = getScopeProxy(el);
                const fn = new Function('scope', 'with(scope) { return (' + expression + '); }');
                const evaluated = fn(scope);
                if (evaluated !== undefined && evaluated !== null) {
                    return evaluated;
                }
            } catch {
                // Silently fallback without console error
            }

            // 3. Fallback to raw string without quotes (e.g. x-tooltip="Test")
            return rawAttr;
        };

        const renderContent = () => {
            if (!contentEl) return;

            if (templateEl && templateEl.content) {
                contentEl.innerHTML = '';
                const clone = templateEl.content.cloneNode(true);
                contentEl.appendChild(clone);
                // Initialize Alpine directives on dynamically inserted template content
                if (Alpine.initTree) {
                    Alpine.initTree(contentEl);
                }
            } else {
                const content = resolveContent();
                if (isHtml) {
                    contentEl.innerHTML = sanitizeHtml(String(content));
                } else {
                    contentEl.textContent = String(content);
                }
            }
        };

        const createTooltipDOM = () => {
            if (tooltipWrapper) return;

            // 1. Teleported container
            tooltipWrapper = document.createElement('div');
            tooltipWrapper.className = 'vkm-tooltip-wrapper fixed z-[99999] top-0 left-0 transition-opacity duration-150 ease-out opacity-0';
            if (!isInteractive) {
                tooltipWrapper.classList.add('pointer-events-none');
            }

            // 2. Card surface with Tailwind 4 palette & subtle blur
            tooltipCard = document.createElement('div');
            tooltipCard.id = tooltipId;
            tooltipCard.setAttribute('role', isClick ? 'dialog' : 'tooltip');
            tooltipCard.className = `relative rounded-lg shadow-lg shadow-black/10 dark:shadow-black/50 border backdrop-blur-sm transition-all duration-150 ease-out transform scale-95 opacity-0 ${theme.bg}`;

            // Add standard padding if not custom template
            if (!templateEl) {
                tooltipCard.classList.add('px-2.5', 'py-1', 'text-xs', 'font-medium', 'whitespace-nowrap');
            } else {
                tooltipCard.classList.add('p-3', 'text-sm');
            }

            // 3. Content holder
            contentEl = document.createElement('div');
            contentEl.className = 'relative z-10';
            renderContent();
            tooltipCard.appendChild(contentEl);

            // 4. Rotating square arrow (inherits background and borders flawlessly)
            if (!hasNoArrow) {
                arrowEl = document.createElement('div');
                arrowEl.className = `vkm-tooltip-arrow absolute w-2 h-2 rotate-45 pointer-events-none ${theme.arrowBg}`;
                tooltipCard.appendChild(arrowEl);
            }

            tooltipWrapper.appendChild(tooltipCard);
            document.body.appendChild(tooltipWrapper);

            // Hover bridge listeners on the tooltip container
            if (isInteractive && !isClick) {
                tooltipWrapper.addEventListener('mouseenter', clearHideTimeout);
                tooltipWrapper.addEventListener('mouseleave', startHideTimeout);
            }
        };

        const updatePosition = () => {
            if (!tooltipWrapper || !triggerEl.isConnected) return;

            const middleware = [
                offset(8),
                flip({ fallbackAxisSideDirection: 'start', padding: 8 }),
                shift({ padding: 8 })
            ];

            if (arrowEl) {
                middleware.push(arrow({ element: arrowEl, padding: 6 }));
            }

            computePosition(triggerEl, tooltipWrapper, {
                strategy: 'fixed',
                placement,
                middleware
            }).then(({ x, y, placement: computedPlacement, middlewareData }) => {
                if (!tooltipWrapper) return;

                Object.assign(tooltipWrapper.style, {
                    left: `${x}px`,
                    top: `${y}px`
                });

                if (arrowEl && middlewareData.arrow) {
                    const side = computedPlacement.split('-')[0];
                    const staticSide = {
                        top: 'bottom',
                        right: 'left',
                        bottom: 'top',
                        left: 'right'
                    }[side];

                    const arrowBorderClass = {
                        top: 'border-b border-r',
                        bottom: 'border-t border-l',
                        left: 'border-t border-r',
                        right: 'border-b border-l'
                    }[side];

                    // Reset previous border orientations
                    arrowEl.className = `vkm-tooltip-arrow absolute w-2 h-2 rotate-45 pointer-events-none ${theme.arrowBg} ${arrowBorderClass}`;

                    const { x: arrowX, y: arrowY } = middlewareData.arrow;
                    Object.assign(arrowEl.style, {
                        left: arrowX != null ? `${arrowX}px` : '',
                        top: arrowY != null ? `${arrowY}px` : '',
                        right: '',
                        bottom: '',
                        [staticSide]: '-4px'
                    });
                }
            });
        };

        const showTooltip = () => {
            clearHideTimeout();
            if (isOpen) return;

            createTooltipDOM();
            renderContent();
            isOpen = true;

            if (isClick) {
                triggerEl.setAttribute('aria-expanded', 'true');
            }

            // Bind autoUpdate loop
            cleanupAutoUpdate = autoUpdate(triggerEl, tooltipWrapper, updatePosition);

            // Animate in
            requestAnimationFrame(() => {
                if (!tooltipWrapper || !tooltipCard) return;
                tooltipWrapper.classList.remove('opacity-0');
                tooltipWrapper.classList.add('opacity-100');
                tooltipCard.classList.remove('scale-95', 'opacity-0');
                tooltipCard.classList.add('scale-100', 'opacity-100');
            });
        };

        const hideTooltip = () => {
            clearHideTimeout();
            if (!isOpen || !tooltipWrapper) return;
            isOpen = false;

            if (isClick) {
                triggerEl.setAttribute('aria-expanded', 'false');
            }

            if (tooltipCard) {
                tooltipCard.classList.remove('scale-100', 'opacity-100');
                tooltipCard.classList.add('scale-95', 'opacity-0');
            }
            if (tooltipWrapper) {
                tooltipWrapper.classList.remove('opacity-100');
                tooltipWrapper.classList.add('opacity-0');
            }

            setTimeout(() => {
                if (isOpen) return; // Re-opened during exit animation
                if (cleanupAutoUpdate) {
                    cleanupAutoUpdate();
                    cleanupAutoUpdate = null;
                }
                if (tooltipWrapper) {
                    tooltipWrapper.remove();
                    tooltipWrapper = null;
                    tooltipCard = null;
                    contentEl = null;
                    arrowEl = null;
                }
            }, 150);
        };

        const clearHideTimeout = () => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
        };

        const startHideTimeout = () => {
            clearHideTimeout();
            if (isInteractive) {
                hideTimeout = setTimeout(hideTooltip, 150); // 150ms hover gap bridge
            } else {
                hideTooltip();
            }
        };

        const toggleTooltip = () => {
            isOpen ? hideTooltip() : showTooltip();
        };

        // Click outside & Escape listeners for click popover mode
        const onDocumentClick = (event) => {
            if (!isOpen) return;
            const clickedInsideTrigger = triggerEl.contains(event.target);
            const clickedInsideTooltip = tooltipWrapper && tooltipWrapper.contains(event.target);
            if (!clickedInsideTrigger && !clickedInsideTooltip) {
                hideTooltip();
            }
        };

        const onDocumentKeydown = (event) => {
            if (isOpen && event.key === 'Escape') {
                hideTooltip();
                triggerEl.focus();
            }
        };

        // Attach Trigger Event Listeners
        if (isClick) {
            triggerEl.addEventListener('click', toggleTooltip);
            document.addEventListener('pointerdown', onDocumentClick);
            document.addEventListener('keydown', onDocumentKeydown);
        } else {
            triggerEl.addEventListener('mouseenter', showTooltip);
            triggerEl.addEventListener('mouseleave', startHideTimeout);
            triggerEl.addEventListener('focus', showTooltip);
            triggerEl.addEventListener('blur', hideTooltip);
        }

        // Cleanup on DOM removal / Livewire teardown
        cleanup(() => {
            delete el._x_tooltip_initialized;
            clearHideTimeout();

            if (isClick) {
                triggerEl.removeEventListener('click', toggleTooltip);
                document.removeEventListener('pointerdown', onDocumentClick);
                document.removeEventListener('keydown', onDocumentKeydown);
            } else {
                triggerEl.removeEventListener('mouseenter', showTooltip);
                triggerEl.removeEventListener('mouseleave', startHideTimeout);
                triggerEl.removeEventListener('focus', showTooltip);
                triggerEl.removeEventListener('blur', hideTooltip);
            }

            if (cleanupAutoUpdate) {
                cleanupAutoUpdate();
                cleanupAutoUpdate = null;
            }

            if (tooltipWrapper) {
                tooltipWrapper.remove();
                tooltipWrapper = null;
            }
        });
    });
}

// Placement resolution
function getPlacement(modifiers) {
    const placements = [
        'top', 'top-start', 'top-end',
        'bottom', 'bottom-start', 'bottom-end',
        'left', 'left-start', 'left-end',
        'right', 'right-start', 'right-end'
    ];
    return placements.find(p => modifiers.includes(p)) || 'top';
}

// Modern Tailwind 4 theme palettes
const themeMap = {
    dark: {
        bg: 'bg-zinc-900/95 text-zinc-100 border-zinc-800 dark:bg-zinc-900/95 dark:text-zinc-100 dark:border-zinc-800',
        arrowBg: 'bg-zinc-900/95 border-zinc-800 dark:bg-zinc-900/95 dark:border-zinc-800'
    },
    light: {
        bg: 'bg-white/95 text-zinc-900 border-zinc-200 dark:bg-white/95 dark:text-zinc-900 dark:border-zinc-200',
        arrowBg: 'bg-white/95 border-zinc-200 dark:bg-white/95 dark:border-zinc-200'
    },
    danger: {
        bg: 'bg-red-50 text-red-900 border-red-200 dark:bg-red-950/95 dark:text-red-100 dark:border-red-800/80',
        arrowBg: 'bg-red-50 border-red-200 dark:bg-red-950/95 dark:border-red-800/80'
    },
    success: {
        bg: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/95 dark:text-emerald-100 dark:border-emerald-800/80',
        arrowBg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/95 dark:border-emerald-800/80'
    },
    warning: {
        bg: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/95 dark:text-amber-100 dark:border-amber-800/80',
        arrowBg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/95 dark:border-amber-800/80'
    },
    info: {
        bg: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/95 dark:text-sky-100 dark:border-sky-800/80',
        arrowBg: 'bg-sky-50 border-sky-200 dark:bg-sky-950/95 dark:border-sky-800/80'
    }
};

const aliasMap = {
    red: 'danger',
    green: 'success',
    emerald: 'success',
    yellow: 'warning',
    amber: 'warning',
    blue: 'info',
    sky: 'info'
};

function getTheme(modifiers) {
    for (const mod of modifiers) {
        if (themeMap[mod]) return themeMap[mod];
        if (aliasMap[mod] && themeMap[aliasMap[mod]]) return themeMap[aliasMap[mod]];
    }
    return themeMap.dark;
}

// Lightweight sanitization for HTML string tooltips
function sanitizeHtml(html) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const clean = (node) => {
            if (node.nodeType === Node.TEXT_NODE) return;

            [...node.children].forEach(clean);

            const disallowed = ['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'STYLE', 'META', 'LINK'];
            if (disallowed.includes(node.tagName)) {
                node.remove();
                return;
            }

            [...node.attributes].forEach(attr => {
                const name = attr.name.toLowerCase();
                if (name.startsWith('on')) {
                    node.removeAttribute(attr.name);
                } else if ((name === 'href' || name === 'src') && attr.value.trim().toLowerCase().startsWith('javascript:')) {
                    node.removeAttribute(attr.name);
                }
            });
        };

        [...doc.body.children].forEach(clean);
        return doc.body.innerHTML;
    } catch {
        return html;
    }
}

// Safely resolve Alpine data scope proxy without triggering Alpine's internal error handler
function getScopeProxy(el) {
    const stack = [];
    let current = el;
    while (current) {
        if (current._x_dataStack) {
            stack.push(...current._x_dataStack);
        }
        current = current.parentElement;
    }
    const win = typeof window !== 'undefined' ? window : {};
    return new Proxy({}, {
        has(target, prop) {
            for (const s of stack) {
                if (prop in s) return true;
            }
            return prop in win;
        },
        get(target, prop) {
            if (prop === Symbol.unscopables) return undefined;
            for (const s of stack) {
                if (prop in s) return s[prop];
            }
            return win[prop];
        }
    });
}
