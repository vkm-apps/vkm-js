// tableModule.js
export default function tableModule(editorModule) {
    return {
        // Core state
        activeTable: null, // Holds reference to the table currently being edited

        tableContext: {
            show: false,        // show/hide popup
            x: 0,               // x position
            y: 0,               // y position
            target: null        // clicked table/cell metadata
        },

        // Dispatch the open-table-modal event to the singleton editorTableModal component.
        // The singleton lives outside the editor (rendered once per page), so all editors
        // share one modal instead of each having their own fixed inset-0 div.
        _openModal(table = null) {
            this.activeTable = table;
            window.dispatchEvent(new CustomEvent('editor:open-table-modal', {
                detail: { editor: editorModule, table }
            }));
        },

        handleContextMenu(e) {
            // e.target may be a text node when clicking directly on text inside a cell.
            // Text nodes don't have .closest() — normalize to the parent Element first.
            const target = e.target.nodeType === Node.TEXT_NODE
                ? e.target.parentElement
                : e.target;

            if (!target || typeof target.closest !== 'function') return;

            const table = target.closest('table');
            const editorEl = e.currentTarget || editorModule.editor;
            
            if (!table || !editorEl || !editorEl.contains(table)) {
                // Not inside one of our tables — let the browser handle it normally.
                this.tableContext.show = false;
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            const cell = target.closest('td, th');
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
            tr.className = refRow.className || '';
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

        // Open modal for inserting a brand-new table
        insert() {
            this._openModal(null);
        },

        // Open modal for editing existing table properties
        openEditModal() {
            if (!this.activeTable) return;
            const table = this.activeTable;
            this.tableContext.show = false;
            this._openModal(table);
        },
    };
}
