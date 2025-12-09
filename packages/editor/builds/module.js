import editor from '../src/editor.js';

/**
 * Bundle plugin that registers the editor component.
 * Selection helpers are plain functions now, so they don't need Alpine.plugin.
 */
export default function editorBundle(Alpine) {
    Alpine.plugin(editor);
}
