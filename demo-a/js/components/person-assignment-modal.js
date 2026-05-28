/**
 * components/person-assignment-modal.js
 * 個人月排班批次編輯 modal
 *   - 表格: 車 (列) × 日期 (欄)
 *   - 點格子 = 該天派該人到該車 (radio per column)
 *   - 灰色 = 休假日 (不可選)
 *   - 儲存 = 批次 DELETE + INSERT daily_assignments
 */

const PersonAssignmentModal = (() => {

  const MODAL_ID = 'person-assignment-modal';
  // 不上班的 shift status
  const OFF_STATUSES = ['休假', '特休', '事假', '病假', 'off_duty', 'annual_leave', 'personal_leave', 'sick_leave'];

  let _ctx = null;
  // _ctx = {
  //   personCode, personName, personDbId, branchCode,
  //   yyyymm, daysInMonth,
  //   vehicles: [{code, name, color, type}],
  //   selections: { 'YYYY-MM-DD': vehicleCode (or null) },
  //   offDays: Set('YYYY-MM-DD'),
  // }

  async function open(personCode, yyyymmInit) {
    _ensureModal();

    const yyyymm = yyyymmInit || new Date().toISOString().slice(0, 7);
    const person = MockData.PEOPLE.find(p => p.id === personCode);
    if (!person) {
      alert('找不到人員：' + personCode);
      return;
    }
    if (!person._dbId) {
      alert('該人員缺少 DB id (_dbId)');
      return;
    }

    document.getElementById(MODAL_ID).style.display = 'flex';
    document.getElementById('pam-body').innerHTML = '<div style="text-align:center; padding:40px;"><div class="loader" style="margin:0 auto;"></div><p style="margin-top:10px;">載入中...</p></div>';

    try {
      const [y, m] = yyyymm.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const firstDay = `${yyyymm}-01`;
      const lastDay  = `${yyyymm}-${String(daysInMonth).padStart(2, '0')}`;

      // 1) 該人該月所有 daily_assignments
      const { data: assigns, error: aErr } = await SupabaseClient
        .from('daily_assignments')
        .select('*, vehicle:vehicles(code)')
        .eq('technician_id', person._dbId)
        .gte('assignment_date', firstDay)
        .lte('assignment_date', lastDay);
      if (aErr) throw aErr;

      const selections = {};
      (assigns || []).forEach(a => {
        if (a.vehicle?.code) selections[a.assignment_date] = a.vehicle.code;
      });

      // 2) 該人該月 shifts (找休假日)
      const offDays = new Set();
      (MockData.SHIFTS || [])
        .filter(s => s.personId === personCode && s.date.startsWith(yyyymm))
        .forEach(s => {
          if (OFF_STATUSES.includes(s.status)) offDays.add(s.date);
        });

      // 3) 該分區車輛
      const vehicles = MockData.VEHICLES.filter(v => v.locationCode === person.locationCode);

      _ctx = {
        personCode,
        personName: person.name,
        personDbId: person._dbId,
        branchCode: person.locationCode,
        yyyymm,
        daysInMonth,
        firstDay, lastDay,
        vehicles,
        selections,
        offDays,
      };

      _renderBody();
    } catch (err) {
      console.error('[PersonAssignmentModal] load failed:', err);
      document.getElementById('pam-body').innerHTML = `<div style="padding:20px; color:#B91C1C;">載入失敗：${err.message}</div>`;
    }
  }

  function _renderBody() {
    const { personName, yyyymm, daysInMonth, vehicles, selections, offDays } = _ctx;
    const [y, m] = yyyymm.split('-').map(Number);
    const todayStr = new Date().toISOString().slice(0, 10);

    document.getElementById('pam-title').innerHTML = `編輯 <strong>${personName}</strong>（${_ctx.personCode}）· ${yyyymm}`;

    // 表頭：日期 1~N
    const headers = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yyyymm}-${String(d).padStart(2, '0')}`;
      const dow = new Date(y, m - 1, d).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isToday = dateStr === todayStr;
      headers.push(`
        <th class="pam-date-th ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}">
          <div>${d}</div>
          <div style="font-size:10px; color:#9CA3AF;">${'日一二三四五六'[dow]}</div>
        </th>
      `);
    }

    // 車輛列
    const rows = vehicles.map(v => {
      const cells = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${yyyymm}-${String(d).padStart(2, '0')}`;
        const isOff = offDays.has(dateStr);
        const isSelected = selections[dateStr] === v.id;
        const dow = new Date(y, m - 1, d).getDay();
        const isWeekend = dow === 0 || dow === 6;

        let cls = 'pam-cell';
        if (isOff) cls += ' off';
        else if (isSelected) cls += ' selected';
        else if (isWeekend) cls += ' weekend';

        cells.push(`
          <td class="${cls}" data-vid="${v.id}" data-date="${dateStr}">
            ${isOff ? '休' : (isSelected ? '✓' : '')}
          </td>
        `);
      }
      return `
        <tr>
          <th class="pam-veh-th">
            <span class="vehicle-color-dot" style="background:${v.color}; width:8px; height:8px; display:inline-block; margin-right:4px;"></span>
            ${v.name}<br/><span style="font-size:10px; color:#9CA3AF;">${v.id}·${v.type}</span>
          </th>
          ${cells.join('')}
        </tr>
      `;
    }).join('');

    document.getElementById('pam-body').innerHTML = `
      <p style="margin:0 0 12px 0; font-size:13px; color:#6B7280;">
        點格子 = 該天派此人到該車（同天再點別台 = 改派）。灰色 = 該天休假。
      </p>
      <div style="overflow:auto; max-height:55vh; border:1px solid #E5E7EB; border-radius:6px;">
        <table class="pam-table">
          <thead>
            <tr>
              <th class="pam-veh-th">車輛</th>
              ${headers.join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;

    // 綁點擊
    document.querySelectorAll('.pam-cell').forEach(cell => {
      cell.onclick = () => _toggleCell(cell);
    });
  }

  function _toggleCell(cell) {
    if (cell.classList.contains('off')) return;
    const vid = cell.dataset.vid;
    const date = cell.dataset.date;
    const currentVid = _ctx.selections[date];

    if (currentVid === vid) {
      // 取消選擇
      _ctx.selections[date] = null;
    } else {
      _ctx.selections[date] = vid;
    }
    _renderBody();  // 重畫 (簡單)
  }

  async function _save() {
    const btn = document.getElementById('pam-save-btn');
    const orig = btn.innerText;
    btn.disabled = true;
    btn.innerText = '儲存中...';

    try {
      const { personDbId, firstDay, lastDay, selections } = _ctx;

      // 1) 刪該人該月既有 assignments
      const { error: dErr } = await SupabaseClient
        .from('daily_assignments')
        .delete()
        .eq('technician_id', personDbId)
        .gte('assignment_date', firstDay)
        .lte('assignment_date', lastDay);
      if (dErr) throw dErr;

      // 2) 插入新的 (selections 有值的)
      const rows = [];
      for (const [dateStr, vid] of Object.entries(selections)) {
        if (!vid) continue;
        const v = _ctx.vehicles.find(x => x.id === vid);
        if (!v || !v._dbId) continue;
        rows.push({
          technician_id: personDbId,
          vehicle_id:    v._dbId,
          assignment_date: dateStr,
          is_driver: false,  // 預設副手，駕駛在另一處改
        });
      }

      if (rows.length > 0) {
        const { error: iErr } = await SupabaseClient
          .from('daily_assignments')
          .insert(rows);
        if (iErr) throw iErr;
      }

      alert(`✅ 已儲存 ${_ctx.personName} ${_ctx.yyyymm} 排班（${rows.length} 筆）`);
      close();

      // 通知人車搭配頁刷新（如果在那頁）
      if (typeof VehicleTeamPage !== 'undefined' && typeof Router !== 'undefined') {
        if (Router.getCurrent() === 'vehicle-team') Router.navigate('vehicle-team');
      }
    } catch (err) {
      console.error('[PersonAssignmentModal] save failed:', err);
      alert('儲存失敗：' + err.message);
      btn.disabled = false;
      btn.innerText = orig;
    }
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (el) el.style.display = 'none';
    _ctx = null;
  }

  function _ensureModal() {
    const existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();

    const root = document.getElementById('modal-root');
    const div = document.createElement('div');
    div.id = MODAL_ID;
    div.className = 'modal-overlay';
    div.style.display = 'none';
    div.innerHTML = `
      <div class="modal-content" style="padding:20px; max-width:1200px; width:95%; max-height:90vh; display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-shrink:0;">
          <h2 id="pam-title" style="font-size:18px; font-weight:700; margin:0;">個人排班編輯</h2>
          <button class="close-btn" style="background:none; border:none; font-size:24px; color:#9CA3AF; cursor:pointer;">×</button>
        </div>
        <div id="pam-body" style="flex:1; overflow:auto; min-height:0;"></div>
        <div style="display:flex; justify-content:space-between; padding-top:14px; margin-top:14px; border-top:1px solid #E5E7EB; flex-shrink:0;">
          <button class="close-btn btn-secondary">取消</button>
          <button id="pam-save-btn" class="btn-primary">儲存排班</button>
        </div>
      </div>
    `;
    root.appendChild(div);

    div.querySelectorAll('.close-btn').forEach(b => b.onclick = close);
    div.querySelector('#pam-save-btn').onclick = _save;
  }

  return { open, close };
})();

window.PersonAssignmentModal = PersonAssignmentModal;
