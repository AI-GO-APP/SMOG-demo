/**
 * pages/kanban-page.js
 * 案件看板（Kanban）
 * - 欄位 = 案件狀態
 * - 卡片可拖拉到不同欄位 = 改變狀態（同一筆案件，不複製）
 */

const KanbanPage = (() => {

  /** 取得目前 location 過濾後的 cases */
  function _filteredCases() {
    return MockData.CASES.filter(c => LocationFilter.isInFilter(c.locationCode));
  }


  // 主要流程欄位（依 v0.3 schema）
  const MAIN_COLUMNS = [
    { status: '諮詢中',    icon: '📞', color: '#9CA3AF' },
    { status: '已排丈量',  icon: '📐', color: '#F59E0B' },
    { status: '已丈量',    icon: '✅', color: '#FBBF24' },
    { status: '等待報價',  icon: '💵', color: '#A78BFA' },
    { status: '已報價',    icon: '📋', color: '#8B5CF6' },
    { status: '待付訂金',  icon: '💳', color: '#84CC16' },
    { status: '待排施作',  icon: '📅', color: '#10B981' },
    { status: '已排施作',  icon: '🔧', color: '#19A8B5' },
    { status: '施作中',    icon: '⚙️', color: '#0EA5E9' },
    { status: '已完工',    icon: '🎉', color: '#059669' },
  ];

  // 例外欄位（v0.3 拿掉「後補名單」，改用 case.is_waiting_earlier 標記）
  const EXCEPTION_COLUMNS = [
    { status: '跳票',     icon: '❌', color: '#EF4444' },
    { status: '已取消',   icon: '🚫', color: '#6B7280' },
  ];

  function render(container) {
    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <h1 style="font-size:var(--fs-xl); font-weight:700;">🗂️ 案件看板</h1>
          <p style="font-size:var(--fs-sm); color:var(--c-text-mute); margin-top:4px;">拖拉卡片可改變狀態（同一筆案件流轉，不複製）· 共 ${_filteredCases().length} 筆</p>
        </div>

        <div class="page-body" style="padding:0;">
          <div style="padding:0 20px;">${LocationFilter.render()}</div>
          <div class="kanban-section">
            <h2 class="kanban-section-title">主要流程</h2>
            <div class="kanban-board" id="kanban-main"></div>
          </div>
          <div class="kanban-section" style="margin-top:24px;">
            <h2 class="kanban-section-title">例外處理</h2>
            <div class="kanban-board" id="kanban-exception"></div>
          </div>
        </div>
      </div>
    `;

    _renderColumns(document.getElementById('kanban-main'), MAIN_COLUMNS);
    _renderColumns(document.getElementById('kanban-exception'), EXCEPTION_COLUMNS);
  }

  function _renderColumns(container, columns) {
    container.innerHTML = '';
    columns.forEach(col => {
      const cases = _filteredCases().filter(c => c.status === col.status);
      const colEl = document.createElement('div');
      colEl.className = 'kanban-col';
      colEl.dataset.status = col.status;
      colEl.innerHTML = `
        <div class="kanban-col-header" style="border-top:3px solid ${col.color};">
          <div style="display:flex; align-items:center; gap:6px;">
            <span>${col.icon}</span>
            <span style="font-weight:600;">${col.status}</span>
          </div>
          <span class="kanban-col-count">${cases.length}</span>
        </div>
        <div class="kanban-col-body" data-drop-target="${col.status}">
          ${cases.map(c => _renderCard(c)).join('')}
          ${cases.length === 0 ? '<div style="text-align:center; padding:20px; font-size:var(--fs-xs); color:#CBD5E0;">— 沒有案件 —</div>' : ''}
        </div>
      `;
      container.appendChild(colEl);
    });

    // 綁定拖放
    LocationFilter.bind(container, () => render(container));
    container.querySelectorAll('[data-drop-target]').forEach(el => {
      el.ondragover = (e) => { e.preventDefault(); el.classList.add('drop-hover'); };
      el.ondragleave = () => el.classList.remove('drop-hover');
      el.ondrop = (e) => {
        e.preventDefault();
        el.classList.remove('drop-hover');
        const caseId = e.dataTransfer.getData('text/plain');
        const newStatus = el.dataset.dropTarget;
        _moveCase(caseId, newStatus);
      };
    });

    // 綁定 card click + drag
    container.querySelectorAll('.kanban-card').forEach(card => {
      card.draggable = true;
      card.ondragstart = (e) => {
        e.dataTransfer.setData('text/plain', card.dataset.caseId);
        card.classList.add('dragging');
      };
      card.ondragend = () => card.classList.remove('dragging');
      card.onclick = () => CaseModalComponent.open(card.dataset.caseId);
    });
  }

  function _renderCard(c) {
    const v = c.vehicleId ? MockData.VEHICLES.find(x => x.id === c.vehicleId) : null;
    return `
      <div class="kanban-card" data-case-id="${c.id}">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:6px;">
          <div style="font-weight:700;">${c.customer}</div>
          <span style="font-size:var(--fs-xs); color:var(--c-text-mute);">${c.id}</span>
        </div>
        <div style="display:flex; gap:4px; margin-bottom:6px; flex-wrap:wrap;">
          <span class="kanban-tag tag-type-${c.type}">${c.type}</span>
          ${c.amount ? `<span class="kanban-tag tag-amount">NT$ ${(c.amount/1000).toFixed(0)}k</span>` : ''}
        </div>
        <div style="font-size:var(--fs-xs); color:var(--c-text-mute); margin-bottom:4px;">
          📍 ${(c.address || '').replace(/^.+市/, '').slice(0, 18)}${(c.address||'').length > 18 ? '...' : ''}
        </div>
        ${c.start
          ? `<div style="font-size:var(--fs-xs); color:var(--c-text-mute);">⏰ ${c.start} · ${c.duration}min ${v ? '· ' + v.name : ''}</div>`
          : `<div style="font-size:var(--fs-xs); color:var(--c-text-mute);">📞 ${c.source || '其他'}</div>`
        }
      </div>
    `;
  }

  async function _moveCase(caseId, newStatus) {
    const c = MockData.CASES.find(x => x.id === caseId);
    if (!c) return;
    if (c.status === newStatus) return;

    try {
      // ⭐ 寫到 DB
      await DataWriter.updateCaseStatus(c.id, newStatus);
      // DB 成功才更新前端
      c.status = newStatus;
      Router.navigate('kanban');
    } catch (err) {
      console.error('[kanban] moveCase failed:', err);
      alert('儲存到 DB 失敗：' + err.message);
    }
  }

  return { render };
})();
