/**
 * components/assignment-modal.js
 * 編輯某車某天的人員配對 (daily_assignments)
 *
 * 流程：
 *   點時間軸車輛 cell 上的 ✏️ → open(vehicleCode, dateStr)
 *   → 從 DB 拉該車該天的配對 → 顯示勾選清單
 *   → 用戶勾選 + 指定駕駛 → 儲存（先 DELETE 舊的、INSERT 新的）
 *   → 更新前端 PEOPLE.vehicleId（如果是今天）→ 重新 render
 */

const AssignmentModal = (() => {

  const MODAL_ID = 'assignment-modal';
  let _ctx = null;  // {vehicleCode, dateStr, currentAssignments}

  async function open(vehicleCode, dateStr) {
    const v = MockData.VEHICLES.find(x => x.id === vehicleCode);
    if (!v) return;

    _ensureModal();

    // ⭐ 重置儲存按鈕（修 modal reuse 時殘留「儲存中...」狀態）
    const saveBtn = document.getElementById('asg-save-btn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerText = '儲存配對';
    }

    document.getElementById(MODAL_ID).style.display = 'flex';

    // 顯示 loading
    document.getElementById('asg-title').innerHTML = `
      <span style="display:inline-flex; align-items:center; gap:8px;">
        <span class="vehicle-color-dot" style="background:${v.color}; width:14px; height:14px;"></span>
        <strong>${v.name}</strong> · <span style="color:var(--c-text-mute);">${dateStr}</span>
      </span>
    `;
    document.getElementById('asg-body').innerHTML = '<div style="text-align:center; padding:30px;"><div class="loader" style="margin:0 auto;"></div><p style="margin-top:10px; color:#666;">載入配對中...</p></div>';

    // 從 DB 拉該車該天的 assignments + 當天所有車的 assignments（為了標記占用）
    let currentAssignments = [];
    let occupiedMap = {};   // personCode → { vehicleCode, vehicleName }
    try {
      const vehicleDbId = v._dbId;
      if (!vehicleDbId) throw new Error('車輛沒有 DB id（_dbId）');

      // 拉當天「所有車」的配對
      const { data: allDay, error } = await SupabaseClient
        .from('daily_assignments')
        .select('*, vehicle:vehicles(code, name), technician:technicians(code, name)')
        .eq('assignment_date', dateStr);

      if (error) throw error;

      (allDay || []).forEach(a => {
        const pc = a.technician?.code;
        const vc = a.vehicle?.code;
        const vn = a.vehicle?.name;
        if (!pc || !vc) return;
        if (vc === vehicleCode) {
          // 這台車
          currentAssignments.push({ personCode: pc, isDriver: a.is_driver });
        } else {
          // 別台車 → 標記占用
          occupiedMap[pc] = { vehicleCode: vc, vehicleName: vn };
        }
      });
    } catch (err) {
      console.error('[AssignmentModal] load failed:', err);
      document.getElementById('asg-body').innerHTML = `<div style="padding:20px; color:#B91C1C;">載入失敗：${err.message}</div>`;
      return;
    }

    _ctx = { vehicleCode, dateStr, currentAssignments, occupiedMap, vehicleLocationCode: v.locationCode };
    _renderBody();
  }

  function _renderBody() {
    const { currentAssignments, occupiedMap, vehicleLocationCode, dateStr } = _ctx;
    const checkedCodes = new Set(currentAssignments.map(a => a.personCode));
    const driverCode = currentAssignments.find(a => a.isDriver)?.personCode || '';

    // ⭐ 過濾「同分公司」的人員
    const samePeople = MockData.PEOPLE.filter(p =>
      !vehicleLocationCode || !p.locationCode || p.locationCode === vehicleLocationCode
    );

    // 不能上班的 shift status
    const OFF_STATUSES = ['休假', '特休', '事假', '病假'];

    document.getElementById('asg-body').innerHTML = `
      <p style="font-size:var(--fs-sm); color:var(--c-text-mute); margin-bottom:12px;">
        勾選今天在這台車的師傅，並指定 1 位駕駛（灰色 = 已在別台車或休假）：
      </p>
      <div id="asg-people-list" style="border:1px solid var(--c-border); border-radius:8px; overflow:hidden;">
        ${samePeople.map(p => {
          const isOccupied = !!occupiedMap[p.id];
          const occupiedVehicleName = isOccupied ? occupiedMap[p.id].vehicleName : '';

          // ⭐ 看當天 shift 狀態
          const shift = (MockData.SHIFTS || []).find(s => s.personId === p.id && s.date === dateStr);
          const shiftStatus = shift?.status || '上班';
          const isOff = OFF_STATUSES.includes(shiftStatus);

          const disabled = isOccupied || isOff;
          let label = '';
          if (isOff) label = `<span style="margin-left:8px; font-size:11px; color:#B45309; padding:2px 6px; background:#FEF3C7; border-radius:4px;">${shiftStatus}</span>`;
          else if (isOccupied) label = `<span style="margin-left:8px; font-size:11px; color:#9CA3AF; padding:2px 6px; background:#E5E7EB; border-radius:4px;">已在 ${occupiedVehicleName}</span>`;

          const rowStyle = disabled
            ? 'background:#F3F4F6; opacity:0.55; cursor:not-allowed;'
            : 'cursor:pointer;';

          return `
            <label style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid var(--c-border-soft); ${rowStyle} transition:background 0.15s;" class="asg-person-row">
              <input type="checkbox" data-person="${p.id}"
                ${checkedCodes.has(p.id) ? 'checked' : ''}
                ${disabled ? 'disabled' : ''}
                style="${disabled ? 'cursor:not-allowed;' : 'cursor:pointer;'}" />
              <span style="font-weight:600; min-width:60px;">${p.name}</span>
              <span style="font-size:var(--fs-xs); color:var(--c-text-mute);">${p.id}</span>
              ${label}
              <span style="margin-left:auto;">
                ${p.skills.map(s => `<span class="skill-${s}" style="font-size:11px;">${s}</span>`).join(' ')}
              </span>
              <label style="display:flex; align-items:center; gap:4px; cursor:pointer; font-size:var(--fs-xs);">
                <input type="radio" name="driver" value="${p.id}"
                  ${driverCode === p.id ? 'checked' : ''}
                  ${(!checkedCodes.has(p.id) || disabled) ? 'disabled' : ''} />
                <span>駕駛</span>
              </label>
            </label>
          `;
        }).join('')}
      </div>
    `;

    // checkbox 變動時：如果取消勾選，順便取消 driver radio
    document.querySelectorAll('#asg-people-list input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const personCode = cb.dataset.person;
        const driverRadio = document.querySelector(`#asg-people-list input[name="driver"][value="${personCode}"]`);
        if (driverRadio) {
          driverRadio.disabled = !cb.checked;
          if (!cb.checked && driverRadio.checked) {
            driverRadio.checked = false;
          }
        }
      });
    });
  }

  async function _save() {
    console.log('[AsgModal] 🟢 _save start, ctx:', _ctx);

    const checkedPersons = [...document.querySelectorAll('#asg-people-list input[type="checkbox"]:checked')]
      .map(cb => cb.dataset.person);
    const driverCode = document.querySelector('#asg-people-list input[name="driver"]:checked')?.value || null;
    console.log('[AsgModal] checkedPersons:', checkedPersons, 'driverCode:', driverCode);

    const assignments = checkedPersons.map(code => ({
      personCode: code,
      isDriver:   code === driverCode,
    }));

    if (assignments.length > 0 && !driverCode) {
      if (!confirm('還沒指定駕駛，確定要儲存嗎？')) return;
    }

    const saveBtn = document.getElementById('asg-save-btn');
    const orig = saveBtn.innerText;
    saveBtn.disabled = true;
    saveBtn.innerText = '儲存中...';

    // 失敗時恢復按鈕的 helper
    const restoreBtn = () => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerText = orig;
      }
    };

    try {
      console.log('[AsgModal] calling setDailyAssignment...');
      // 加 8 秒 timeout：任何原因 hang 就強制失敗
      const TIMEOUT_MS = 8000;
      await Promise.race([
        DataWriter.setDailyAssignment(_ctx.vehicleCode, _ctx.dateStr, assignments),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('儲存超時（8 秒），可能是網路或 DB 問題')), TIMEOUT_MS)
        ),
      ]);
      console.log('[AsgModal] ✅ setDailyAssignment done');

      // 如果是今天 → 更新前端 PEOPLE.vehicleId
      const today = new Date().toISOString().slice(0, 10);
      if (_ctx.dateStr === today) {
        MockData.PEOPLE.forEach(p => {
          if (p.vehicleId === _ctx.vehicleCode) p.vehicleId = null;
        });
        checkedPersons.forEach(code => {
          const p = MockData.PEOPLE.find(x => x.id === code);
          if (p) p.vehicleId = _ctx.vehicleCode;
        });
      }

      console.log('[AsgModal] calling close()...');
      close();
      console.log('[AsgModal] ✅ closed');

      // 重新 render timeline（包在 try 內以免錯誤吞掉）
      try {
        if (typeof TimelineComponent !== 'undefined') TimelineComponent.render();
      } catch (renderErr) {
        console.error('[AsgModal] timeline render error (ignored):', renderErr);
      }
      console.log('[AsgModal] ✅ all done');
    } catch (err) {
      console.error('[AsgModal] ❌ save failed:', err);
      alert('儲存失敗：' + err.message);
      restoreBtn();
    }
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (el) el.style.display = 'none';
    _ctx = null;
  }

  function _ensureModal() {
    if (document.getElementById(MODAL_ID)) return;

    const root = document.getElementById('modal-root');
    const div = document.createElement('div');
    div.id = MODAL_ID;
    div.className = 'modal-overlay';
    div.style.display = 'none';
    div.style.alignItems = 'flex-start';  // 強制 modal 從上方開始
    div.style.paddingTop = '0';
    div.innerHTML = `
      <div class="modal-content" style="padding:24px; max-width:520px; width:90%; max-height:85vh; display:flex; flex-direction:column; margin-top:5vh; align-self:flex-start;">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:16px; flex-shrink:0;">
          <h2 id="asg-title" style="font-size:var(--fs-lg); font-weight:700;">人員配對</h2>
          <button class="close-btn" style="background:none; border:none; font-size:24px; color:#9CA3AF; cursor:pointer;">×</button>
        </div>
        <div id="asg-body" style="flex:1; overflow-y:auto; min-height:0;"></div>
        <div style="display:flex; justify-content:space-between; padding-top:16px; margin-top:16px; border-top:1px solid var(--c-border); flex-shrink:0;">
          <button class="close-btn btn-secondary">取消</button>
          <button id="asg-save-btn" class="btn-primary">儲存配對</button>
        </div>
      </div>
    `;
    root.appendChild(div);

    div.querySelectorAll('.close-btn').forEach(b => b.onclick = close);
    div.querySelector('#asg-save-btn').onclick = _save;
  }

  return { open, close };
})();

window.AssignmentModal = AssignmentModal;
