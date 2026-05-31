// editorTableModalPlugin.js
// Singleton Alpine data component for the shared table editor modal.
// Rendered ONCE per page via <x-form.editor-modal /> in the app layout.
// All <x-form.editor> instances dispatch 'editor:open-table-modal' to communicate
// with this singleton, passing themselves as `editor` so we can call back
// editorModule.save() after DOM mutations.
export default function editorTableModalPlugin(Alpine) {
    Alpine.data('editorTableModal', () => ({
        // Reference to the editor instance that opened the modal
        ownerEditor: null,

        // Modal visibility
        showModal: false,

        // Table config
        colCount: 2,
        rows: 2,
        columns: {
            header: [],
            body: [],
        },
        bodyRows: [], // 2D array [row][col] storing cell values

        // Styling
        tableStyle: 'basic',
        defaultClasses: {
            table: 'w-full text-sm text-left border-collapse',
            tr: 'border-b border-zinc-100 dark:border-zinc-500',
            th: 'px-2 py-2 border border-zinc-100 dark:border-zinc-500 font-semibold',
            td: 'px-2 py-1 border border-zinc-100 dark:border-zinc-500'
        },
        customClasses: {
            table: '',
            thead: '',
            tbody: '',
            tr: '',
            th: '',
            td: ''
        },
        customStyles: {
            table: '',
            thead: '',
            tbody: '',
            tr: '',
            th: '',
            td: ''
        },

        // The table DOM element being edited (null when inserting)
        activeTable: null,

        // Saved selection range for insert-mode (restored before inserting the table)
        _savedSelection: null,

        init() {
            window.addEventListener('editor:open-table-modal', (e) => {
                const { editor, table } = e.detail;
                this.ownerEditor = editor;

                if (table) {
                    this.loadFromTable(table);
                } else {
                    // Save current selection so we can restore it before insert
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                        this._savedSelection = selection.getRangeAt(0);
                    } else {
                        this._savedSelection = null;
                    }
                    this.reset();
                }

                this.showModal = true;
            });
        },

        reset() {
            this.activeTable = null;
            this.colCount = 2;
            this.rows = 2;
            this.columns = {
                header: ['', ''],
                body: ['', '']
            };
            this.bodyRows = [
                ['', ''],
                ['', '']
            ];
            this.tableStyle = 'basic';
            this.setDefaultClasses();
        },

        setDefaultClasses() {
            this.customClasses.table = this.defaultClasses.table;
            this.customClasses.tr = this.defaultClasses.tr;
            this.customClasses.th = this.defaultClasses.th;
            this.customClasses.td = this.defaultClasses.td;
            this.customClasses.thead = '';
            this.customClasses.tbody = '';
            this.customStyles = {
                table: '',
                thead: '',
                tbody: '',
                tr: '',
                th: '',
                td: ''
            };
        },

        updateTableClasses() {
            switch (this.tableStyle) {
                case 'basic':
                    this.setDefaultClasses();
                    break;
                case 'bordered':
                    this.setDefaultClasses();
                    this.customClasses.th = 'border border-zinc-200 dark:border-zinc-600 px-2 py-2 bg-zinc-50 dark:bg-zinc-800';
                    this.customClasses.td = 'border border-zinc-200 dark:border-zinc-600 px-2 py-1';
                    this.customClasses.tr = 'border-b border-zinc-200 dark:border-zinc-600';
                    break;
                case 'striped-rows':
                    this.setDefaultClasses();
                    this.customClasses.tr = 'even:bg-zinc-50 dark:even:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-600';
                    break;
                case 'striped-columns':
                    this.setDefaultClasses();
                    this.customClasses.tr = 'border-b border-zinc-200 dark:border-zinc-600';
                    this.customClasses.th = 'even:bg-zinc-50 dark:even:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-600 px-2 py-2';
                    this.customClasses.td = 'even:bg-zinc-50 dark:even:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-600 px-2 py-1';
                    break;
            }
        },

        generateColumns() {
            // Sync columns.header
            this.columns.header = Array.from(
                { length: this.colCount },
                (_, i) => this.columns.header[i] || ''
            );
            this.columns.body = Array.from(
                { length: this.colCount },
                (_, i) => this.columns.body[i] || ''
            );

            // Sync bodyRows 2D array
            if (this.bodyRows.length < this.rows) {
                while (this.bodyRows.length < this.rows) {
                    this.bodyRows.push(Array.from({ length: this.colCount }, () => ''));
                }
            } else if (this.bodyRows.length > this.rows) {
                this.bodyRows = this.bodyRows.slice(0, this.rows);
            }

            this.bodyRows = this.bodyRows.map(row => {
                return Array.from(
                    { length: this.colCount },
                    (_, i) => row[i] || ''
                );
            });
        },

        // Load all state from an existing table DOM element (edit mode)
        loadFromTable(table) {
            this.activeTable = table;

            // Load table-level properties
            this.customClasses.table = table.className || '';
            this.customStyles.table = table.style.cssText || '';

            // Load thead/tbody properties
            const thead = table.querySelector('thead');
            this.customClasses.thead = thead ? thead.className : '';
            this.customStyles.thead = thead ? thead.style.cssText : '';

            const tbody = table.querySelector('tbody');
            this.customClasses.tbody = tbody ? tbody.className : '';
            this.customStyles.tbody = tbody ? tbody.style.cssText : '';

            // Load th/td properties
            const th = table.querySelector('thead tr th') || table.querySelector('th');
            this.customClasses.th = th ? th.className : '';
            this.customStyles.th = th ? th.style.cssText : '';

            const td = table.querySelector('tbody tr td') || table.querySelector('td');
            this.customClasses.td = td ? td.className : '';
            this.customStyles.td = td ? td.style.cssText : '';

            // Load tr properties
            const tr = table.querySelector('tbody tr') || table.querySelector('tr');
            this.customClasses.tr = tr ? tr.className : '';
            this.customStyles.tr = tr ? tr.style.cssText : '';

            // Load counts
            const bodyRows = table.querySelectorAll('tbody tr');
            this.rows = bodyRows.length || 1;

            const firstRow = table.querySelector('tr');
            this.colCount = firstRow ? firstRow.children.length : 2;

            // Detect style heuristically
            if (this.customClasses.tr.includes('even:bg-zinc-50')) {
                this.tableStyle = 'striped-rows';
            } else if (this.customClasses.td.includes('even:bg-zinc-50')) {
                this.tableStyle = 'striped-columns';
            } else if (this.customClasses.td.includes('border-zinc-200')) {
                this.tableStyle = 'bordered';
            } else {
                this.tableStyle = 'basic';
            }

            // Load header values
            const ths = table.querySelectorAll('thead tr th');
            this.columns.header = Array.from(ths).map(el => el.textContent.trim());
            while (this.columns.header.length < this.colCount) {
                this.columns.header.push('');
            }
            this.columns.body = Array.from({ length: this.colCount }, () => '');

            // Load body rows values
            const rowsList = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
            this.bodyRows = rowsList.map(rowEl => {
                const cells = Array.from(rowEl.querySelectorAll('td'));
                const rowValues = cells.map(cellEl => cellEl.textContent.trim());
                while (rowValues.length < this.colCount) {
                    rowValues.push('');
                }
                return rowValues;
            });
            while (this.bodyRows.length < this.rows) {
                this.bodyRows.push(Array.from({ length: this.colCount }, () => ''));
            }
        },

        // Final render (PURE HTML) or update existing table
        add() {
            if (this.activeTable) {
                this._updateExistingTable();
            } else {
                this._insertNewTable();
            }

            // Always save back to Livewire via the owning editor
            if (this.ownerEditor) {
                this.ownerEditor.save();
            }

            this.showModal = false;
            this.ownerEditor = null;
            this.activeTable = null;
        },

        _updateExistingTable() {
            const table = this.activeTable;

            // Update styling attributes
            table.className = this.customClasses.table;
            table.style.cssText = this.customStyles.table;

            const thead = table.querySelector('thead');
            if (thead) {
                thead.className = this.customClasses.thead;
                thead.style.cssText = this.customStyles.thead;
            }

            const tbody = table.querySelector('tbody');
            if (tbody) {
                tbody.className = this.customClasses.tbody;
                tbody.style.cssText = this.customStyles.tbody;
            }

            // Update headers structure and texts
            if (thead) {
                let headerRow = thead.querySelector('tr');
                if (!headerRow) {
                    headerRow = document.createElement('tr');
                    thead.appendChild(headerRow);
                }

                headerRow.className = this.customClasses.tr;
                headerRow.style.cssText = this.customStyles.tr;

                // Sync columns
                const currentThs = Array.from(headerRow.querySelectorAll('th'));
                if (currentThs.length < this.colCount) {
                    for (let i = currentThs.length; i < this.colCount; i++) {
                        const th = document.createElement('th');
                        headerRow.appendChild(th);
                    }
                } else if (currentThs.length > this.colCount) {
                    for (let i = this.colCount; i < currentThs.length; i++) {
                        currentThs[i].remove();
                    }
                }

                // Update all headers text and styles
                const ths = headerRow.querySelectorAll('th');
                ths.forEach((th, i) => {
                    th.className = this.customClasses.th;
                    th.style.cssText = this.customStyles.th;
                    th.textContent = this.columns.header[i] || '';
                });
            }

            // Update body rows structure and cell text contents
            if (tbody) {
                const currentRows = Array.from(tbody.querySelectorAll('tr'));

                // Adjust row count
                if (currentRows.length < this.rows) {
                    for (let i = currentRows.length; i < this.rows; i++) {
                        const tr = document.createElement('tr');
                        tbody.appendChild(tr);
                    }
                } else if (currentRows.length > this.rows) {
                    for (let i = this.rows; i < currentRows.length; i++) {
                        currentRows[i].remove();
                    }
                }

                // Adjust cell counts inside rows and apply data
                const rowsList = tbody.querySelectorAll('tr');
                rowsList.forEach((tr, r) => {
                    tr.className = this.customClasses.tr;
                    tr.style.cssText = this.customStyles.tr;

                    const currentCells = Array.from(tr.querySelectorAll('td'));
                    if (currentCells.length < this.colCount) {
                        for (let i = currentCells.length; i < this.colCount; i++) {
                            const td = document.createElement('td');
                            td.innerHTML = '';
                            tr.appendChild(td);
                        }
                    } else if (currentCells.length > this.colCount) {
                        for (let i = this.colCount; i < currentCells.length; i++) {
                            currentCells[i].remove();
                        }
                    }

                    // Re-apply classes, styles, and values
                    tr.querySelectorAll('td').forEach((td, c) => {
                        td.className = this.customClasses.td;
                        td.style.cssText = this.customStyles.td;
                        if (this.bodyRows[r] && this.bodyRows[r][c] !== undefined) {
                            td.textContent = this.bodyRows[r][c];
                        }
                    });
                });
            }
        },

        _insertNewTable() {
            const wrapper = document.createElement('div');
            wrapper.className = 'w-full my-4';

            const table = document.createElement('table');
            table.setAttribute('data-vkm-table', 'true'); // Stamp identifier
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            // Apply styles
            table.className = this.customClasses.table;
            table.style.cssText = this.customStyles.table;

            thead.className = this.customClasses.thead;
            thead.style.cssText = this.customStyles.thead;

            tbody.className = this.customClasses.tbody;
            tbody.style.cssText = this.customStyles.tbody;

            // HEADER
            const headerRow = document.createElement('tr');
            headerRow.className = this.customClasses.tr;
            headerRow.style.cssText = this.customStyles.tr;

            this.columns.header.forEach(col => {
                const th = document.createElement('th');
                th.className = this.customClasses.th;
                th.style.cssText = this.customStyles.th;
                th.textContent = col || '';
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);

            // BODY
            for (let i = 0; i < this.rows; i++) {
                const tr = document.createElement('tr');
                tr.className = this.customClasses.tr;
                tr.style.cssText = this.customStyles.tr;

                for (let j = 0; j < this.colCount; j++) {
                    const td = document.createElement('td');
                    td.className = this.customClasses.td;
                    td.style.cssText = this.customStyles.td;
                    td.textContent = (this.bodyRows[i] && this.bodyRows[i][j]) || '';
                    tr.appendChild(td);
                }

                tbody.appendChild(tr);
            }

            table.append(thead, tbody);
            wrapper.appendChild(table);

            // Restore saved selection and insert at cursor position
            if (this._savedSelection && this.ownerEditor) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(this._savedSelection);
                this._savedSelection.insertNode(wrapper);
            } else if (this.ownerEditor) {
                this.ownerEditor.editor.appendChild(wrapper);
            }

            this._savedSelection = null;
        },
    }));
}
