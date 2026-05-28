/**
 * pages/vehicle-team-page.js
 * 車組配對頁 — 月視圖，一次排整月
 *
 * 結構：
 *   月份切換器 + 分區 filter
 *   表格：列 = 車輛 / 欄 = 該月每一天
 *   每格 = 該天該車的師傅清單（駕駛 + 副手）
 *   點格子 → 開 AssignmentModal 編輯
 */

const VehicleTeamPage = (() => {

  // 當前月份字串 'YYYY-MM'
  let _yyyymm = new Date().toISOString().slice(0, 7);
  // 該月所有 daily_assignments {dateStr: {vehicleCode: [{personCode, isDriver, personName}]}}
  let _monthData = {};

  function render(container) {
    container.innerHTML = `
      <div class="page-container">
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h1 style="font-size:var(--fs-xl); font-weight:700;">🚐 車組配對</h1>
            <p style="font-size:var(--fs-sm); color:var(--c-text-mute); margin-top:4px;">一次排整月的車↔人配對，點格子編輯</p>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn-primary" id="vt-edit-person-btn" title="批次編輯某人整月排班">📅 編輯個人排班</button>
            <button class="btn-secondary" id="vt-prev-month" title="上個月">◀</button>
            <input type="month" id="vt-month-picker" value="${_yyyymm}" class="form-input" style="width:140px;" />
            <button class="btn-secondary" id="vt-next-month" title="下個月">▶</button>
            <button class="btn-secondary" id="vt-today" title="跳到本月">今天</button>
          </div>
        </div>

        <div class="page-body">
          ${LocationFilter.render()}

          <div id="vt-table-wrap" style="overflow-x:auto; background:white; border:1px solid var(--c-border); border-radius:8px;">
            <div id="vt-loading" style="text-align:center; padding:40px; color:#9CA3AF;">載入中...</div>
          </div>
        </div>
      </div>
    `;

    LocationFilter.bind(container, () => render(container));

    container.querySelector('#vt-month-picker').onchange = (e) => {
      _yyyymm = e.target.value;
      _loadAndRender();
    };
    container.querySelector('#vt-prev-month').onclick = () => _shiftMonth(-1);
    container.querySelector('#vt-next-month').onclick = () => _shiftMonth(1);
    container.querySelector('#vt-today').onclick = () => {
      _yyyymm = new Date().toISOString().slice(0, 7);
      render(container);
    };

    container.querySelector('#vt-edit-person-btn').onclick = () => {
      _openPersonPicker();
    };

    _loadAndRender();
  }

  function _shiftMonth(delta) {
    const [y, m] = _yyyymm.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    _yyyymm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const picker = document.getElementById('vt-month-picker');
    if (picker) picker.value = _yyyymm;
    _loadAndRender();
  }

  /** 載入該月所有 daily_assignments → 渲染表格 */
  async function _loadAndRender() {
    const wrap = document.getElementById('vt-table-wrap');
    if (!wrap) return;
    wrap.innerHTML = '<div style="text-align:center; padding:40px; color:#9CA3AF;">載入中...</div>';

    try {
      const [y, m] = _yyyymm.split('-').map(Number);
      const firstDay = `${_yyyymm}-01`;
      const lastDate = new Date(y, m, 0).getDate();    // 該月最後一天 (28~31)
      const lastDay  = `${_yyyymm}-${String(lastDate).padStart(2, '0')}`;

      const { data, error } = await SupabaseClient
        .from('daily_assignments')
        .select('*, vehicle:vehicles(code, name), technician:technicians(code, name)')
        .gte('assignment_date', firstDay)
        .lte('assignment_date', lastDay);

      if (error) throw error;

      // 整理成 {dateStr: {vehicleCode: [{personCode, isDriver, personName}]}}
      _monthData = {};
      (data || []).forEach(a => {
        const date = a.assignment_date;
        const vCode = a.vehicle?.code;
        const pCode = a.technician?.code;
        const pName = a.technician?.name;
        if (!date || !vCode || !pCode) return;
        if (!_monthData[date]) _monthData[date] = {};
        if (!_monthData[date][vCode]) _monthData[date][vCode] = [];
        _monthData[date][vCode].push({ personCode: pCode, isDriver: a.is_driver, personName: pName });
      });

      _renderTable(lastDate);
    } catch (err) {
      console.error('[VehicleTeamPage] load failed:', err);
      wrap.innerHTML = `<div style="padding:20px; color:#B91C1C;">載入失敗：${err.message}</div>`;
    }
  }

  function _renderTable(daysInMonth) {
    const wrap = document.getElementById('vt-table-wrap');
    if (!wrap) return;

    const vehicles = MockData.VEHICLES.filter(v => LocationFilter.isInFilter(v.locationCode))
                                       .slice().sort(_sortByBranchThenCode);

    if (vehicles.length === 0) {
      wrap.innerHTML = '<div style="padding:40px; text-align:center; color:#9CA3AF;">沒有符合條件的車輛（請調整分區）</div>';
      return;
    }

    // 表頭：日期 1~lastDate
    const [y, m] = _yyyymm.split('-').map(Number);
    const todayStr = new Date().toISOString().slice(0, 10);
    const headerCells = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${_yyyymm}-${String(d).padStart(2, '0')}`;
      const dow = new Date(y, m - 1, d).getDay(); // 0=Sun
      const isWeekend = (dow === 0 || dow === 6);
      const isToday = dateStr === todayStr;
      headerCells.push(`
        <th class="vt-date-th ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}">
          <div class="vt-date-num">${d}</div>
          <div class="vt-date-dow">${'日一二三四五六'[dow]}</div>
        </th>
      `);
    }

    // 列：每台車一列
    const rows = vehicles.map(v => {
      const cells = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${_yyyymm}-${String(d).padStart(2, '0')}`;
        const assigns = (_monthData[dateStr] && _monthData[dateStr][v.id]) || [];
        const driver = assigns.find(a => a.isDriver);
        const passengers = assigns.filter(a => !a.isDriver);

        const dow = new Date(y, m - 1, d).getDay();
        const isWeekend = (dow === 0 || dow === 6);

        cells.push(`
          <td class="vt-cell ${isWeekend ? 'weekend' : ''}"
              data-vehicle="${v.id}" data-date="${dateStr}"
              title="點擊編輯 ${v.name} ${dateStr}">
            ${driver ? `<span class="vt-chip driver">🅓 ${driver.personName || driver.personCode}</span>` : ''}
            ${passengers.map(p => `<span class="vt-chip">${p.personName || p.personCode}</span>`).join('')}
            ${assigns.length === 0 ? '<span class="vt-empty">＋</span>' : ''}
          </td>
        `);
      }

      return `
        <tr>
          <td class="vt-branch-td">${v.locationName || v.locationCode || '-'}</td>
          <th class="vt-vehicle-th" style="text-align:center;">
            <div style="text-align:center;">
              <span class="vehicle-color-dot" style="background:${v.color}; width:12px; height:12px; vertical-align:middle; margin-right:6px;"></span>
              <strong style="font-size:16px; vertical-align:middle;">${v.name}</strong>
            </div>
            <div style="font-size:13px; color:#9CA3AF; margin-top:4px; text-align:center;">${v.id} · ${v.type}</div>
          </th>
          ${cells.join('')}
        </tr>
      `;
    }).join('');

    wrap.innerHTML = `
      <table class="vt-table">
        <thead>
          <tr>
            <th class="vt-branch-th">分部</th>
            <th class="vt-vehicle-th">車輛</th>
            ${headerCells.join('')}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    // 綁定格子 click → 開 AssignmentModal
    wrap.querySelectorAll('.vt-cell').forEach(cell => {
      cell.onclick = () => {
        const vCode = cell.dataset.vehicle;
        const date  = cell.dataset.date;
        if (typeof AssignmentModal !== 'undefined') {
          // 修改後重新載入該月資料
          const originalClose = AssignmentModal.close;
          AssignmentModal.open(vCode, date);
          // hack: 監聽 modal 關閉後 reload — 簡單做法：1秒後 reload
          // 比較好做法：改 AssignmentModal 暴露事件，這邊先用 polling
          const checkClosed = setInterval(() => {
            const modal = document.getElementById('assignment-modal');
            if (!modal || modal.style.display === 'none') {
              clearInterval(checkClosed);
              _loadAndRender();
            }
          }, 500);
        } else {
          alert('AssignmentModal 未載入');
        }
      };
    });
  }

  /** 開人員選擇器 — 簡單版用 prompt 列清單 */
  function _openPersonPicker() {
    const branchPeople = MockData.PEOPLE.filter(p => LocationFilter.isInFilter(p.locationCode))
      .sort((a, b) => (a.id || '').localeCompare(b.id || ''));

    if (branchPeople.length === 0) {
      alert('沒有符合條件的人員（請調整分區）');
      return;
    }

    // 用快速選擇 dialog
    const html = branchPeople.map((p, i) =>
      `<option value="${p.id}">${p.id} - ${p.name} (${p.locationName || ''})</option>`
    ).join('');

    // 簡單做：用 prompt + 數字選 (或 select dialog)
    // 為了流暢，建立一個小 dialog
    _showPersonPickerDialog(branchPeople);
  }

  function _showPersonPickerDialog(people) {
    // 移除舊的
    const old = document.getElementById('vt-person-picker-dialog');
    if (old) old.remove();

    const dialog = document.createElement('div');
    dialog.id = 'vt-person-picker-dialog';
    dialog.className = 'modal-overlay';
    dialog.style.display = 'flex';
    dialog.innerHTML = `
      <div class="modal-content" style="padding:20px; max-width:420px; width:90%;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="margin:0; font-size:16px; font-weight:700;">選擇要編輯排班的人員</h3>
          <button class="vt-pp-close" style="background:none; border:none; font-size:22px; color:#9CA3AF; cursor:pointer;">×</button>
        </div>
        <div style="max-height:50vh; overflow-y:auto;">
          ${people.map(p => `
            <button class="vt-pp-item" data-pid="${p.id}" style="display:block; width:100%; text-align:left; padding:10px 12px; margin-bottom:6px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:6px; cursor:pointer;">
              <strong>${p.name}</strong> <span style="color:#9CA3AF;">(${p.id})</span>
              <span style="float:right; font-size:12px; color:#6B7280;">${p.locationName || ''}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    document.getElementById('modal-root').appendChild(dialog);

    dialog.querySelector('.vt-pp-close').onclick = () => dialog.remove();
    dialog.querySelectorAll('.vt-pp-item').forEach(btn => {
      btn.onclick = () => {
        const pid = btn.dataset.pid;
        dialog.remove();
        if (typeof PersonAssignmentModal !== 'undefined') {
          PersonAssignmentModal.open(pid, _yyyymm);
        }
      };
    });
  }

  function _sortByCode(a, b) {
    const numA = parseInt((a.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    const numB = parseInt((b.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    return numA - numB;
  }

  function _sortByBranchThenCode(a, b) {
    const branchA = a.locationName || a.locationCode || '';
    const branchB = b.locationName || b.locationCode || '';
    if (branchA !== branchB) return branchA.localeCompare(branchB);
    return _sortByCode(a, b);
  }

  return { render };
})();

window.VehicleTeamPage = VehicleTeamPage;
