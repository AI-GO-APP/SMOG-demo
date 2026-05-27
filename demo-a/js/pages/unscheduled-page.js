/**
 * pages/unscheduled-page.js
 * 未排案件頁 - 表格 + 篩選 + 批次處理
 */

const UnscheduledPage = (() => {

  let _activeTab = 'inquiry';  // 'inquiry' (諮詢中) 或 'installation' (待排施作)
  const _selected = new Set();

  function render(container) {
    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <div>
              <h1 style="font-size:var(--fs-xl); font-weight:700;">📋 未排案件</h1>
              <p style="font-size:var(--fs-sm); color:var(--c-text-mute); margin-top:4px;" id="unscheduled-count">－</p>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="btn-secondary" id="batch-suggest-btn">🎯 批次建議排程</button>
              <button class="btn-primary" id="unscheduled-new-inquiry-btn">+ 新增諮詢</button>
            </div>
          </div>

          <!-- Tab 切換 -->
          <div class="tab-bar" style="display:flex; gap:0; border-bottom:2px solid var(--c-border); margin-top:8px;">
            <button class="tab-btn ${'inquiry' === _activeTab ? 'active' : ''}" data-tab="inquiry"
                    style="padding:10px 20px; border:none; background:transparent; font-size:14px; cursor:pointer; border-bottom:3px solid transparent; transform:translateY(2px);">
              📞 諮詢中 <span id="tab-count-inquiry" style="margin-left:4px; padding:1px 8px; background:#E5E7EB; border-radius:10px; font-size:12px;">0</span>
            </button>
            <button class="tab-btn ${'installation' === _activeTab ? 'active' : ''}" data-tab="installation"
                    style="padding:10px 20px; border:none; background:transparent; font-size:14px; cursor:pointer; border-bottom:3px solid transparent; transform:translateY(2px);">
              🔧 待排施作 <span id="tab-count-installation" style="margin-left:4px; padding:1px 8px; background:#E5E7EB; border-radius:10px; font-size:12px;">0</span>
            </button>
          </div>
        </div>

        <div class="page-body">
          ${LocationFilter.render()}
          <div id="unscheduled-table-container" style="background:white; border:1px solid var(--c-border); border-radius:12px; overflow:hidden;"></div>
        </div>
      </div>
    `;

    container.querySelector('#batch-suggest-btn').onclick = _batchSuggest;

    // Tab 切換
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        _activeTab = btn.dataset.tab;
        render(container);  // 重新 render 才會更新 active 樣式
      };
    });

    // 「+ 新增諮詢」按鈕
    const inquiryBtn = container.querySelector('#unscheduled-new-inquiry-btn');
    if (inquiryBtn) inquiryBtn.onclick = () => {
      if (typeof NewInquiryModal !== 'undefined') NewInquiryModal.open();
    };

    LocationFilter.bind(container, () => render(container));
    _renderTable();
  }

  /** 諮詢中 tab 的案件：status='諮詢中' 且還沒派車 */
  function _inquiryCases() {
    return MockData.CASES.filter(c =>
      c.status === '諮詢中' &&
      !c.vehicleId &&
      LocationFilter.isInFilter(c.locationCode)
    );
  }

  /** 待排施作 tab 的案件：status='待排施作' 且還沒派車 */
  function _installationCases() {
    return MockData.CASES.filter(c =>
      c.status === '待排施作' &&
      !c.vehicleId &&
      LocationFilter.isInFilter(c.locationCode)
    );
  }

  function _filteredCases() {
    return _activeTab === 'inquiry' ? _inquiryCases() : _installationCases();
  }

  function _renderTable() {
    // 更新 tab 數字
    const inqCount = _inquiryCases().length;
    const insCount = _installationCases().length;
    const tabInq = document.getElementById('tab-count-inquiry');
    const tabIns = document.getElementById('tab-count-installation');
    if (tabInq) tabInq.textContent = inqCount;
    if (tabIns) tabIns.textContent = insCount;

    const cases = _filteredCases();
    const el = document.getElementById('unscheduled-table-container');
    document.getElementById('unscheduled-count').textContent = `共 ${cases.length} 筆 · 已選 ${_selected.size} 筆`;

    el.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:40px;"><input type="checkbox" id="select-all" /></th>
            <th>客戶</th>
            <th>類型</th>
            <th>狀態</th>
            <th>來源</th>
            <th>地址</th>
            <th>金額</th>
            <th>備註</th>
            <th style="text-align:right">操作</th>
          </tr>
        </thead>
        <tbody>
          ${cases.length === 0
            ? '<tr><td colspan="9" style="text-align:center; padding:40px; color:var(--c-text-mute);">沒有符合篩選條件的案件</td></tr>'
            : cases.map(c => `
              <tr>
                <td><input type="checkbox" class="row-check" data-id="${c.id}" ${_selected.has(c.id) ? 'checked' : ''} /></td>
                <td><div style="font-weight:600;">${c.customer}</div><div style="font-size:var(--fs-xs); color:var(--c-text-mute);">${c.phone}</div></td>
                <td>${c.type}</td>
                <td><span class="status-badge status-${c.status}">${c.status}</span></td>
                <td><span class="source-badge source-${c.source||'其他'}">${c.source || '-'}</span></td>
                <td style="font-size:var(--fs-sm); max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${c.address}">${c.address}</td>
                <td>${c.amount ? 'NT$ ' + c.amount.toLocaleString() : '-'}</td>
                <td style="font-size:var(--fs-xs); color:var(--c-text-mute); max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${c.notes||''}">${c.notes || '-'}</td>
                <td style="text-align:right; white-space:nowrap;">
                  <button class="link-btn" data-suggest="${c.id}">🎯 建議排入</button>
                  <button class="link-btn" data-detail="${c.id}">詳情</button>
                </td>
              </tr>
            `).join('')
          }
        </tbody>
      </table>
    `;

    // 綁定事件
    el.querySelector('#select-all').onchange = (e) => {
      cases.forEach(c => {
        if (e.target.checked) _selected.add(c.id);
        else _selected.delete(c.id);
      });
      _renderTable();
    };
    el.querySelectorAll('.row-check').forEach(cb => {
      cb.onchange = (e) => {
        if (e.target.checked) _selected.add(e.target.dataset.id);
        else _selected.delete(e.target.dataset.id);
        _updateCount();
      };
    });
    el.querySelectorAll('[data-suggest]').forEach(b => {
      b.onclick = () => _suggestOne(b.dataset.suggest);
    });
    el.querySelectorAll('[data-detail]').forEach(b => {
      b.onclick = () => CaseModalComponent.open(b.dataset.detail);
    });
  }

  function _updateCount() {
    const cases = _filteredCases();
    document.getElementById('unscheduled-count').textContent = `共 ${cases.length} 筆 · 已選 ${_selected.size} 筆`;
  }

  function _suggestOne(caseId) {
    const c = MockData.CASES.find(x => x.id === caseId);
    if (!c) return;
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
      preferred_date:  c.preferred_date  || null,   // 客戶期望日期
      preferred_start: c.preferred_start || null,   // 客戶期望時段
    });
  }

  function _batchSuggest() {
    if (_selected.size === 0) {
      alert('請先勾選要批次建議排程的案件');
      return;
    }
    alert(`📋 批次建議排程功能（demo）\n\n你選了 ${_selected.size} 筆案件。\n\n實際開發時，這裡會：\n1. 對每筆呼叫建議引擎\n2. 顯示一張總表，列出每筆的最佳建議\n3. 主管按「全部接受」一鍵排入時間軸\n\n目前先示範單筆建議（點 🎯 建議排入）`);
  }

  return { render };
})();
