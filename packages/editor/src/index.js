import editor from './editor.js';
import editorTableModal from './editorTableModalPlugin.js';

export default function editorBundle(Alpine) {
    Alpine.plugin(editor);
    Alpine.plugin(editorTableModal);
}
