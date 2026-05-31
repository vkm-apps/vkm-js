export default function (Alpine) {

    // ── Styles injected once ────────────────────────────────────────────────────
    function injectStyles() {
        if (document.getElementById('vkm-dp-styles')) return;
        const s = document.createElement('style');
        s.id = 'vkm-dp-styles';
        s.textContent = `
            .vkm-dp {
                position: fixed; z-index: 9999;
                width: 288px; min-width: 288px;
                background: #fff;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,.15), 0 4px 16px rgba(0,0,0,.1);
                border: 1px solid rgba(0,0,0,.06);
                font-family: inherit;
                color: #111827;
                display: none;
                overflow: hidden;
                user-select: none;
            }
            .dark .vkm-dp {
                background: #1e293b;
                color: #f1f5f9;
                border-color: rgba(255,255,255,.08);
                box-shadow: 0 20px 60px rgba(0,0,0,.5), 0 4px 16px rgba(0,0,0,.3);
            }

            /* Header */
            .vkm-dp-header {
                display: flex; align-items: center; justify-content: space-between;
                padding: 14px 14px 8px;
            }
            .vkm-dp-nav {
                background: none; border: none; cursor: pointer;
                padding: 4px; border-radius: 6px;
                color: inherit; display: flex; align-items: center;
                opacity: .6; transition: opacity .15s;
            }
            .vkm-dp-nav:hover { opacity: 1; background: rgba(0,0,0,.05); }
            .dark .vkm-dp-nav:hover { background: rgba(255,255,255,.08); }

            .vkm-dp-center {
                display: flex; flex-direction: column;
                align-items: center; gap: 3px; flex: 1;
            }
            .vkm-dp-month-year {
                display: flex; align-items: center; gap: 6px;
            }
            .vkm-dp-month-btn, .vkm-dp-year-btn {
                background: none; border: none; cursor: pointer;
                font-weight: 700; font-size: 14px; padding: 2px 6px;
                border-radius: 5px; color: inherit; transition: background .15s;
            }
            .vkm-dp-month-btn:hover, .vkm-dp-year-btn:hover {
                color: #3b82f6; background: rgba(59,130,246,.08);
            }
            .vkm-dp-year-input {
                width: 64px; border: 1px solid #d1d5db; border-radius: 5px;
                padding: 2px 4px; text-align: center;
                font-size: 14px; font-weight: 700; background: inherit; color: inherit;
            }
            .dark .vkm-dp-year-input { border-color: #475569; }
            .vkm-dp-long-day {
                font-size: 11px; color: #9ca3af; font-weight: 400;
            }

            /* Month list */
            .vkm-dp-month-list {
                display: grid; grid-template-columns: repeat(3, 1fr);
                gap: 4px; padding: 6px 12px 14px;
            }
            .vkm-dp-month-item {
                padding: 7px 4px; border: none; border-radius: 7px;
                cursor: pointer; font-size: 12px; background: transparent;
                color: inherit; transition: background .15s;
            }
            .vkm-dp-month-item:hover { background: rgba(59,130,246,.1); }
            .dark .vkm-dp-month-item:hover { background: rgba(255,255,255,.08); }
            .vkm-dp-month-item.active {
                background: #3b82f6; color: #fff; font-weight: 600;
            }

            /* Day grid */
            .vkm-dp-grid {
                display: grid; grid-template-columns: repeat(7, 1fr);
                gap: 2px; padding: 4px 12px 14px;
            }
            .vkm-dp-wd {
                text-align: center; font-size: 10px;
                font-weight: 600; color: #9ca3af; padding: 4px 0;
            }
            .vkm-dp-day {
                border: none; border-radius: 7px; cursor: pointer;
                padding: 6px 0; font-size: 12px; text-align: center;
                width: 100%; background: transparent; color: inherit;
                transition: background .12s, color .12s;
                position: relative;
            }
            .vkm-dp-day:hover:not(:disabled):not(.selected) {
                background: rgba(59,130,246,.08);
            }
            .dark .vkm-dp-day:hover:not(:disabled):not(.selected) {
                background: rgba(255,255,255,.07);
            }
            .vkm-dp-day.today:not(.selected) {
                outline: 1.5px solid #93c5fd; font-weight: 600; color: #3b82f6;
            }
            .dark .vkm-dp-day.today:not(.selected) { outline-color: #3b82f6; }
            .vkm-dp-day.selected {
                background: #3b82f6; color: #fff; font-weight: 700;
            }
            .vkm-dp-day.weekend { color: #9ca3af; }
            .vkm-dp-day.selected.weekend { color: #fff; }
            .vkm-dp-day:disabled {
                opacity: .25; cursor: default;
            }
        `;
        document.head.appendChild(s);
    }

    // ── Directive ───────────────────────────────────────────────────────────────
    Alpine.directive('datepicker', (el, { modifiers }, { cleanup }) => {
        injectStyles();

        // Config
        const isRange = modifiers.includes('range');
        const isStart = modifiers.includes('start');
        const isEnd   = modifiers.includes('end');
        const locale  = modifiers.find(m => !['range', 'start', 'end'].includes(m)) || 'en';
        const model   = el.dataset.model || null;
        const name    = el.dataset.name  || null;
        const group   = el.dataset.rangeGroup || null;

        // Tag this element so its range partner can find it
        if (isRange) el.dataset.rangeRole = isStart ? 'start' : 'end';

        // State
        const today    = new Date();
        let viewYear   = today.getFullYear();
        let viewMonth  = today.getMonth() + 1;
        let selYear    = null;
        let selMonth   = null;
        let selDay     = null;
        let popup      = null;
        let isOpen     = false;
        let showMonths = false;
        let editYear   = false;

        // ── Livewire / hidden-input helpers ─────────────────────────────────
        function getWire() {
            const wireEl = el.closest('[wire\\:id]');
            if (!wireEl || !window.Livewire?.find) return null;
            return window.Livewire.find(wireEl.getAttribute('wire:id'));
        }

        function getHidden() {
            if (!name) return null;
            return el.closest('div')?.querySelector(`input[type="hidden"][name="${name}"]`) || null;
        }

        function getPartnerEl() {
            if (!isRange || !group) return null;
            const role = isStart ? 'end' : 'start';
            return document.querySelector(`[data-range-group="${group}"][data-range-role="${role}"]`);
        }

        function displayToIso(display) {
            if (!display || display.length < 10) return null;
            const [y, m, d] = display.split('/');
            if (!y || !m || !d) return null;
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }

        function isoToDisplay(iso) {
            if (!iso) return '';
            const [y, m, d] = iso.split('-');
            return `${y}/${m}/${d}`;
        }

        function saveValue(iso) {
            if (model) {
                const wire = getWire();
                if (!wire) return;
                if (isRange) {
                    const partner   = getPartnerEl();
                    const partnerIso = partner ? displayToIso(partner.value) : null;
                    const arr = isStart ? [iso, partnerIso] : [partnerIso, iso];
                    wire.set(model, arr, false);
                } else {
                    wire.set(model, iso || null, false);
                }
            } else {
                const hidden = getHidden();
                if (hidden) hidden.value = iso || '';
            }
        }

        // ── Load initial value ───────────────────────────────────────────────
        function loadInitial() {
            let iso = null;
            if (model) {
                try {
                    const wire = getWire();
                    if (wire) {
                        const val = wire.get(model);
                        if (isRange && Array.isArray(val)) {
                            iso = isStart ? val[0] : val[1];
                        } else if (typeof val === 'string' && val) {
                            iso = val;
                        }
                    }
                } catch (_) {}
            } else {
                const hidden = getHidden();
                iso = hidden?.value || null;
            }
            if (iso) setFromIso(iso);
        }

        function setFromIso(iso) {
            const parts = iso.split('-');
            if (parts.length !== 3) return;
            selYear  = parseInt(parts[0]);
            selMonth = parseInt(parts[1]);
            selDay   = parseInt(parts[2]);
            viewYear  = selYear;
            viewMonth = selMonth;
            el.value  = isoToDisplay(iso);
        }

        // ── Locale helpers ───────────────────────────────────────────────────
        function monthName(year, month) {
            return new Date(year, month - 1, 1).toLocaleString(locale, { month: 'long' });
        }

        function weekdayHeaders() {
            // Jan 6 2025 is a Monday — gives us Mon–Sun
            return Array.from({ length: 7 }, (_, i) =>
                new Date(2025, 0, 6 + i).toLocaleString(locale, { weekday: 'short' })
            );
        }

        function longDayName(year, month, day) {
            return new Date(year, month - 1, day).toLocaleString(locale, { weekday: 'long' });
        }

        // ── Calendar math ────────────────────────────────────────────────────
        function firstDayOffset(year, month) {
            // Monday-first: 0=Mon … 6=Sun
            return (new Date(year, month - 1, 1).getDay() + 6) % 7;
        }

        function daysInMonth(year, month) {
            return new Date(year, month, 0).getDate();
        }

        function isWeekend(year, month, day) {
            const dow = new Date(year, month - 1, day).getDay();
            return dow === 0 || dow === 6;
        }

        function isDisabled(day) {
            if (!isRange || !isEnd) return false;
            const partner = getPartnerEl();
            if (!partner?.value) return false;
            const startIso = displayToIso(partner.value);
            if (!startIso) return false;
            const [sy, sm, sd] = startIso.split('-').map(Number);
            return new Date(viewYear, viewMonth - 1, day) < new Date(sy, sm - 1, sd);
        }

        // ── Popup positioning ────────────────────────────────────────────────
        function positionPopup() {
            if (!popup) return;
            const rect        = el.getBoundingClientRect();
            const popH        = popup.offsetHeight || 320;
            const popW        = popup.offsetWidth || 288;
            const spaceBelow  = window.innerHeight - rect.bottom;

            const top = spaceBelow >= popH || spaceBelow >= rect.top
                ? rect.bottom + 4
                : rect.top - popH - 4;

            let left = rect.left;
            // Check if it goes off the right edge of the screen
            if (left + popW > window.innerWidth) {
                // align it to the right of the input
                left = rect.right - popW;
            }
            // Ensure it doesn't go off the left edge either
            if (left < 10) {
                left = 10;
            }

            popup.style.top  = top + 'px';
            popup.style.left = left + 'px';
            popup.style.width = Math.max(rect.width, 288) + 'px';
        }

        // ── DOM builder ──────────────────────────────────────────────────────
        function mk(tag, cls, attrs = {}) {
            const e = document.createElement(tag);
            if (cls) e.className = cls;
            for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
            return e;
        }

        function mkSvg(path) {
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
        }

        function renderPopup() {
            popup.innerHTML = '';

            // ── Header ──────────────────────────────────────────────────────
            const header = mk('div', 'vkm-dp-header');

            const prevBtn = mk('button', 'vkm-dp-nav', { type: 'button', title: 'Previous' });
            prevBtn.innerHTML = mkSvg('<path d="m15 18-6-6 6-6"/>');
            prevBtn.addEventListener('click', e => { e.stopPropagation(); navigate(-1); });

            const center = mk('div', 'vkm-dp-center');
            const monthYearRow = mk('div', 'vkm-dp-month-year');

            const monthBtn = mk('button', 'vkm-dp-month-btn', { type: 'button' });
            monthBtn.textContent = monthName(viewYear, viewMonth);
            monthBtn.addEventListener('click', e => {
                e.stopPropagation();
                showMonths = !showMonths;
                editYear   = false;
                renderPopup();
            });
            monthYearRow.appendChild(monthBtn);

            if (editYear) {
                const yInput = mk('input', 'vkm-dp-year-input', { type: 'number', value: viewYear });
                const commitYear = () => {
                    const y = parseInt(yInput.value);
                    if (y > 1000 && y < 2200) viewYear = y;
                    editYear = false;
                    renderPopup();
                };
                yInput.addEventListener('blur',  commitYear);
                yInput.addEventListener('keydown', e => {
                    if (e.key === 'Enter') { e.preventDefault(); commitYear(); }
                    if (e.key === 'Escape') { editYear = false; renderPopup(); }
                });
                monthYearRow.appendChild(yInput);
                setTimeout(() => yInput.focus(), 0);
            } else {
                const yearBtn = mk('button', 'vkm-dp-year-btn', { type: 'button' });
                yearBtn.textContent = viewYear;
                yearBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    editYear   = true;
                    showMonths = false;
                    renderPopup();
                });
                monthYearRow.appendChild(yearBtn);
            }

            center.appendChild(monthYearRow);

            if (selDay && selMonth && selYear) {
                const longDay = mk('div', 'vkm-dp-long-day');
                longDay.textContent =
                    longDayName(selYear, selMonth, selDay) + ' ' +
                    String(selDay).padStart(2, '0') + ' ' +
                    monthName(selYear, selMonth) + ' ' +
                    selYear;
                center.appendChild(longDay);
            }

            const nextBtn = mk('button', 'vkm-dp-nav', { type: 'button', title: 'Next' });
            nextBtn.innerHTML = mkSvg('<path d="m9 18 6-6-6-6"/>');
            nextBtn.addEventListener('click', e => { e.stopPropagation(); navigate(1); });

            header.appendChild(prevBtn);
            header.appendChild(center);
            header.appendChild(nextBtn);
            popup.appendChild(header);

            // ── Month list ───────────────────────────────────────────────────
            if (showMonths) {
                const grid = mk('div', 'vkm-dp-month-list');
                for (let m = 1; m <= 12; m++) {
                    const btn = mk('button', 'vkm-dp-month-item' + (m === viewMonth ? ' active' : ''), { type: 'button' });
                    btn.textContent = new Date(viewYear, m - 1, 1).toLocaleString(locale, { month: 'short' });
                    btn.addEventListener('click', e => {
                        e.stopPropagation();
                        viewMonth  = m;
                        showMonths = false;
                        renderPopup();
                    });
                    grid.appendChild(btn);
                }
                popup.appendChild(grid);
                return;
            }

            // ── Day grid ─────────────────────────────────────────────────────
            const grid = mk('div', 'vkm-dp-grid');

            weekdayHeaders().forEach(wd => {
                const span = mk('span', 'vkm-dp-wd');
                span.textContent = wd;
                grid.appendChild(span);
            });

            // Blank leading cells
            for (let i = 0; i < firstDayOffset(viewYear, viewMonth); i++) {
                grid.appendChild(mk('span'));
            }

            // Day buttons
            const total  = daysInMonth(viewYear, viewMonth);
            const todayY = today.getFullYear();
            const todayM = today.getMonth() + 1;
            const todayD = today.getDate();

            for (let d = 1; d <= total; d++) {
                const isSel  = selYear === viewYear && selMonth === viewMonth && selDay === d;
                const isTod  = todayY === viewYear && todayM === viewMonth && todayD === d;
                const isWknd = isWeekend(viewYear, viewMonth, d);
                const isDis  = isDisabled(d);

                let cls = 'vkm-dp-day';
                if (isSel)  cls += ' selected';
                if (isTod)  cls += ' today';
                if (isWknd) cls += ' weekend';

                const btn = mk('button', cls, { type: 'button' });
                btn.textContent = d;
                if (isDis) {
                    btn.disabled = true;
                } else {
                    btn.addEventListener('click', e => {
                        e.stopPropagation();
                        pickDay(d);
                    });
                }
                grid.appendChild(btn);
            }

            popup.appendChild(grid);
        }

        // ── Navigation / selection ───────────────────────────────────────────
        function navigate(dir) {
            viewMonth += dir;
            if (viewMonth > 12) { viewMonth = 1;  viewYear++; }
            if (viewMonth < 1)  { viewMonth = 12; viewYear--; }
            renderPopup();
        }

        function pickDay(day) {
            selDay   = day;
            selMonth = viewMonth;
            selYear  = viewYear;
            const iso = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            el.value = isoToDisplay(iso);
            saveValue(iso);
            close();
        }

        // ── Open / close ─────────────────────────────────────────────────────
        function open() {
            if (isOpen) return;
            isOpen     = true;
            showMonths = false;
            editYear   = false;
            if (!popup) {
                popup = mk('div', 'vkm-dp');
                document.body.appendChild(popup);
            }
            popup.style.display = 'block';
            renderPopup();
            // Position after layout so dimensions are known
            requestAnimationFrame(positionPopup);
        }

        function close() {
            if (!isOpen) return;
            isOpen = false;
            if (popup) popup.style.display = 'none';
        }

        // ── Typed input with mask ────────────────────────────────────────────
        function applyMask(raw) {
            const digits = raw.replace(/\D/g, '').slice(0, 8);
            let out = digits.slice(0, 4);
            if (digits.length > 4) out += '/' + digits.slice(4, 6);
            if (digits.length > 6) out += '/' + digits.slice(6, 8);
            return out;
        }

        function onInput() {
            const masked = applyMask(el.value);
            // Only rewrite if actually different to avoid cursor jump
            if (el.value !== masked) el.value = masked;

            if (masked.length === 10) {
                const iso = displayToIso(masked);
                if (iso) {
                    const [y, m, d] = iso.split('-').map(Number);
                    selYear  = y; selMonth = m; selDay = d;
                    viewYear = y; viewMonth = m;
                    saveValue(iso);
                    if (isOpen) renderPopup();
                }
            } else if (masked.length === 0) {
                selYear = selMonth = selDay = null;
                saveValue(null);
            }
        }

        // ── Event listeners ──────────────────────────────────────────────────
        el.addEventListener('click', () => isOpen ? close() : open());
        el.addEventListener('input', onInput);
        el.setAttribute('placeholder', 'YYYY/MM/DD');
        el.setAttribute('autocomplete', 'off');

        // Click-outside (capture phase catches it before anything else)
        const onDocClick = e => {
            if (!isOpen) return;
            if (el.contains(e.target)) return;
            if (popup?.contains(e.target)) return;
            close();
        };
        document.addEventListener('click', onDocClick, true);

        // Escape
        const onKeyDown = e => { if (e.key === 'Escape' && isOpen) close(); };
        document.addEventListener('keydown', onKeyDown);

        // Reposition on scroll / resize
        const onReflow = () => { if (isOpen) positionPopup(); };
        window.addEventListener('scroll', onReflow, { passive: true, capture: true });
        window.addEventListener('resize', onReflow, { passive: true });

        // Load any existing value once Alpine/Livewire are ready
        setTimeout(loadInitial, 0);

        // ── Cleanup ──────────────────────────────────────────────────────────
        cleanup(() => {
            document.removeEventListener('click', onDocClick, true);
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('scroll', onReflow, true);
            window.removeEventListener('resize', onReflow);
            popup?.remove();
        });
    });
}
