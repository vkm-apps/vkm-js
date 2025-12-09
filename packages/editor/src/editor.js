import selectionHelpers from './modules/selectionModule.js';
import textActionsModule from './modules/textActionsModule';
import colorPickerModule from './modules/colorPickerModule';
import imageModule from './modules/imageModule';
import linkModule from './modules/linkModule';
import videoModule from './modules/videoModule';
import cleanupModule from './modules/cleanupModule';

export default function editorPlugin(Alpine) {
    Alpine.data('editor', (id, model, $wire) => ({
        id,
        model,
        wire: $wire,
        editor: null,
        content: null,

        // Modules
        modules: {},
        // Debounced save to Livewire
        save: Alpine.debounce(function () {
            const html = this.$refs.editor.innerHTML === '<br>' ? null : this.$refs.editor.innerHTML;
            this.$wire.set(this.model, html, false);
        }, 1000),

        init() {
            this.editor = this.$refs.editor;
            this.content = this.wire.get(this.model);

            this.loadModules();
            this.bindEvents();
        },

        loadModules() {
            this.modules.selection = selectionHelpers(this);
            this.modules.color = colorPickerModule(this);
            this.modules.action = textActionsModule(this);
            this.modules.image = imageModule(this);
            this.modules.link = linkModule(this);
            this.modules.video = videoModule(this);
            this.modules.cleanup = cleanupModule(this);

            if (this.modules.link.init) {
                this.modules.link.init(this.editor, this.$refs.linkBtn);
            }
        },

        bindEvents() {
            // Attach editor-specific listeners
            this.attachEditorListeners();

            Livewire.hook('morphed', ({el, component}) => {
                this.attachEditorListeners();
            });

            document.addEventListener('selectionchange', () => {
                this.modules.action.updateFormattingState();
            });

            this.editor.addEventListener('paste', e => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');

                const sel = selectionHelpers(this.editor);
                sel.insert(text);
            });

            this.editor.addEventListener('keydown', e => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    if (this.modules.action.changeIndent) {
                        this.modules.action.changeIndent(!e.shiftKey);
                    }
                }
            });
        },

        attachEditorListeners() {
            if (!this.$refs.editor || !this.$refs.editor.id) {
                return;
            }

            this.$refs.editor.addEventListener('click', e => this.modules.image.handleClick(e));
            this.$refs.editor.addEventListener('dragstart', e => this.modules.image.handleDragStart(e));
            this.$refs.editor.addEventListener('dragend', e => this.modules.image.handleDragEnd(e));
            this.$refs.editor.addEventListener('keydown', e => {
                if (e.key === 'Tab') {
                    e.preventDefault();
                    this.modules.action.changeIndent(!e.shiftKey);
                }
            });

            // Clean paste (remove unwanted formatting)
            this.$refs.editor.addEventListener('paste', e => {
                e.preventDefault();
                const text = (e.clipboardData || window.clipboardData).getData('text/plain');
                document.execCommand('insertText', false, text);
            });
        },
    }));
}
