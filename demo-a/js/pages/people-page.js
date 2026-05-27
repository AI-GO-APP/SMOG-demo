/**
 * pages/people-page.js
 * 人員與班表頁
 * - 上半：人員 CRUD
 * - 下半：月曆班表（人員 × 日期 矩陣）
 */

const PeoplePage = (() => {

  /** 取得目前 location 過濾後的 people */
  function _filteredByLocation() {
    return MockData.PEOPLE.filter(p => LocationFilter.isInFilter(p.locationCode));
  }


  const SHIFT_CYCLE = ['上班', '休假', '加班', '特休', '事假'];
  const SHIFT_COLORS = {
    '上班': { bg: '#DCFCE7', color: '#166534', label: '上' },
    '休假': { bg: '#F3F4F6', color: '#6B7280', label: '休' },
    '加班': { bg: '#DBEAFE', color: '#1E40AF', label: '加' },
    '特休': { bg: '#FEF3C7', color: '#92400E', label: '特' },
    '事假': { bg: '#FED7AA', color: '#9A3412', label: '事' },
    '病假': { bg: '#FECACA', color: '#991B1B', label: '病' },
  };

  let _currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // 依 code 中的數字排序（P1 < P2 < P10）
  function _sortByCodeNumber(a, b) {
    const numA = parseInt((a.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    const numB = parseInt((b.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    return numA - numB;
  }

  function render(container) {
    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h1 style="font-size:var(--fs-xl); font-weight:700;">👤 人員與班表</h1>
              <p style="font-size:var(--fs-sm); color:var(--c-text-mute); margin-top:4px;">${_filteredByLocation().length} 位人員 · 每月固定班表</p>
            </div>
            <button class="btn-primary" id="add-person-btn">+ 新增人員</button>
          </div>
        </div>

        <div class="page-body">
          ${LocationFilter.render()}
          <!-- 月曆班表 -->
          <section style="background:white; border:1px solid var(--c-border); border-radius:12px; padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h2 style="font-size:var(--fs-md); font-weight:600;">月曆班表</h2>
              <div style="display:flex; gap:8px; align-items:center;">
                <button class="btn-icon" id="prev-month">←</button>
                <input type="month" id="month-picker" value="${_currentMonth}" class="form-input" style="width:140px;" />
                <button class="btn-icon" id="next-month">→</button>
              </div>
            </div>

            <!-- 圖例 -->
            <div style="display:flex; gap:14px; margin-bottom:14px; font-size:var(--fs-sm); color:var(--c-text-mute); flex-wrap:wrap;">
              ${Object.entries(SHIFT_COLORS).map(([s, c]) =>
                `<span style="display:inline-flex; align-items:center; gap:5px;"><span style="display:inline-block; width:18px; height:18px; border-radius:4px; background:${c.bg}; color:${c.color}; text-align:center; line-height:18px; font-size:11px; font-weight:700;">${c.label}</span> ${s}</span>`
              ).join('')}
            </div>

            <p style="font-size:var(--fs-xs); color:var(--c-text-mute); margin-bottom:8px;">💡 點格子可循環切換狀態；加班預設 19:00-21:00</p>

            <div style="overflow-x:auto;">
              <div id="shift-calendar-container"></div>
            </div>
          </section>
        </div>
      </div>
    `;

    // 綁定 LocationFilter
    LocationFilter.bind(container, () => render(container));

        container.querySelector('#add-person-btn').onclick = () => _showPersonForm();
    container.querySelector('#prev-month').onclick = () => _shiftMonth(-1);
    container.querySelector('#next-month').onclick = () => _shiftMonth(1);
    container.querySelector('#month-picker').onchange = (e) => {
      _currentMonth = e.target.value;
      _renderShiftCalendar();
    };

    _renderPeopleTable();
    _renderShiftCalendar();
  }

  function _renderPeopleTable() {
    const el = document.getElementById('people-table-container');
    if (!el) return;  // 容器移除後不執行
    el.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>編號</th><th>姓名</th><th>技能</th><th>所屬車輛</th><th style="text-align:right">操作</th>
          </tr>
        </thead>
        <tbody>
          ${_filteredByLocation().slice().sort(_sortByCodeNumber).map(p => {
            const v = MockData.VEHICLES.find(x => x.id === p.vehicleId);
            return `
              <tr>
                <td style="font-family:monospace;">${p.id}</td>
                <td style="font-weight:600;">${p.name}</td>
                <td>${p.skills.map(s => `<span class="skill-${s}">${s}</span>`).join(' ')}</td>
                <td>${v ? `<span style="display:inline-flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:${v.color};"></span>${v.name}</span>` : '<span style="color:#9CA3AF;">未綁定</span>'}</td>
                <td style="text-align:right;">
                  <button class="link-btn" data-edit="${p.id}">編輯</button>
                  <button class="link-btn link-danger" data-del="${p.id}">刪除</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => _showPersonForm(b.dataset.edit));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => _deletePerson(b.dataset.del));
  }

  function _renderShiftCalendar() {
    const el = document.getElementById('shift-calendar-container');
    const [y, m] = _currentMonth.split('-').map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();

    let html = '<table class="shift-calendar"><thead><tr><th class="shift-name-col">人員</th>';
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m - 1, d);
      const dow = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      html += `<th class="shift-day-col ${isWeekend ? 'weekend' : ''}"><div>${d}</div><div class="shift-dow">${dow}</div></th>`;
    }
    html += '</tr></thead><tbody>';

    _filteredByLocation().slice().sort(_sortByCodeNumber).forEach(p => {
      html += `<tr><td class="shift-name-col"><div style="font-weight:600;">${p.name}</div><div style="font-size:var(--fs-xs); color:var(--c-text-mute);">${p.id}</div></td>`;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${_currentMonth}-${String(d).padStart(2, '0')}`;
        const shift = MockData.getShift(p.id, dateStr);
        const status = shift ? shift.status : '上班';
        const cfg = SHIFT_COLORS[status] || SHIFT_COLORS['上班'];
        const isOvertime = status === '加班';
        const ovTip = isOvertime && shift.overtime ? ` (${shift.overtime.start}-${shift.overtime.end})` : '';
        html += `<td class="shift-cell" data-person="${p.id}" data-date="${dateStr}" title="${status}${ovTip}" style="background:${cfg.bg}; color:${cfg.color};">${cfg.label}</td>`;
      }
      html += '</tr>';
    });
    html += '</tbody></table>';
    el.innerHTML = html;

    // 綁定點擊（循環切換狀態）
    el.querySelectorAll('.shift-cell').forEach(cell => {
      cell.onclick = () => _cycleShift(cell.dataset.person, cell.dataset.date);
    });
  }

  async function _cycleShift(personId, dateStr) {
    const current = MockData.getShift(personId, dateStr);
    const currentStatus = current ? current.status : '上班';
    const idx = SHIFT_CYCLE.indexOf(currentStatus);
    const next = SHIFT_CYCLE[(idx + 1) % SHIFT_CYCLE.length];
    const overtime = next === '加班' ? { start: '19:00', end: '21:00' } : null;

    try {
      // ⭐ 寫到 DB
      await DataWriter.setShift(personId, dateStr, next, overtime);
      MockData.setShift(personId, dateStr, next, overtime);
      _renderShiftCalendar();
    } catch (err) {
      console.error('[people-page] setShift failed:', err);
      alert('儲存到 DB 失敗：' + err.message);
    }
  }

  function _shiftMonth(delta) {
    const [y, m] = _currentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    _currentMonth = d.toISOString().slice(0, 7);
    document.getElementById('month-picker').value = _currentMonth;
    _renderShiftCalendar();
  }

  function _showPersonForm(editId) {
    const SKILL_OPTIONS = ['丈量', '施作'];
    const p = editId
      ? MockData.PEOPLE.find(x => x.id === editId)
      : { id: '', name: '', skills: [], vehicleId: '' };
    const isEdit = !!editId;

    const exist = document.getElementById('person-form-overlay');
    if (exist) exist.remove();

    const overlay = document.createElement('div');
    overlay.id = 'person-form-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="padding:24px; max-width:480px;">
        <h3 style="font-size:var(--fs-lg); font-weight:700; margin-bottom:16px;">${isEdit ? '編輯' : '新增'}人員</h3>
        <form id="person-form" style="display:flex; flex-direction:column; gap:14px;">
          <div>
            <label class="form-label">代號 *</label>
            <input name="id" required value="${p.id}" ${isEdit ? 'readonly' : ''} class="form-input" />
          </div>
          <div>
            <label class="form-label">姓名 *</label>
            <input name="name" required value="${p.name}" placeholder="例：王師傅" class="form-input" />
          </div>
          <div>
            <label class="form-label">技能（複選）</label>
            <div style="display:flex; gap:14px; padding:6px 0;">
              ${SKILL_OPTIONS.map(s => `
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" name="skills" value="${s}" ${p.skills.includes(s) ? 'checked' : ''} />
                  <span>${s}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div>
            <label class="form-label">所屬車輛</label>
            <select name="vehicleId" class="form-input">
              <option value="">未綁定</option>
              ${MockData.VEHICLES.map(v => `<option value="${v.id}" ${v.id===p.vehicleId?'selected':''}>${v.name}（${v.type}）</option>`).join('')}
            </select>
          </div>
          <div style="display:flex; justify-content:space-between; padding-top:12px; border-top:1px solid var(--c-border);">
            <button type="button" id="cancel-form" class="btn-secondary">取消</button>
            <button type="submit" class="btn-primary">儲存</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#cancel-form').onclick = () => overlay.remove();
    overlay.querySelector('#person-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {
        id: fd.get('id'),
        name: fd.get('name'),
        skills: fd.getAll('skills'),
        vehicleId: fd.get('vehicleId') || null,
      };

      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = '儲存中...';

      try {
        if (isEdit) {
          // ⭐ 寫 name/skills 到 DB（vehicleId 變動只改前端）
          await DataWriter.updateTechnician(data.id, { name: data.name, skills: data.skills });
          Object.assign(p, data);
        } else {
          if (MockData.PEOPLE.find(x => x.id === data.id)) {
            alert('代號重複');
            submitBtn.disabled = false;
            submitBtn.innerText = '儲存';
            return;
          }
          // ⭐ 寫到 DB
          const dbId = await DataWriter.createTechnician(data);
          data._dbId = dbId;
          MockData.PEOPLE.push(data);
        }
        overlay.remove();
        Router.navigate('people');
      } catch (err) {
        console.error('[people-page] save person failed:', err);
        alert('儲存到 DB 失敗：' + err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = '儲存';
      }
    };
  }

  async function _deletePerson(id) {
    if (!confirm(`確定刪除 ${id}？`)) return;

    // ⭐ Optimistic UI
    const idx = MockData.PEOPLE.findIndex(p => p.id === id);
    if (idx < 0) return;
    const removed = MockData.PEOPLE.splice(idx, 1)[0];
    Router.navigate('people');

    try {
      await DataWriter.deleteTechnician(id);
    } catch (err) {
      console.error('[people-page] delete person failed, rolling back:', err);
      MockData.PEOPLE.splice(idx, 0, removed);
      Router.navigate('people');
      alert('刪除失敗（已復原）：' + err.message);
    }
  }

  return { render };
})();
