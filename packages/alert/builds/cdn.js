import alert from '../src/index.js';

document.addEventListener('alpine:init', () => {
    window.Alpine.plugin(alert);
});
