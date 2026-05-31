import editor from '../src/editor.js';
import editorTableModal from '../src/editorTableModalPlugin.js';

(function () {
    function editorBundle(Alpine) {
        Alpine.plugin(editor);
        Alpine.plugin(editorTableModal);
    }

    document.addEventListener('alpine:init', () => {
        Alpine.plugin(editorBundle);
    });
})();
