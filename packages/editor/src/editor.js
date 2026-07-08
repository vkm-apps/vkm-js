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
        activeDropdown: null,

        // Modules
        action: null,
        color: null,
        link: null,
        image: null,
        video: null,
        selection: null,
        cleanup: null,
        table: null,

        // Stored handler refs for proper cleanup
        _selectionChangeHandler: null,
        _contextMenuClickHandler: null,
        _contextMenuScrollHandler: null,
        _contextMenuEscHandler: null,
        _dropdownClickHandler: null,

        // Debounced save to Livewire
        save: Alpine.debounce(function () {
            const html = this.$refs.editor.innerHTML === '<br>' ? null : this.$refs.editor.innerHTML;
            this.$wire.set(this.model, html, false);
        }, 500),

        init() {
            this.editor = this.$refs.editor;
            this.content = this.wire.get(this.model);

            this.loadModules();
            this.bindContextMenuListeners();

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

            // Listen for selectionchange to track active formatting state.
            // Stored ref so it can be properly removed in destroy().
            this._selectionChangeHandler = () => {
                this.action.updateFormattingState();
                
                // Track last selection inside the editor contenteditable container
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (this.editor && this.editor.contains(range.commonAncestorContainer)) {
                        if (this.image) {
                            this.image.lastSelection = range;
                        }
                    }
                }
            };
            document.addEventListener('selectionchange', this._selectionChangeHandler);
        },

        destroy() {
            // Remove selectionchange listener
            if (this._selectionChangeHandler) {
                document.removeEventListener('selectionchange', this._selectionChangeHandler);
                this._selectionChangeHandler = null;
            }

            // Remove context menu document listeners
            if (this._contextMenuClickHandler) {
                document.removeEventListener('click', this._contextMenuClickHandler);
                this._contextMenuClickHandler = null;
            }
            if (this._contextMenuScrollHandler) {
                document.removeEventListener('scroll', this._contextMenuScrollHandler, true);
                this._contextMenuScrollHandler = null;
            }
            if (this._contextMenuEscHandler) {
                document.removeEventListener('keydown', this._contextMenuEscHandler);
                this._contextMenuEscHandler = null;
            }
            if (this._dropdownClickHandler) {
                document.removeEventListener('click', this._dropdownClickHandler);
                this._dropdownClickHandler = null;
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

        bindContextMenuListeners() {
            // Each handler is scoped to THIS editor's context menu via this.id.
            // Using named refs (not @click.away) avoids cross-editor interference
            // where Alpine's always-active document listeners on hidden elements
            // can suppress right-click events in earlier editors on the page.

            const getMenu = () => document.getElementById(this.id + '_table_context_menu');

            // Close on outside click
            this._contextMenuClickHandler = (e) => {
                if (!this.table?.tableContext?.show) return;
                const menu = getMenu();
                if (!menu || !menu.contains(e.target)) {
                    this.table.tableContext.show = false;
                }
            };

            // Close on scroll (context menu position would be stale)
            this._contextMenuScrollHandler = () => {
                if (this.table?.tableContext?.show) {
                    this.table.tableContext.show = false;
                }
            };

            // Close on Escape
            this._contextMenuEscHandler = (e) => {
                if (e.key === 'Escape' && this.table?.tableContext?.show) {
                    this.table.tableContext.show = false;
                }
            };

            // Close toolbar dropdowns on outside click
            this._dropdownClickHandler = (e) => {
                if (!this.activeDropdown) return;
                const trigger = e.target.closest('[data-dropdown-trigger]');
                const menu = e.target.closest('[data-dropdown-menu]');
                if (!trigger && !menu) {
                    this.activeDropdown = null;
                }
            };

            document.addEventListener('click', this._contextMenuClickHandler);
            document.addEventListener('scroll', this._contextMenuScrollHandler, true);
            document.addEventListener('keydown', this._contextMenuEscHandler);
            document.addEventListener('click', this._dropdownClickHandler);
        },

        // Called from Alpine @paste.prevent directive on the contenteditable
        handlePaste(e) {
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            document.execCommand('insertText', false, text);
        },
    }));
}
