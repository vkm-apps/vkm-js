export default function (Alpine) {

    // ── Styles: Checks if datepicker.css is already loaded via stylesheet, falls back to injected styles ──
    function injectStyles() {
        if (typeof document === 'undefined' || document.getElementById('vkm-dp-styles')) return;

        // Check if datepicker.css is already loaded via stylesheet
        try {
            const testEl = document.createElement('div');
            testEl.className = 'vkm-dp';
            document.body.appendChild(testEl);
            const isLoaded = window.getComputedStyle(testEl).position === 'fixed';
            testEl.remove();
            if (isLoaded) return;
        } catch {}

        const s = document.createElement('style');
        s.id = 'vkm-dp-styles';
        s.textContent = `
            .vkm-dp {
                position: fixed; z-index: 9999;
                width: 288px; min-width: 288px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(12px);
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
                border: 1px solid rgba(0, 0, 0, 0.15);
                color: rgba(0, 0, 0, 0.85);
                display: none;
                overflow: hidden;
                user-select: none;
            }
            .dark .vkm-dp {
                background: rgba(0, 0, 0, 0.88);
                color: rgba(255, 255, 255, 0.9);
                border-color: rgba(255, 255, 255, 0.2);
            }
            .vkm-dp-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 14px 8px; }
            .vkm-dp-nav { background: none; border: none; cursor: pointer; padding: 4px; border-radius: 6px; color: inherit; opacity: .6; }
            .vkm-dp-center { display: flex; flex-direction: column; align-items: center; flex: 1; }
            .vkm-dp-month-year { display: flex; align-items: center; gap: 6px; }
            .vkm-dp-month-btn, .vkm-dp-year-btn { background: none; border: none; cursor: pointer; font-weight: 700; font-size: 14px; border-radius: 6px; color: inherit; }
            .vkm-dp-year-input { width: 64px; border: 1px solid rgba(0,0,0,0.2); border-radius: 6px; text-align: center; font-size: 14px; font-weight: 700; background: transparent; color: inherit; }
            .vkm-dp-long-day { font-size: 11px; opacity: .5; }
            .vkm-dp-month-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 6px 12px 14px; }
            .vkm-dp-month-item { padding: 7px 4px; border: none; border-radius: 7px; cursor: pointer; font-size: 12px; background: transparent; color: inherit; }
            .vkm-dp-month-item.active { background: rgba(0,0,0,0.85); color: #fff; }
            .dark .vkm-dp-month-item.active { background: rgba(255,255,255,0.9); color: #000; }
            .vkm-dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; padding: 4px 12px 14px; }
            .vkm-dp-wd { text-align: center; font-size: 10px; font-weight: 600; opacity: .4; padding: 4px 0; }
            .vkm-dp-day { border: none; border-radius: 7px; cursor: pointer; padding: 6px 0; font-size: 12px; text-align: center; width: 100%; background: transparent; color: inherit; }
            .vkm-dp-day.today:not(.selected) { outline: 1.5px solid rgba(0,0,0,0.3); }
            .dark .vkm-dp-day.today:not(.selected) { outline-color: rgba(255,255,255,0.35); }
            .vkm-dp-day.selected { background: rgba(0,0,0,0.85); color: #fff; font-weight: 700; }
            .dark .vkm-dp-day.selected { background: rgba(255,255,255,0.9); color: #000; }
            .vkm-dp-time { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-top: 1px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.03); }
            .vkm-dp-time-left { display: flex; align-items: center; gap: 8px; }
            .vkm-dp-time-inputs { display: flex; align-items: center; gap: 2px; }
            .vkm-dp-time-step { background: none; border: none; cursor: pointer; font-size: 7px; color: inherit; opacity: .6; }
            .vkm-dp-time-val { width: 32px; height: 26px; border: 1px solid rgba(0,0,0,0.2); border-radius: 5px; text-align: center; font-size: 13px; font-weight: 700; background: transparent; color: inherit; }
            .vkm-dp-time-sep { font-weight: 700; font-size: 13px; opacity: .4; }
            .vkm-dp-time-actions { display: flex; align-items: center; gap: 6px; }
            .vkm-dp-btn-now, .vkm-dp-btn-done { border: none; cursor: pointer; font-size: 12px; font-weight: 600; border-radius: 6px; padding: 5px 10px; }
            .vkm-dp-btn-now { background: transparent; color: inherit; opacity: .7; }
            .vkm-dp-btn-done { background: rgba(0,0,0,0.85); color: #fff; }
            .dark .vkm-dp-btn-done { background: rgba(255,255,255,0.9); color: #000; }
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
        const isLive  = modifiers.includes('live');
        const hasTime = modifiers.includes('time');
        const locale  = modifiers.find(m => !['range', 'start', 'end', 'live', 'time'].includes(m)) || 'en';
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
        let selHour    = today.getHours();
        let selMinute  = today.getMinutes();
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

        function currentIso() {
            if (!selYear || !selMonth || !selDay) return null;
            const y = String(selYear);
            const m = String(selMonth).padStart(2, '0');
            const d = String(selDay).padStart(2, '0');
            if (!hasTime) {
                return `${y}-${m}-${d}`;
            }
            const h = String(selHour).padStart(2, '0');
            const min = String(selMinute).padStart(2, '0');
            return `${y}-${m}-${d} ${h}:${min}:00`;
        }

        function displayToIso(display) {
            if (!display || display.length < 10) return null;
            const parts = display.trim().split(' ');
            const dateStr = parts[0];
            const timeStr = parts[1] || '';

            const [y, m, d] = dateStr.split('/').map(Number);
            if (!y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) return null;

            const isoDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (!hasTime) return isoDate;

            let h = selHour;
            let min = selMinute;
            if (timeStr) {
                const tParts = timeStr.split(':');
                if (tParts.length >= 2) {
                    const parsedH = parseInt(tParts[0]);
                    const parsedMin = parseInt(tParts[1]);
                    if (!isNaN(parsedH) && parsedH >= 0 && parsedH <= 23) h = parsedH;
                    if (!isNaN(parsedMin) && parsedMin >= 0 && parsedMin <= 59) min = parsedMin;
                }
            }
            return `${isoDate} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:00`;
        }

        function isoToDisplay(iso) {
            if (!iso) return '';
            const [datePart, timePart] = iso.includes('T') ? iso.split('T') : iso.split(' ');
            const parts = (datePart || '').split('-');
            if (parts.length !== 3) return '';
            const [y, m, d] = parts;
            let res = `${y}/${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
            if (hasTime) {
                let h = String(selHour).padStart(2, '0');
                let min = String(selMinute).padStart(2, '0');
                if (timePart) {
                    const tParts = timePart.split(':');
                    if (tParts.length >= 2) {
                        h = tParts[0].padStart(2, '0');
                        min = tParts[1].padStart(2, '0');
                    }
                }
                res += ` ${h}:${min}`;
            }
            return res;
        }

        function saveValue(iso) {
            if (model) {
                const wire = getWire();
                if (!wire) return;
                if (isRange) {
                    const partner   = getPartnerEl();
                    const partnerIso = partner ? displayToIso(partner.value) : null;
                    const arr = isStart ? [iso, partnerIso] : [partnerIso, iso];
                    wire.set(model, arr, isLive);
                } else {
                    wire.set(model, iso || null, isLive);
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

        function setFromIso(iso, updateInput = true) {
            if (!iso) return;
            const [datePart, timePart] = iso.includes('T') ? iso.split('T') : iso.split(' ');
            const parts = (datePart || '').split('-');
            if (parts.length !== 3) return;
            selYear  = parseInt(parts[0]);
            selMonth = parseInt(parts[1]);
            selDay   = parseInt(parts[2]);
            viewYear  = selYear;
            viewMonth = selMonth;

            if (hasTime && timePart) {
                const tParts = timePart.split(':');
                if (tParts.length >= 2) {
                    selHour   = parseInt(tParts[0]) || 0;
                    selMinute = parseInt(tParts[1]) || 0;
                }
            }

            if (updateInput) {
                el.value = isoToDisplay(iso);
            }
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
            const [datePart] = startIso.split(' ');
            const [sy, sm, sd] = datePart.split('-').map(Number);
            return new Date(viewYear, viewMonth - 1, day) < new Date(sy, sm - 1, sd);
        }

        // ── Popup positioning ────────────────────────────────────────────────
        function positionPopup() {
            if (!popup) return;
            const rect        = el.getBoundingClientRect();
            const popH        = popup.offsetHeight || (hasTime ? 370 : 320);
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

            // Resolve user Tailwind class overrides from window.vkmConfig.datepicker
            const userConfig = (typeof window !== 'undefined' && window.vkmConfig && window.vkmConfig.datepicker) || {};
            const selectedCls = userConfig.selected || (userConfig.colors && (userConfig.colors.selected || userConfig.colors.active)) || '';
            const todayCls = userConfig.today || (userConfig.colors && userConfig.colors.today) || '';

            // ── Month list ───────────────────────────────────────────────────
            if (showMonths) {
                const grid = mk('div', 'vkm-dp-month-list');
                for (let m = 1; m <= 12; m++) {
                    const isMActive = (m === viewMonth);
                    let mCls = 'vkm-dp-month-item';
                    if (isMActive) {
                        mCls += selectedCls ? ` ${selectedCls}` : ' active';
                    }
                    const btn = mk('button', mCls, { type: 'button' });
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
                if (isSel) {
                    cls += selectedCls ? ` ${selectedCls}` : ' selected';
                }
                if (isTod && !isSel) {
                    cls += todayCls ? ` ${todayCls}` : ' today';
                }
                if (isWknd && !isSel) cls += ' weekend';

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

            // ── Time selection ───────────────────────────────────────────────
            if (hasTime) {
                const timeFooter = mk('div', 'vkm-dp-time');

                const timeRow = mk('div', 'vkm-dp-time-left');
                const clockIcon = mk('span', 'vkm-dp-time-icon');
                clockIcon.innerHTML = mkSvg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>');
                timeRow.appendChild(clockIcon);

                const inputsWrap = mk('div', 'vkm-dp-time-inputs');

                // Hour
                const hUnit = mk('div', 'vkm-dp-time-unit');
                const hUp = mk('button', 'vkm-dp-time-step', { type: 'button', title: 'Increment hour' });
                hUp.innerHTML = '▲';
                const hInput = mk('input', 'vkm-dp-time-val', {
                    type: 'text',
                    inputmode: 'numeric',
                    maxlength: '2',
                    value: String(selHour).padStart(2, '0')
                });
                const hDown = mk('button', 'vkm-dp-time-step', { type: 'button', title: 'Decrement hour' });
                hDown.innerHTML = '▼';
                hUnit.appendChild(hUp);
                hUnit.appendChild(hInput);
                hUnit.appendChild(hDown);

                // Separator
                const sep = mk('span', 'vkm-dp-time-sep');
                sep.textContent = ':';

                // Minute
                const mUnit = mk('div', 'vkm-dp-time-unit');
                const mUp = mk('button', 'vkm-dp-time-step', { type: 'button', title: 'Increment minute' });
                mUp.innerHTML = '▲';
                const mInput = mk('input', 'vkm-dp-time-val', {
                    type: 'text',
                    inputmode: 'numeric',
                    maxlength: '2',
                    value: String(selMinute).padStart(2, '0')
                });
                const mDown = mk('button', 'vkm-dp-time-step', { type: 'button', title: 'Decrement minute' });
                mDown.innerHTML = '▼';
                mUnit.appendChild(mUp);
                mUnit.appendChild(mInput);
                mUnit.appendChild(mDown);

                inputsWrap.appendChild(hUnit);
                inputsWrap.appendChild(sep);
                inputsWrap.appendChild(mUnit);
                timeRow.appendChild(inputsWrap);

                // Actions
                const actions = mk('div', 'vkm-dp-time-actions');
                const nowBtn = mk('button', 'vkm-dp-btn-now', { type: 'button', title: 'Set to current time' });
                nowBtn.textContent = 'Now';
                const doneBtnCls = 'vkm-dp-btn-done' + (selectedCls ? ` ${selectedCls}` : '');
                const doneBtn = mk('button', doneBtnCls, { type: 'button' });
                doneBtn.textContent = 'Done';
                actions.appendChild(nowBtn);
                actions.appendChild(doneBtn);

                timeFooter.appendChild(timeRow);
                timeFooter.appendChild(actions);

                function setHourMinute(h, m, rerender = false) {
                    selHour = h;
                    selMinute = m;
                    if (!selDay) {
                        selDay = today.getDate();
                        selMonth = today.getMonth() + 1;
                        selYear = today.getFullYear();
                        viewYear = selYear;
                        viewMonth = selMonth;
                        rerender = true;
                    }
                    const iso = currentIso();
                    el.value = isoToDisplay(iso);
                    saveValue(iso);
                    if (rerender) {
                        renderPopup();
                    } else {
                        hInput.value = String(selHour).padStart(2, '0');
                        mInput.value = String(selMinute).padStart(2, '0');
                        const longDayEl = popup.querySelector('.vkm-dp-long-day');
                        if (longDayEl && selDay && selMonth && selYear) {
                            longDayEl.textContent =
                                longDayName(selYear, selMonth, selDay) + ' ' +
                                String(selDay).padStart(2, '0') + ' ' +
                                monthName(selYear, selMonth) + ' ' +
                                selYear;
                        }
                    }
                }

                const adjustHour = (delta) => {
                    let h = (selHour + delta) % 24;
                    if (h < 0) h += 24;
                    setHourMinute(h, selMinute);
                };

                const adjustMinute = (delta) => {
                    let m = (selMinute + delta) % 60;
                    if (m < 0) m += 60;
                    setHourMinute(selHour, m);
                };

                hUp.addEventListener('click', e => { e.stopPropagation(); adjustHour(1); });
                hDown.addEventListener('click', e => { e.stopPropagation(); adjustHour(-1); });
                mUp.addEventListener('click', e => { e.stopPropagation(); adjustMinute(5); });
                mDown.addEventListener('click', e => { e.stopPropagation(); adjustMinute(-5); });

                hInput.addEventListener('wheel', e => {
                    e.preventDefault(); e.stopPropagation();
                    adjustHour(e.deltaY < 0 ? 1 : -1);
                }, { passive: false });

                mInput.addEventListener('wheel', e => {
                    e.preventDefault(); e.stopPropagation();
                    adjustMinute(e.deltaY < 0 ? 1 : -1);
                }, { passive: false });

                hInput.addEventListener('keydown', e => {
                    if (e.key === 'ArrowUp') { e.preventDefault(); adjustHour(1); }
                    else if (e.key === 'ArrowDown') { e.preventDefault(); adjustHour(-1); }
                    else if (e.key === 'Enter') { e.preventDefault(); hInput.blur(); }
                });

                mInput.addEventListener('keydown', e => {
                    if (e.key === 'ArrowUp') { e.preventDefault(); adjustMinute(1); }
                    else if (e.key === 'ArrowDown') { e.preventDefault(); adjustMinute(-1); }
                    else if (e.key === 'Enter') { e.preventDefault(); mInput.blur(); }
                });

                hInput.addEventListener('click', e => e.stopPropagation());
                hInput.addEventListener('focus', () => hInput.select());
                hInput.addEventListener('input', () => {
                    const val = hInput.value.replace(/\D/g, '');
                    if (val.length === 2) {
                        let h = parseInt(val) || 0;
                        if (h > 23) h = 23;
                        setHourMinute(h, selMinute);
                        mInput.focus();
                    }
                });
                hInput.addEventListener('blur', () => {
                    let h = parseInt(hInput.value) || 0;
                    if (h > 23) h = 23;
                    if (h < 0) h = 0;
                    setHourMinute(h, selMinute);
                });

                mInput.addEventListener('click', e => e.stopPropagation());
                mInput.addEventListener('focus', () => mInput.select());
                mInput.addEventListener('input', () => {
                    const val = mInput.value.replace(/\D/g, '');
                    if (val.length === 2) {
                        let m = parseInt(val) || 0;
                        if (m > 59) m = 59;
                        setHourMinute(selHour, m);
                    }
                });
                mInput.addEventListener('blur', () => {
                    let m = parseInt(mInput.value) || 0;
                    if (m > 59) m = 59;
                    if (m < 0) m = 0;
                    setHourMinute(selHour, m);
                });

                nowBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    const n = new Date();
                    selYear = n.getFullYear();
                    selMonth = n.getMonth() + 1;
                    selDay = n.getDate();
                    viewYear = selYear;
                    viewMonth = selMonth;
                    setHourMinute(n.getHours(), n.getMinutes(), true);
                });

                doneBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    close();
                });

                popup.appendChild(timeFooter);
            }
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
            const iso = currentIso();
            el.value = isoToDisplay(iso);
            saveValue(iso);
            if (hasTime) {
                renderPopup();
            } else {
                close();
            }
        }

        // ── Open / close ─────────────────────────────────────────────────────
        function open() {
            if (isOpen) return;
            isOpen     = true;
            showMonths = false;
            editYear   = false;
            if (!popup) {
                popup = mk('div', 'vkm-dp');
                const userConfig = (typeof window !== 'undefined' && window.vkmConfig && window.vkmConfig.datepicker) || {};

                // Panel colors: Tailwind classes (string or object.panel) or default x-form theme
                let panelClasses = 'vkm-dp-default-colors';
                if (typeof userConfig.colors === 'string') {
                    panelClasses = userConfig.colors;
                } else if (userConfig.colors && typeof userConfig.colors.panel === 'string') {
                    panelClasses = userConfig.colors.panel;
                }
                const colorList = panelClasses.split(/\s+/).filter(Boolean);
                popup.classList.add(...colorList);

                if (userConfig.classes) {
                    const clsList = Array.isArray(userConfig.classes) ? userConfig.classes : userConfig.classes.split(' ').filter(Boolean);
                    popup.classList.add(...clsList);
                }
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
            if (hasTime) {
                const digits = raw.replace(/\D/g, '').slice(0, 12);
                let out = digits.slice(0, 4);
                if (digits.length > 4) out += '/' + digits.slice(4, 6);
                if (digits.length > 6) out += '/' + digits.slice(6, 8);
                if (digits.length > 8) out += ' ' + digits.slice(8, 10);
                if (digits.length > 10) out += ':' + digits.slice(10, 12);
                return out;
            }

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

            const targetLen = hasTime ? 16 : 10;
            if (masked.length === targetLen) {
                const iso = displayToIso(masked);
                if (iso) {
                    setFromIso(iso, false);
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
        el.setAttribute('placeholder', hasTime ? 'YYYY/MM/DD HH:mm' : 'YYYY/MM/DD');
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
