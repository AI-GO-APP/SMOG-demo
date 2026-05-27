/**
 * components/suggestions-modal.js
 * Top 3 建議插入位置 Modal 元件
 */

const SuggestionsModalComponent = (() => {

  const MODAL_ID = 'suggestions-modal';

  function show(newCase, options) {
    options = options || {};
    State.set('lastNewCaseDraft', newCase);
    State.set('rescheduleCaseId', options.rescheduleCaseId || null);  // 更改時程用
    // 更改時程時，排除自己原本的時段（不會跟自己衝突）
    if (options.rescheduleCaseId) newCase.excludeCaseId = options.rescheduleCaseId;
    // 用新版 14 天演算法（看 locationCode + 順路 vs 孤立）
    const sugs = SuggestionEngine.suggestForBooking(newCase);
    State.set('lastSuggestions', sugs);
    // 更新標題：根據是否為更改時程
    const titleEl = document.getElementById('suggestions-title');
    if (titleEl) {
      titleEl.textContent = options.rescheduleCaseId
        ? '更改時程 - 推薦時段 Top 5'
        : '建議插入位置 Top 5';
    }

    _ensureModal();

    const body = document.getElementById('suggestions-body');
    if (sugs.length === 0) {
      body.innerHTML = '<div class="p-6 text-center text-gray-500">😢 找不到合適的時段，請調整時長或日期</div>';
    } else {
      body.innerHTML = sugs.map((s, i) => _renderCard(s, i, newCase)).join('');
      // 綁 click
      body.querySelectorAll('.suggestion-card').forEach((el, idx) => {
        el.onclick = () => _accept(idx);
      });
    }

    // 綁複製按鈕
    const copyBtn = document.getElementById('copy-suggestions-btn');
    if (copyBtn) {
      copyBtn.onclick = () => _copyToClipboard(sugs, newCase, copyBtn);
    }

    document.getElementById(MODAL_ID).style.display = 'flex';
  }

  /** 把 Top 3 建議格式化複製到剪貼簿 (LINE 給客戶用) */
  function _copyToClipboard(sugs, newCase, btn) {
    if (!sugs || sugs.length === 0) return;
    const lines = sugs.map((s, i) => {
      // 算結束時間
      const startMin = Utils.timeToMinutes(s.startTime);
      const endMin = startMin + (newCase.duration || 60);
      const endTime = Utils.minutesToTime(endMin);
      // 日期格式: 5/28 (省略年份, LINE 簡訊用)
      const d = new Date(s.date);
      const md = `${d.getMonth() + 1}/${d.getDate()}`;
      return `${i+1}. ${md} ${s.startTime}~${endTime}`;
    });
    const text = lines.join('\n');

    // 複製到剪貼簿
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerText;
      btn.innerText = '✅ 已複製！';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerText = orig;
        btn.disabled = false;
      }, 1500);
    }).catch(err => {
      console.error('[suggestions] copy failed:', err);
      alert('複製失敗：' + err.message);
    });
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (el) el.style.display = 'none';
  }

  function _renderCard(s, i, newCase) {
    const dayDate = new Date(s.date);
    const dow = '日一二三四五六'[dayDate.getDay()];
    const isWeekend = (dayDate.getDay() === 0 || dayDate.getDay() === 6);
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    const prevName = s.prev ? s.prev.customer : '從總部出發';
    const nextName = s.next ? s.next.customer : '回總部';

    const cardBg    = i === 0 ? '#EFF6FF' : 'white';
    const cardBorder= i === 0 ? '2px solid #3B82F6' : '1px solid #E5E7EB';
    const scoreCol  = i === 0 ? '#059669' : '#374151';

    return `
      <div class="suggestion-card" style="cursor:pointer; background:${cardBg}; border:${cardBorder}; border-radius:10px; padding:14px;">

        <!-- 第一行：編號 + 日期 + 時間 vs 分數 -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <span style="display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; background:#3B82F6; color:white; border-radius:50%; font-weight:700; font-size:14px; flex-shrink:0;">${i+1}</span>
            <span style="font-size:18px; font-weight:700; color:${isWeekend ? '#B45309' : '#111827'};">📅 ${s.date}</span>
            <span style="font-size:13px; color:#6B7280;">週${dow}${isWeekend ? '（假日）' : ''}</span>
            <span style="font-size:18px; font-weight:700;">⏰ ${s.startTime}</span>
            <span style="font-size:12px; color:#6B7280;">（${newCase.duration} 分鐘）</span>
          </div>
          <div style="text-align:right; flex-shrink:0;">
            <div style="font-size:11px; color:#9CA3AF;">分數</div>
            <div style="font-size:18px; font-weight:700; color:${scoreCol};">${s.score.toFixed(0)}</div>
          </div>
        </div>

        <!-- 第二行：車輛 + 前後鄰居 -->
        ${newCase.type === '線上丈量' ? `
        <div style="display:flex; align-items:center; gap:8px; padding:8px 0; border-top:1px solid #F3F4F6; flex-wrap:wrap;">
          <span style="font-size:15px; font-weight:600;">${medal} 💻 線上專員</span>
        </div>
        ` : `
        <div style="display:flex; align-items:center; gap:8px; padding:8px 0; border-top:1px solid #F3F4F6; flex-wrap:wrap;">
          <span style="font-size:15px; font-weight:600;">${medal} ${s.vehicleName}</span>
          <span style="color:#9CA3AF;">·</span>
          <span style="font-size:13px; color:#4B5563;">
            <span style="color:#9CA3AF;">前一個：</span><strong>${prevName}</strong>
            <span style="margin:0 6px; color:#9CA3AF;">→</span>
            <span style="color:#9CA3AF;">下一個：</span><strong>${nextName}</strong>
          </span>
        </div>
        `}

        <!-- 第三行：說明 -->
        <div style="font-size:11px; color:#6B7280; padding-top:6px; border-top:1px dashed #E5E7EB;">
          ${s.reason || ''}
          ${(s.isIsolated || newCase.type === '線上丈量') ? '' : `
            <span style="margin-left:8px;">· 距路線 ${s.totalDist ? s.totalDist.toFixed(1) : 0} km</span>
            ${s.minDist != null ? `<span style="margin-left:8px;">· 最近案件 ${s.minDist.toFixed(1)} km</span>` : ''}
          `}
        </div>

        ${s.preferenceMatch ? `
        <div style="font-size:11px; padding:6px 8px; margin-top:6px; background:#FEF3C7; color:#92400E; border-radius:4px;">
          🎯 客戶期望：${s.preferenceMatch}
        </div>
        ` : ''}
      </div>
    `;
  }

  async function _accept(idx) {
    const sugs = State.get('lastSuggestions');
    const draft = State.get('lastNewCaseDraft');
    const rescheduleId = State.get('rescheduleCaseId');
    const s = sugs[idx];
    if (!s || !draft) return;

    // 更改時程模式：UPDATE 既有案件
    if (rescheduleId) {
      try {
        await DataWriter.updateCaseSchedule(rescheduleId, {
          vehicleCode: s.vehicleId,
          date: s.date,
          start: s.startTime,
          duration: draft.duration,
        });
        // 更新前端 MockData
        const existing = MockData.CASES.find(x => x.id === rescheduleId);
        if (existing) {
          existing.vehicleId = s.vehicleId;
          existing.date = s.date;
          existing.start = s.startTime;
        }
        close();
        // 安全重新渲染（多個畫面都更新）
        try {
          if (typeof TimelineComponent !== 'undefined') {
            const tlEl = document.getElementById('timeline-container') || document.getElementById('timeline-grid');
            if (tlEl) TimelineComponent.render();
          }
          // 同時 refresh 當前頁面
          if (typeof Router !== 'undefined') {
            const cur = Router.getCurrent();
            if (cur) Router.navigate(cur);
          }
        } catch (e) { console.warn('render err:', e); }
        setTimeout(() =>
          alert(`✅ 已將「${draft.customer}」改至 ${s.date} ${s.startTime} ${s.vehicleName}`),
          100
        );
      } catch (err) {
        console.error('[suggestions] reschedule failed:', err);
        alert('更改時程失敗：' + err.message);
      }
      return;
    }

    // 用 timestamp-based code 避免撞 unique key
    const todayStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
    const newId = 'C' + todayStr + '-' + Date.now().toString().slice(-6);
    const newCase = {
      id: newId,
      vehicleId: s.vehicleId,
      date: s.date,  // 用建議的日期
      start: s.startTime,
      duration: draft.duration,
      type: draft.type,
      customer: draft.customer,
      phone: draft.phone,
      address: draft.address,
      lat: draft.lat,
      lng: draft.lng,
      status: draft.type === '施作' ? '已排施作' : '已排丈量',
      amount: draft.amount,
      notes: draft.notes,
      source: 'LINE',
    };

    try {
      // ⭐ 寫到 DB
      const dbId = await DataWriter.createCase({
        code:      newId,
        customer:  { name: newCase.customer, phone: newCase.phone },
        phone:     newCase.phone,
        address:   newCase.address,
        lat:       newCase.lat,
        lng:       newCase.lng,
        type:      newCase.type,
        status:    newCase.status,
        source:    newCase.source,
        vehicleId: newCase.vehicleId,
        date:      newCase.date,
        start:     newCase.start,
        duration:  newCase.duration,
        amount:    newCase.amount,
        notes:     newCase.notes,
      });
      newCase._dbId = dbId;
      MockData.CASES.push(newCase);
      close();

      // 安全 render：只在元素存在時才呼叫
      try {
        if (typeof TimelineComponent !== 'undefined') {
          const tlEl = document.getElementById('timeline-container') || document.getElementById('timeline-grid');
          if (tlEl) TimelineComponent.render();
        }
        // 同時 refresh 當前頁面 (含 schedule, 因為未排清單會少一筆)
        if (typeof Router !== 'undefined') {
          const cur = Router.getCurrent();
          if (cur) Router.navigate(cur);
        }
      } catch (renderErr) {
        console.warn('[suggestions] post-save render skipped:', renderErr);
      }

      setTimeout(() =>
        alert(`✅ 已將「${newCase.customer}」排入 ${s.date} ${s.startTime} ${s.vehicleName}`),
        100
      );
    } catch (err) {
      console.error('[suggestions] accept failed:', err);
      alert('儲存到 DB 失敗：' + err.message);
    }
  }

  function _ensureModal() {
    // 強制每次重建（避免 cache 殘留舊 HTML）
    const existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();

    const root = document.getElementById('modal-root');
    const div = document.createElement('div');
    div.id = MODAL_ID;
    div.className = 'modal-overlay';
    div.style.display = 'none';
    div.innerHTML = `
      <div class="modal-content" style="padding:24px; max-width:680px; width:90%; max-height:85vh; display:flex; flex-direction:column;">

        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <h2 style="font-size:20px; font-weight:700; margin:0;" id="suggestions-title">建議插入位置 Top 5</h2>
          <button class="close-btn" style="background:none; border:none; font-size:24px; color:#9CA3AF; cursor:pointer; padding:0 4px;">×</button>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; gap:12px;">
          <p style="font-size:13px; color:#6B7280; margin:0;">未來 14 天內，依「順路 / 空白日下午」邏輯推薦</p>
          <button id="copy-suggestions-btn" class="btn-secondary" style="font-size:12px; padding:6px 12px; white-space:nowrap; flex-shrink:0;">📋 複製給客戶 (LINE)</button>
        </div>

        <div id="suggestions-body" style="display:flex; flex-direction:column; gap:12px; overflow-y:auto; flex:1;"></div>

        <div style="margin-top:16px; padding-top:14px; border-top:1px solid #E5E7EB; display:flex; justify-content:flex-end; gap:8px;">
          <button id="back-btn" class="btn-secondary">返回修改</button>
          <button class="close-btn btn-secondary">關閉</button>
        </div>
      </div>
    `;
    root.appendChild(div);

    div.querySelectorAll('.close-btn').forEach(b => b.onclick = close);
    div.querySelector('#back-btn').onclick = () => {
      close();
      NewCaseModalComponent.open();
    };
  }

  return { show, close };
})();
