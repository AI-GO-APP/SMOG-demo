/**
 * components/case-modal.js
 * 案件詳細 Modal 元件
 *
 * 功能：
 * - 顯示案件所有欄位
 * - 變更狀態
 *
 * 未來擴充：
 * - 編輯客戶資訊
 * - 取消案件
 * - 新增備註
 */

const CaseModalComponent = (() => {

  const MODAL_ID = 'case-detail-modal';

  function open(caseId) {
    const c = MockData.CASES.find(x => x.id === caseId)
           || MockData.getPendingCases().find(x => x.id === caseId);
    if (!c) return;

    State.set('selectedCaseId', caseId);
    _ensureModal();

    const v = c.vehicleId ? MockData.VEHICLES.find(x => x.id === c.vehicleId) : null;

    document.getElementById('modal-case-title').innerHTML = `
      ${c.customer} <span class="text-base font-normal text-gray-500">(${c.id})</span>
    `;
    document.getElementById('case-detail-body').innerHTML = _renderBody(c, v);

    const sel = document.getElementById('status-changer');
    sel.innerHTML = MockData.STATUS_LIST
      .map(s => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${s}</option>`)
      .join('');

    document.getElementById(MODAL_ID).style.display = 'flex';
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (el) el.style.display = 'none';
  }

  function _renderBody(c, v) {
    // 取得車上師傅
    const members = v ? MockData.getVehicleMembers(v.id) : [];
    const memberNames = members.map(m => m.name).join(' / ');
    const vehicleHtml = v
      ? `<span style="display:inline-flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:${v.color};"></span>${v.name}</span>`
      : '<span class="text-orange-600">尚未排車</span>';

    return `
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div><div class="text-gray-500 text-xs">類型</div><div class="font-medium">${c.type}</div></div>
        <div><div class="text-gray-500 text-xs">狀態</div><div><span class="status-badge status-${c.status}">${c.status}</span></div></div>
        <div><div class="text-gray-500 text-xs">時間</div><div class="font-medium">${c.start || '未排'} · ${c.duration}min</div></div>
        <div><div class="text-gray-500 text-xs">負責車輛</div><div class="font-medium">${vehicleHtml}</div></div>
        <div><div class="text-gray-500 text-xs">出勤師傅</div><div class="font-medium">${memberNames || '<span style="color:#9CA3AF;">－</span>'}</div></div>
        <div><div class="text-gray-500 text-xs">電話</div><div class="font-medium">${c.phone}</div></div>
        <div><div class="text-gray-500 text-xs">金額</div><div class="font-medium">${c.amount ? 'NT$ ' + c.amount.toLocaleString() : '-'}</div></div>
        <div><div class="text-gray-500 text-xs">來源</div><div class="font-medium">${c.source || '-'}</div></div>
        <div class="col-span-2"><div class="text-gray-500 text-xs">地址</div><div class="font-medium">${c.address}</div></div>
        <div class="col-span-2"><div class="text-gray-500 text-xs">備註</div><div class="text-sm">${c.notes || '-'}</div></div>
      </div>
    `;
  }

  async function _updateStatus() {
    const newStatus = document.getElementById('status-changer').value;
    const id = State.get('selectedCaseId');
    let c = MockData.CASES.find(x => x.id === id);
    if (!c) c = MockData.getPendingCases().find(x => x.id === id);
    if (!c) return;

    const btn = document.getElementById('update-status-btn');
    const origText = btn.innerText;
    btn.disabled = true;
    btn.innerText = '更新中...';

    try {
      // ⭐ 寫到 DB
      await DataWriter.updateCaseStatus(c.id, newStatus);
      // DB 成功才更新前端
      c.status = newStatus;
      // 諮詢中/已取消 → 同步前端清空排程資訊
      if (newStatus === '諮詢中' || newStatus === '已取消') {
        c.vehicleId = null;
        c.date = null;
        c.start = null;
      }
      // 安全渲染：只在元素存在時才呼叫
      try {
        if (typeof TimelineComponent !== 'undefined' &&
            (document.getElementById('timeline-container') || document.getElementById('timeline-grid'))) {
          TimelineComponent.render();
        }
        if (typeof PendingListComponent !== 'undefined') {
          PendingListComponent.render();
        }
        // 如果目前頁面是任何含案件清單的，重新 navigate refresh
        if (typeof Router !== 'undefined') {
          const cur = Router.getCurrent();
          if (cur) Router.navigate(cur);
        }
      } catch (renderErr) {
        console.warn('[case-modal] post-update render skipped:', renderErr);
      }
      close();
    } catch (err) {
      console.error('[case-modal] updateStatus failed:', err);
      alert('儲存到 DB 失敗：' + err.message);
      btn.disabled = false;
      btn.innerText = origText;
    }
  }

  function _ensureModal() {
    if (document.getElementById(MODAL_ID)) return;

    const root = document.getElementById('modal-root');
    const div = document.createElement('div');
    div.id = MODAL_ID;
    div.className = 'modal-overlay';
    div.style.display = 'none';
    div.innerHTML = `
      <div class="modal-content p-6">
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-xl font-bold" id="modal-case-title">案件詳細</h2>
          <button class="close-btn text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div id="case-detail-body"></div>
        <div class="mt-6 pt-4 border-t" style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <button class="close-btn" style="padding:8px 16px; border:1px solid #D1D5DB; border-radius:6px; background:white; cursor:pointer;">關閉</button>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button id="edit-inquiry-btn" style="padding:8px 12px; background:white; color:#374151; border:1px solid #D1D5DB; border-radius:6px; cursor:pointer; font-size:13px;">編輯諮詢</button>
            <button id="reschedule-btn" style="padding:8px 12px; background:#F59E0B; color:white; border:none; border-radius:6px; cursor:pointer; font-size:13px;">更改時程</button>
            <select id="status-changer" style="padding:6px 10px; border:1px solid #D1D5DB; border-radius:6px; font-size:13px;"></select>
            <button id="update-status-btn" style="padding:8px 16px; background:#2563EB; color:white; border:none; border-radius:6px; cursor:pointer;">更新狀態</button>
          </div>
        </div>
      </div>
    `;
    root.appendChild(div);

    div.querySelectorAll('.close-btn').forEach(b => b.onclick = close);
    div.querySelector('#update-status-btn').onclick = _updateStatus;

    const rescheduleBtn = div.querySelector('#reschedule-btn');
    if (rescheduleBtn) rescheduleBtn.onclick = _reschedule;

    const editBtn = div.querySelector('#edit-inquiry-btn');
    if (editBtn) editBtn.onclick = _editInquiry;
  }

  /** 編輯諮詢 — 重用 NewInquiryModal 的編輯模式 */
  function _editInquiry() {
    const id = State.get('selectedCaseId');
    if (!id) return;
    close();
    if (typeof NewInquiryModal !== 'undefined') {
      NewInquiryModal.open({ editCaseId: id });
    } else {
      alert('NewInquiryModal 尚未載入');
    }
  }

  /** 更改時程 — 把該案件當成 newCase 重新跑建議 */
  function _reschedule() {
    const id = State.get('selectedCaseId');
    let c = MockData.CASES.find(x => x.id === id);
    if (!c) c = MockData.getPendingCases().find(x => x.id === id);
    if (!c) return;

    // 關閉本 modal
    close();

    // 打開建議 modal，帶上 rescheduleCaseId
    if (typeof SuggestionsModalComponent !== 'undefined') {
      SuggestionsModalComponent.show({
        type: c.type,
        duration: c.duration,
        customer: c.customer,
        phone: c.phone,
        address: c.address,
        lat: c.lat,
        lng: c.lng,
        amount: c.amount || 0,
        notes: c.notes,
        locationCode: c.locationCode,
        preferred_date: c.preferred_date || null,
        preferred_start: c.preferred_start || null,
      }, { rescheduleCaseId: c.id });
    }
  }

  return { open, close };
})();
