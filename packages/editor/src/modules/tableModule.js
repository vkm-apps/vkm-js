// tableModule.js
export default function tableModule(editorModule) {
    return {
        // Core state
        selection: null,
        showModal: false,
        activeTable: null, // Holds reference to the table currently being edited

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

        tableContext: {
            show: false,        // show/hide popup
            x: 0,               // x position
            y: 0,               // y position
            target: null        // clicked table/cell metadata
        },

        // Init modal state
        init() {
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
            this.setDefaultClasses();
        },

        setDefaultClasses() {
            this.customClasses.table = this.defaultClasses.table;
            this.customClasses.tr = this.defaultClasses.tr;
            this.customClasses.th = this.defaultClasses.th;
            this.customClasses.td = this.defaultClasses.td;
            this.customClasses.thead = '';
            this.customClasses.tbody = '';
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

        handleContextMenu(e) {
            const table = e.target.closest('table');
            if (!table || !editorModule.editor.contains(table)) {
                this.tableContext.show = false;
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const cell = e.target.closest('td, th');
            if (!cell) return;

            const row = cell.parentNode;
            const tableSection = row.parentNode; // thead or tbody
            const rowsArray = Array.from(tableSection.children);
            const rowIndex = rowsArray.indexOf(row);
            const colIndex = Array.from(row.children).indexOf(cell);

            this.activeTable = table;
            this.tableContext.x = e.clientX;
            this.tableContext.y = e.clientY;
            this.tableContext.show = true;

            this.tableContext.target = {
                table: table,
                cell: cell,
                row: row,
                section: tableSection,
                rowIndex: rowIndex,
                colIndex: colIndex
            };
        },

        addRow(position = 'below') {
            if (!this.tableContext.target) return;

            const refRow = this.tableContext.target.row;
            const parent = refRow.parentNode;
            const colCount = refRow.children.length;

            const tr = document.createElement('tr');
            tr.className = refRow.className || this.customClasses.tr;
            if (refRow.style.cssText) {
                tr.style.cssText = refRow.style.cssText;
            }

            for (let i = 0; i < colCount; i++) {
                const refCell = refRow.children[i];
                const cellTag = refCell.tagName.toLowerCase();
                const cell = document.createElement(cellTag);
                cell.className = refCell.className;
                cell.style.cssText = refCell.style.cssText;
                cell.innerHTML = ''; // Keep it clean
                tr.appendChild(cell);
            }

            if (position === 'above') {
                parent.insertBefore(tr, refRow);
            } else {
                parent.insertBefore(tr, refRow.nextSibling);
            }

            this.tableContext.show = false;
            editorModule.save();
        },

        addCol(position = 'right') {
            if (!this.tableContext.target) return;

            const table = this.tableContext.target.table;
            const colIndex = this.tableContext.target.colIndex;

            table.querySelectorAll('tr').forEach(tr => {
                const cells = Array.from(tr.children);
                const refCell = cells[colIndex];
                if (!refCell) return;

                const cellTag = refCell.tagName.toLowerCase();
                const cell = document.createElement(cellTag);
                cell.className = refCell.className;
                cell.style.cssText = refCell.style.cssText;
                cell.innerHTML = '';

                if (position === 'left') {
                    tr.insertBefore(cell, refCell);
                } else {
                    tr.insertBefore(cell, refCell.nextSibling);
                }
            });

            this.tableContext.show = false;
            editorModule.save();
        },

        deleteRow() {
            if (!this.tableContext.target) return;

            const tr = this.tableContext.target.row;
            const table = this.tableContext.target.table;
            tr.remove();

            // If no rows left in tbody, delete table
            const tbody = table.querySelector('tbody');
            if (tbody && tbody.querySelectorAll('tr').length === 0) {
                const wrapper = table.closest('div.w-full') || table;
                wrapper.remove();
            }

            this.tableContext.show = false;
            editorModule.save();
        },

        deleteCol() {
            if (!this.tableContext.target) return;

            const table = this.tableContext.target.table;
            const colIndex = this.tableContext.target.colIndex;

            table.querySelectorAll('tr').forEach(tr => {
                const cells = Array.from(tr.children);
                if (cells[colIndex]) {
                    cells[colIndex].remove();
                }
            });

            // If no columns left, delete table
            const firstRow = table.querySelector('tr');
            if (!firstRow || firstRow.children.length === 0) {
                const wrapper = table.closest('div.w-full') || table;
                wrapper.remove();
            }

            this.tableContext.show = false;
            editorModule.save();
        },

        // Open modal for inserting
        insert() {
            this.activeTable = null;
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                this.selection = selection.getRangeAt(0);
            }

            this.init();
            this.showModal = true;
        },

        // Open modal for editing existing table properties
        openEditModal() {
            if (!this.activeTable) return;

            const table = this.activeTable;
            this.tableContext.show = false;

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

            this.showModal = true;
        },

        // Sync columns with count
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

        // Final render (PURE HTML) or update existing
        add() {
            if (this.activeTable) {
                // Update existing table
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
                    // adjust quantity
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

                this.activeTable = null;
                this.showModal = false;
                editorModule.save();
                return;
            }

            // Insert new table mode
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

            // Insert into editor
            if (this.selection) {
                this.selection.insertNode(wrapper);
            } else {
                editorModule.editor.appendChild(wrapper);
            }
            this.selection = null;

            editorModule.save();

            // Close modal
            this.showModal = false;
        }
    };
}
