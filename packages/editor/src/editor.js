import selectionHelpers from './modules/selectionModule.js';
import textActionsModule from './modules/textActionsModule';
import colorPickerModule from './modules/colorPickerModule';
import imageModule from './modules/imageModule';
import linkModule from './modules/linkModule';
import videoModule from './modules/videoModule';
import cleanupModule from './modules/cleanupModule';
import tableModule from './modules/tableModule';

export default function editorPlugin(Alpine) {
    Alpine.data('editor', (id, model, $wire, watchFor = null) => ({
        id,
        model: model,
        wire: $wire,
        watchFor: watchFor,
        editor: null,
        content: null,

        // Modules
        action: null,
        color: null,
        link: null,
        image: null,
        video: null,
        selection: null,
        cleanup: null,

        // Stored document-level handlers for cleanup
        _docClickHandler: null,
        _docScrollHandler: null,
        _docEscHandler: null,

        // Debounced save to Livewire
        save: Alpine.debounce(function () {
            const html = this.$refs.editor.innerHTML === '<br>' ? null : this.$refs.editor.innerHTML;
            this.$wire.set(this.model, html, false);
        }, 500),

        init() {
            this.editor = this.$refs.editor;
            this.content = this.wire.get(this.model);

            this.loadModules();
            this.bindDocumentListeners();

            // Support dynamic model changes like artists.dance that may change to artists.pop
            if (this.watchFor) {
                this.$watch(`$wire.${this.watchFor}`, (value) => {
                    // Split model by dot
                    const parts = this.model.split('.');
                    // Replace the last part with the new value
                    parts[parts.length - 1] = value;
                    // Rebuild model string
                    this.model = parts.join('.');

                    // Update content from Livewire
                    this.content = this.$wire.get(this.model);
                    if (this.editor) this.editor.innerHTML = this.content ?? '';
                });
            }

            // Listen for selectionchange to track active formatting state
            document.addEventListener('selectionchange', () => {
                this.action.updateFormattingState();
            });
        },

        destroy() {
            // Remove global document listeners to prevent memory leaks
            if (this._docClickHandler) {
                document.removeEventListener('click', this._docClickHandler);
            }
            if (this._docScrollHandler) {
                document.removeEventListener('scroll', this._docScrollHandler, true);
            }
            if (this._docEscHandler) {
                document.removeEventListener('keydown', this._docEscHandler);
            }
        },

        loadModules() {
            this.selection = Alpine.reactive(selectionHelpers(this));
            this.color = Alpine.reactive(colorPickerModule(this));
            this.action = Alpine.reactive(textActionsModule(this));
            this.image = Alpine.reactive(imageModule(this));
            this.link = Alpine.reactive(linkModule(this));
            this.video = Alpine.reactive(videoModule(this));
            this.table = Alpine.reactive(tableModule(this));
            this.cleanup = Alpine.reactive(cleanupModule(this));

            if (this.link.init) {
                this.link.init(this.editor, this.$refs.linkBtn);
            }
        },

        bindDocumentListeners() {
            // Close table context menu on outside click
            this._docClickHandler = (e) => {
                if (this.table?.tableContext?.show) {
                    const menu = document.getElementById(this.id + '_table_context_menu');
                    if (!menu || !menu.contains(e.target)) {
                        this.table.tableContext.show = false;
                    }
                }
            };

            // Close table context menu on scroll
            this._docScrollHandler = () => {
                if (this.table?.tableContext?.show) {
                    this.table.tableContext.show = false;
                }
            };

            // Close table context menu on Escape
            this._docEscHandler = (e) => {
                if (e.key === 'Escape' && this.table?.tableContext?.show) {
                    this.table.tableContext.show = false;
                }
            };

            document.addEventListener('click', this._docClickHandler);
            document.addEventListener('scroll', this._docScrollHandler, true);
            document.addEventListener('keydown', this._docEscHandler);
        },

        // Called from Alpine @paste.prevent directive on the contenteditable
        handlePaste(e) {
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
        },
    }));
}
