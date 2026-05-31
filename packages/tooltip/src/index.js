export default function (Alpine) {
    Alpine.directive('tooltip', (el, { expression, modifiers }, { cleanup }) => {
        const rawTooltipText = el.getAttribute('x-tooltip') || expression || '';
        const position = modifiers.find(m => ['top', 'bottom', 'left', 'right'].includes(m)) || 'top';
        const color = modifiers.find(m => Object.keys(colorMap).includes(m)) || 'dark';

        let tooltipWrapper = null;

        const showTooltip = () => {
            if (tooltipWrapper) return;

            tooltipWrapper = document.createElement('div');
            tooltipWrapper.style.position = 'absolute';
            tooltipWrapper.style.zIndex = '99999';
            tooltipWrapper.style.pointerEvents = 'none';

            const tooltipEl = document.createElement('div');
            tooltipEl.className = `${baseTooltipClass} ${colorMap[color].tooltip} ${positionMap[position].tooltip}`;

            const content = document.createElement('div');
            content.textContent = rawTooltipText;
            tooltipEl.appendChild(content);

            const arrow = document.createElement('div');
            arrow.className = `absolute ${positionMap[position].arrow} ${colorMap[color].arrow}`;
            tooltipEl.appendChild(arrow);

            tooltipWrapper.appendChild(tooltipEl);
            document.body.appendChild(tooltipWrapper);

            const updatePosition = () => {
                if (!tooltipWrapper) return;
                const rect = el.getBoundingClientRect();
                tooltipWrapper.style.top = (rect.top + window.scrollY) + 'px';
                tooltipWrapper.style.left = (rect.left + window.scrollX) + 'px';
                tooltipWrapper.style.width = rect.width + 'px';
                tooltipWrapper.style.height = rect.height + 'px';
            };
            updatePosition();

            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            tooltipWrapper._updatePosition = updatePosition;
        };

        const hideTooltip = () => {
            if (tooltipWrapper) {
                window.removeEventListener('scroll', tooltipWrapper._updatePosition, true);
                window.removeEventListener('resize', tooltipWrapper._updatePosition);
                tooltipWrapper.remove();
                tooltipWrapper = null;
            }
        };

        el.addEventListener('mouseenter', showTooltip);
        el.addEventListener('mouseleave', hideTooltip);

        cleanup(() => {
            el.removeEventListener('mouseenter', showTooltip);
            el.removeEventListener('mouseleave', hideTooltip);
            hideTooltip();
        });
    });
}

// Base styles
const baseTooltipClass = `
    absolute z-50 px-3 py-1 text-sm rounded shadow-lg transition-opacity duration-150 whitespace-nowrap
`;

// Color classes
const colorMap = {
    dark: {
        tooltip: 'bg-black/90 text-white',
        arrow: 'border-t-black'
    },
    light: {
        tooltip: 'bg-white/90 text-black',
        arrow: 'border-t-white'
    },
    info: {
        tooltip: 'bg-sky-200/90 text-sky-900',
        arrow: 'border-t-blue-200'
    },
    success: {
        tooltip: 'bg-emerald-200/90 text-emerald-900',
        arrow: 'border-t-green-200'
    },
    danger: {
        tooltip: 'bg-red-200/90 text-red-900',
        arrow: 'border-t-red-200'
    },
    warning: {
        tooltip: 'bg-yellow-200/90 text-yellow-900',
        arrow: 'border-t-yellow-200'
    }
};

// Position and arrow placement
const positionMap = {
    top: {
        tooltip: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        arrow: 'top-full left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-t-8'
    },
    bottom: {
        tooltip: 'top-full left-1/2 -translate-x-1/2 mt-2',
        arrow: 'bottom-full left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-b-8'
    },
    left: {
        tooltip: 'right-full top-1/2 -translate-y-1/2 mr-2',
        arrow: 'left-full top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-l-8'
    },
    right: {
        tooltip: 'left-full top-1/2 -translate-y-1/2 ml-2',
        arrow: 'right-full top-1/2 -translate-y-1/2 border-y-8 border-y-transparent border-r-8'
    }
};
