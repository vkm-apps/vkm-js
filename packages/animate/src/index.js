export default function (Alpine) {
    Alpine.directive('animate', (el, { value, modifiers }, { cleanup }) => {
        // Prevent duplicate initialization during Livewire DOM morphs
        if (el._x_animate_initialized) return;
        el._x_animate_initialized = true;

        const animationTypes = ['fade', 'zoom', 'up', 'down'];

        // Determine animation type: from modifier or use 'fade'
        const type = modifiers.find(mod => animationTypes.includes(mod)) || 'fade';

        // Determine duration: from modifier or directive value or fallback
        const modifierDuration = modifiers.find(mod => /^\d+$/.test(mod));
        const duration = modifierDuration || value || '1000';

        const getActiveTransform = () => {
            switch (type) {
                case 'up':
                case 'down': return 'translateY(0)';
                case 'zoom': return 'scale(1)';
                default: return '';
            }
        };

        // Apply base transition and initial hidden state
        el.style.transition = `all ${duration}ms ease`;
        el.style.opacity = '0';

        switch (type) {
            case 'up':
                el.style.transform = 'translateY(20px)';
                break;
            case 'down':
                el.style.transform = 'translateY(-50px)';
                break;
            case 'zoom':
                el.style.transform = 'scale(0.8)';
                break;
        }

        let hasTriggered = false;

        const trigger = (immediate = false) => {
            if (hasTriggered) return;
            hasTriggered = true;

            if (observer) {
                observer.disconnect();
            }

            if (immediate) {
                // If element was already scrolled past on page load/reload, reveal immediately without animation lag
                el.style.transition = 'none';
                el.style.opacity = '1';
                const transform = getActiveTransform();
                if (transform) el.style.transform = transform;
                return;
            }

            // Smooth animation on next frame to guarantee CSS transition starts
            requestAnimationFrame(() => {
                el.style.opacity = '1';
                const transform = getActiveTransform();
                if (transform) el.style.transform = transform;
            });
        };

        // Check whether element is currently in or above the visible viewport
        const checkVisibility = () => {
            if (hasTriggered) return;

            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            const windowWidth = window.innerWidth || document.documentElement.clientWidth;

            // 1. Element has already been scrolled past (above the viewport on reload)
            if (rect.bottom <= 0 && rect.top < 0) {
                trigger(true);
                return;
            }

            // 2. Element is currently in the visible viewport (even partially)
            const isVisible = (
                rect.top < windowHeight &&
                rect.bottom > 0 &&
                rect.left < windowWidth &&
                rect.right > 0
            );

            if (isVisible) {
                trigger(false);
            }
        };

        // Intersect logic: threshold 0 ensures any visible pixels trigger animation
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    trigger(false);
                    break;
                }
            }
        }, { threshold: 0 });

        observer.observe(el);

        // Immediate and post-scroll-restoration checks:
        // Catches elements visible on initial paint
        requestAnimationFrame(checkVisibility);

        // Handles asynchronous browser scroll restoration and late layout shifts (e.g. fonts/images)
        const timer1 = setTimeout(checkVisibility, 50);
        const timer2 = setTimeout(checkVisibility, 200);

        const onLoad = () => checkVisibility();
        window.addEventListener('load', onLoad, { once: true });

        if (typeof cleanup === 'function') {
            cleanup(() => {
                delete el._x_animate_initialized;
                clearTimeout(timer1);
                clearTimeout(timer2);
                window.removeEventListener('load', onLoad);
                if (observer) {
                    observer.disconnect();
                }
            });
        }
    });
}
