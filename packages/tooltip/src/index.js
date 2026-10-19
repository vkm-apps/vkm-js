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

            const userConfig = (typeof window !== 'undefined' && window.vkmConfig && window.vkmConfig.tooltip) || {};

            // 1. Teleported container
            tooltipWrapper = document.createElement('div');
            tooltipWrapper.className = 'vkm-tooltip-wrapper';
            if (!isInteractive) {
                tooltipWrapper.classList.add('pointer-events-none');
            }

            // 2. Card surface with Tailwind 4 palette & backdrop blur
            tooltipCard = document.createElement('div');
            tooltipCard.id = tooltipId;
            tooltipCard.setAttribute('role', isClick ? 'dialog' : 'tooltip');
            tooltipCard.className = 'vkm-tooltip-card';

            // Detect user classes on template if present
            const templateClasses = templateEl ? (templateEl.getAttribute('class') || '').split(/\s+/).filter(Boolean) : [];
            const hasUserWidth = templateClasses.some(c => /^w-(?!max$)/.test(c));
            const hasUserMinWidth = templateClasses.some(c => /^min-w-/.test(c));
            const hasUserMaxWidth = templateClasses.some(c => /^max-w-/.test(c));
            const hasUserBg = templateClasses.some(c => /^bg-/.test(c));
            const hasUserBorder = templateClasses.some(c => /^(border$|border-)/.test(c));
            const hasUserText = templateClasses.some(c => /^text-/.test(c));

            // Sizing: w-max and min-w- (min 100px / user friendly min-width) unless user specified in template
            if (!hasUserWidth) tooltipCard.classList.add('w-max');
            if (!hasUserMinWidth) {
                if (!templateEl) {
                    tooltipCard.classList.add(userConfig.minWidth || 'min-w-24');
                } else {
                    tooltipCard.classList.add(userConfig.richMinWidth || 'min-w-48');
                }
            }
            if (!hasUserMaxWidth) tooltipCard.classList.add('max-w-[calc(100vw-2rem)]');

            // Typography & spacing
            if (!templateEl) {
                tooltipCard.classList.add('vkm-tooltip-text');
            } else {
                tooltipCard.classList.add('vkm-tooltip-rich');
            }

            // Colors: user colors via app.js (window.vkmConfig.tooltip.colors) or theme
            let appliedBg = theme.bg;
            let appliedArrowBg = theme.arrowBg;

            if (userConfig.colors) {
                if (typeof userConfig.colors === 'string') {
                    appliedBg = userConfig.colors;
                    appliedArrowBg = userConfig.colors;
                } else if (typeof userConfig.colors === 'object') {
                    if (userConfig.colors.bg) appliedBg = userConfig.colors.bg;
                    if (userConfig.colors.arrowBg) appliedArrowBg = userConfig.colors.arrowBg;
                }
            }

            // Apply color classes unless user specified their own in template
            const bgClasses = appliedBg.split(/\s+/).filter(Boolean);
            bgClasses.forEach(cls => {
                if (hasUserBg && /^bg-/.test(cls)) return;
                if (hasUserBorder && /^(border$|border-)/.test(cls)) return;
                if (hasUserText && /^text-/.test(cls)) return;
                tooltipCard.classList.add(cls);
            });

            // Merge template custom classes
            if (templateClasses.length > 0) {
                tooltipCard.classList.add(...templateClasses);
            }

            // 3. Content holder
            contentEl = document.createElement('div');
            contentEl.className = 'relative z-10';
            renderContent();
            tooltipCard.appendChild(contentEl);

            // 4. Rotating square arrow (inherits background and borders)
            if (!hasNoArrow) {
                arrowEl = document.createElement('div');
                arrowEl.className = `vkm-tooltip-arrow ${appliedArrowBg}`;
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

                    const userConfig = (typeof window !== 'undefined' && window.vkmConfig && window.vkmConfig.tooltip) || {};
                    let currentArrowBg = theme.arrowBg;
                    if (userConfig.colors) {
                        if (typeof userConfig.colors === 'string') currentArrowBg = userConfig.colors;
                        else if (userConfig.colors.arrowBg) currentArrowBg = userConfig.colors.arrowBg;
                    }

                    // Reset previous border orientations
                    arrowEl.className = `vkm-tooltip-arrow ${currentArrowBg} ${arrowBorderClass}`;

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

            // Animate in via CSS classes
            requestAnimationFrame(() => {
                if (!tooltipWrapper || !tooltipCard) return;
                tooltipWrapper.classList.add('show');
                tooltipCard.classList.add('show');
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
                tooltipCard.classList.remove('show');
            }
            if (tooltipWrapper) {
                tooltipWrapper.classList.remove('show');
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

// Modern Tailwind 4 theme palettes aligned with x-form translucent styling
const defaultThemeMap = {
    dark: {
        bg: 'bg-black/90 text-white/90 border-white/20 dark:bg-black/90 dark:text-white/90 dark:border-white/20',
        arrowBg: 'bg-black/90 border-white/20 dark:bg-black/90 dark:border-white/20'
    },
    light: {
        bg: 'bg-white/95 text-black/85 border-black/20 dark:bg-white/95 dark:text-black/85 dark:border-black/20',
        arrowBg: 'bg-white/95 border-black/20 dark:bg-white/95 dark:border-black/20'
    },
    danger: {
        bg: 'bg-red-600/90 text-white border-red-500/40 dark:bg-red-700/90 dark:text-white dark:border-red-500/40',
        arrowBg: 'bg-red-600/90 border-red-500/40 dark:bg-red-700/90 dark:border-red-500/40'
    },
    success: {
        bg: 'bg-emerald-600/90 text-white border-emerald-500/40 dark:bg-emerald-700/90 dark:text-white dark:border-emerald-500/40',
        arrowBg: 'bg-emerald-600/90 border-emerald-500/40 dark:bg-emerald-700/90 dark:border-emerald-500/40'
    },
    warning: {
        bg: 'bg-amber-500/90 text-black/90 border-amber-400/40 dark:bg-amber-600/90 dark:text-white dark:border-amber-400/40',
        arrowBg: 'bg-amber-500/90 border-amber-400/40 dark:bg-amber-600/90 dark:border-amber-400/40'
    },
    info: {
        bg: 'bg-sky-600/90 text-white border-sky-500/40 dark:bg-sky-700/90 dark:text-white dark:border-sky-500/40',
        arrowBg: 'bg-sky-600/90 border-sky-500/40 dark:bg-sky-700/90 dark:border-sky-500/40'
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
    const userThemes = (window.vkmConfig && window.vkmConfig.tooltip && window.vkmConfig.tooltip.themes) || {};
    const themeMap = { ...defaultThemeMap, ...userThemes };

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
