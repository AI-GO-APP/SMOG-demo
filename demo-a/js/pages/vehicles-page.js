/**
 * pages/vehicles-page.js
 * 車輛管理頁 - CRUD + 當月排班統計
 */

const VehiclesPage = (() => {

  /** 取得目前多選 location 過濾後的 vehicles */
  function _filteredByLocation() {
    return MockData.VEHICLES.filter(v => LocationFilter.isInFilter(v.locationCode));
  }


  function _sortByCodeNumber(a, b) {
    const numA = parseInt((a.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    const numB = parseInt((b.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    return numA - numB;
  }

  function render(container) {
    const yyyymm = new Date().toISOString().slice(0, 7);

    container.innerHTML = `
      <div class="page-container">
        <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h1 style="font-size:var(--fs-xl); font-weight:700;">🚐 車輛管理</h1>
            <p style="font-size:var(--fs-sm); color:var(--c-text-mute); margin-top:4px;">總共 ${_filteredByLocation().length} 台車 · ${yyyymm} 月統計</p>
          </div>
          <button class="btn-primary" id="add-vehicle-btn">+ 新增車輛</button>
        </div>

        <div class="page-body">
          ${LocationFilter.render()}
          <!-- 車輛卡片 -->
          <div class="vehicles-grid" id="vehicles-grid"></div>

          <!-- 詳細表格 -->
          <div style="margin-top:32px; background:white; border:1px solid var(--c-border); border-radius:12px; padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h2 style="font-size:var(--fs-md); font-weight:600;">完整清單</h2>
              <button class="btn-secondary" id="add-vehicle-bottom-btn">+ 新增車輛</button>
            </div>
            <div id="vehicles-table-container"></div>
          </div>
        </div>
      </div>
    `;

    container.querySelector('#add-vehicle-btn').onclick = () => _showForm();

    // 綁定 LocationFilter
    LocationFilter.bind(container, () => render(container));
    container.querySelector('#add-vehicle-bottom-btn').onclick = () => _showForm();
    _renderCards(yyyymm);
    _renderTable(container.querySelector('#vehicles-table-container'));
  }

  function _renderCards(yyyymm) {
    const grid = document.getElementById('vehicles-grid');
    grid.innerHTML = '';

    MockData.VEHICLES.slice().sort(_sortByCodeNumber).forEach(v => {
      const stats = MockData.getVehicleStats(v.id, yyyymm);
      const members = MockData.getVehicleMembers(v.id);

      const card = document.createElement('div');
      card.className = 'vehicle-summary-card';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="width:14px; height:14px; border-radius:50%; background:${v.color}; flex-shrink:0;"></span>
            <div>
              <div style="font-size:var(--fs-md); font-weight:700;">${v.name}</div>
              <div style="font-size:var(--fs-xs); color:var(--c-text-mute);">
                ${members.map(m => m.name).join(' / ') || '無人員'}
              </div>
            </div>
          </div>
          <span class="status-badge vehicle-tag-${v.type}">${v.type}</span>
        </div>

        <div class="vehicle-stats-grid">
          <div class="stat-block">
            <div class="stat-num">${stats.total}</div>
            <div class="stat-label">當月案件</div>
          </div>
          <div class="stat-block">
            <div class="stat-num">${stats.丈量}</div>
            <div class="stat-label">丈量</div>
          </div>
          <div class="stat-block">
            <div class="stat-num">${stats.施作}</div>
            <div class="stat-label">施作</div>
          </div>
          <div class="stat-block">
            <div class="stat-num">${stats.已完工}</div>
            <div class="stat-label">已完工</div>
          </div>
        </div>

        <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--c-border-soft); font-size:var(--fs-sm); color:var(--c-text-mute);">
          當月營收 <span style="color:var(--smog-primary); font-weight:700; font-size:var(--fs-md);">NT$ ${stats.營收.toLocaleString()}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function _renderTable(el) {
    el.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>編號</th><th>名稱</th><th>類型</th><th>師傅</th><th>顏色</th><th style="text-align:right">操作</th>
          </tr>
        </thead>
        <tbody>
          ${_filteredByLocation().slice().sort(_sortByCodeNumber).map(v => {
            const members = MockData.getVehicleMembers(v.id);
            return `
              <tr>
                <td style="font-family:monospace;">${v.id}</td>
                <td style="font-weight:600;">${v.name}</td>
                <td><span class="status-badge vehicle-tag-${v.type}">${v.type}</span></td>
                <td>${members.map(m => m.name).join(', ') || '-'}</td>
                <td><span style="display:inline-block; width:20px; height:20px; border-radius:50%; background:${v.color}; vertical-align:middle;"></span></td>
                <td style="text-align:right;">
                  <button class="link-btn" data-edit="${v.id}">編輯</button>
                  <button class="link-btn link-danger" data-del="${v.id}">刪除</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => _showForm(b.dataset.edit));
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => _delete(b.dataset.del));
  }

  function _showForm(editId) {
    // 用既有的 VehicleSettings 表單邏輯（複用之前寫好的）
    // VehicleSettings 在 settings 中有完整 form，這裡直接呼叫類似的邏輯
    const VEHICLE_TYPES = ['丈量', '施作', '兩用'];
    const COLOR_OPTIONS = [
      '#0284C7', '#2563EB', '#059669', '#D97706', '#7C3AED',
      '#EC4899', '#0891B2', '#65A30D'
    ];
    const v = editId
      ? MockData.VEHICLES.find(x => x.id === editId)
      : { id: '', name: '', type: '兩用', color: COLOR_OPTIONS[0] };
    const isEdit = !!editId;

    const exist = document.getElementById('vehicle-form-overlay');
    if (exist) exist.remove();

    const overlay = document.createElement('div');
    overlay.id = 'vehicle-form-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content" style="padding:24px; max-width:480px;">
        <h3 style="font-size:var(--fs-lg); font-weight:700; margin-bottom:16px;">${isEdit ? '編輯' : '新增'}車輛</h3>
        <form id="vehicle-form" style="display:flex; flex-direction:column; gap:14px;">
          <div>
            <label class="form-label">編號 *</label>
            <input name="id" required value="${v.id}" ${isEdit ? 'readonly' : ''} class="form-input" />
          </div>
          <div>
            <label class="form-label">名稱 *</label>
            <input name="name" required value="${v.name}" placeholder="例：車1、配送1號" class="form-input" />
          </div>
          <div>
            <label class="form-label">類型 *</label>
            <select name="type" class="form-input">
              ${VEHICLE_TYPES.map(t => `<option value="${t}" ${t===v.type?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="form-label">地圖路線顏色</label>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px;">
              ${COLOR_OPTIONS.map(c => `
                <label style="cursor:pointer;">
                  <input type="radio" name="color" value="${c}" ${c===v.color?'checked':''} style="display:none;" />
                  <span style="display:inline-block; width:32px; height:32px; border-radius:50%; background:${c}; border:3px solid ${c===v.color ? '#0F172A' : 'transparent'}; box-shadow:${c===v.color ? '0 0 0 2px white inset' : 'none'}; transition:all 0.15s;"></span>
                </label>
              `).join('')}
            </div>
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

    // 顏色選擇視覺回饋
    function _refreshColorSelection() {
      overlay.querySelectorAll('input[name="color"]').forEach(inp => {
        const span = inp.nextElementSibling;
        if (!span) return;
        span.style.border = inp.checked ? '3px solid #0F172A' : '3px solid transparent';
        span.style.boxShadow = inp.checked ? '0 0 0 2px white inset' : 'none';
      });
    }
    overlay.querySelectorAll('input[name="color"]').forEach(inp => {
      inp.addEventListener('change', _refreshColorSelection);
    });
    _refreshColorSelection();

    overlay.querySelector('#vehicle-form').onsubmit = async (e) => {
      e.preventDefault();
      console.log('[VehiclesPage] 🟢 onsubmit triggered');
      const fd = new FormData(e.target);
      const data = { id: fd.get('id'), name: fd.get('name'), type: fd.get('type'), color: fd.get('color') };
      console.log('[VehiclesPage] form data =', data);

      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = '儲存中...';

      try {
        if (isEdit) {
          // ⭐ 寫到 DB
          await DataWriter.updateVehicle(data.id, { name: data.name, type: data.type, color: data.color });
          Object.assign(v, data);
        } else {
          if (MockData.VEHICLES.find(x => x.id === data.id)) {
            alert('編號重複');
            submitBtn.disabled = false;
            submitBtn.innerText = '儲存';
            return;
          }
          // ⭐ 寫到 DB
          const dbId = await DataWriter.createVehicle(data);
          data._dbId = dbId;
          MockData.VEHICLES.push(data);
        }
        overlay.remove();
        Router.navigate('vehicles');
      } catch (err) {
        console.error('[VehiclesPage] save failed:', err);
        alert('儲存到 DB 失敗：' + err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = '儲存';
      }
    };
  }

  async function _delete(id) {
    if (!confirm(`確定刪除 ${id}？該車的人員會解除綁定，已排班案件不會被刪除。`)) return;

    // ⭐ Optimistic UI：先從畫面拿掉
    const idx = MockData.VEHICLES.findIndex(v => v.id === id);
    if (idx < 0) return;
    const removed = MockData.VEHICLES.splice(idx, 1)[0];
    const affected = MockData.PEOPLE.filter(p => p.vehicleId === id);
    const oldVehicleIds = affected.map(p => p.vehicleId);
    affected.forEach(p => p.vehicleId = null);
    Router.navigate('vehicles');  // 立刻重新渲染

    // 背景寫 DB
    try {
      await DataWriter.deleteVehicle(id);
    } catch (err) {
      console.error('[VehiclesPage] delete failed, rolling back:', err);
      // 復原
      MockData.VEHICLES.splice(idx, 0, removed);
      affected.forEach((p, i) => p.vehicleId = oldVehicleIds[i]);
      Router.navigate('vehicles');
      alert('刪除失敗（已復原）：' + err.message);
    }
  }

  return { render };
})();
