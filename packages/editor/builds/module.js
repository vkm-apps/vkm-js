import editor from '../src/editor.js';
import editorTableModal from '../src/editorTableModalPlugin.js';

/**
 * Bundle plugin that registers both the per-editor component and the
 * singleton editorTableModal component used for the shared table insert/edit modal.
 */
export default function editorBundle(Alpine) {
    Alpine.plugin(editor);
    Alpine.plugin(editorTableModal);
}
