export default function (Alpine) {
    Alpine.directive('closeable', (el, {modifiers, expression}, {cleanup}) => {
        if(!el.id) {
            //random id for parent element if not exists
            el.id = crypto.getRandomValues(new Uint32Array(1))[0].toString(36) + Date.now().toString(36);
        }

        const getIcon = () => {
            if (modifiers.includes('icon')) {
                const iconClass = expression || 'ti ti-x';
                return `<i class="${iconClass}"></i>`;
            }

            // Default SVG icon
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="icon icon-tabler icons-tabler-outline icon-tabler-x">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                </svg>
            `;
        };

        const button = document.createElement('button');
        button.id = `closeable-${el.id}`;
        button.type = 'button';
        button.className = 'absolute top-3 right-1.5 flex items-center justify-center transition-all w-8 h-8 rounded-md text-inherit active:bg-dark/10 hover:bg-dark/5 dark:hover:bg-white/5 shadow-none!';
        button.innerHTML = getIcon();

        el.appendChild(button);
        // el.insertAdjacentHTML('beforeend', button);

        const handleClick = () => {
            if (modifiers.includes('confirm')) {
                if (window.confirm('You are about to close this window!')) {
                    el.remove();
                }
            } else if (modifiers.includes('remove')) {
                const idx = modifiers.findIndex(i => i === 'remove');
                const className = modifiers[idx + 1] || 'show';
                el.classList.remove(className);
            } else if (modifiers.includes('none')) {
                el.style.display = 'none';
            } else if (modifiers.includes('hidden')) {
                el.style.visibility = 'hidden';
            } else {
                el.remove();
            }
        };

        button.addEventListener('click', handleClick);

        cleanup(() => button.removeEventListener('click', handleClick));
    });
}
