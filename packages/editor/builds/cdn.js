import editor from '../src/editor.js';

(function () {
    function editorBundle(Alpine) {
        Alpine.plugin(editor);
    }

    document.addEventListener('alpine:init', () => {
        Alpine.plugin(editorBundle);
    });
})();
