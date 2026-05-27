/**
 * components/vehicle-settings.js
 * 車輛 CRUD 子元件
 */

const VehicleSettings = (() => {

  const VEHICLE_TYPES = ['丈量', '施作', '兩用'];

  function _sortByCodeNumber(a, b) {
    const numA = parseInt((a.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    const numB = parseInt((b.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    return numA - numB;
  }
  const COLOR_OPTIONS = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
  ];

  function render(container) {
    container.innerHTML = `
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="font-semibold text-base">車輛清單</h3>
            <p class="text-xs text-gray-500">共 ${MockData.VEHICLES.length} 台</p>
          </div>
          <button id="add-vehicle-btn" class="btn-primary">+ 新增車輛</button>
        </div>
        <div id="vehicle-table"></div>
      </div>
    `;
    container.querySelector('#add-vehicle-btn').onclick = () => _showForm();
    _renderTable(container.querySelector('#vehicle-table'));
  }

  function _renderTable(el) {
    el.innerHTML = `
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b text-xs text-gray-500">
          <tr>
            <th class="text-left py-2 px-3">編號</th>
            <th class="text-left py-2 px-3">名稱</th>
            <th class="text-left py-2 px-3">類型</th>
            <th class="text-left py-2 px-3">人員</th>
            <th class="text-left py-2 px-3">顏色</th>
            <th class="text-right py-2 px-3">操作</th>
          </tr>
        </thead>
        <tbody>
          ${MockData.VEHICLES.slice().sort(_sortByCodeNumber).map(v => {
            const members = MockData.getVehicleMembers(v.id);
            return `
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 px-3 font-mono text-xs">${v.id}</td>
                <td class="py-2 px-3 font-medium">${v.name}</td>
                <td class="py-2 px-3"><span class="status-badge vehicle-tag-${v.type}">${v.type}</span></td>
                <td class="py-2 px-3 text-xs">${members.map(m => m.name).join(', ') || '-'}</td>
                <td class="py-2 px-3"><span class="vehicle-color-dot" style="background:${v.color}"></span></td>
                <td class="py-2 px-3 text-right">
                  <button class="text-blue-600 text-xs hover:underline mr-2" data-edit="${v.id}">編輯</button>
                  <button class="text-red-600 text-xs hover:underline" data-del="${v.id}">刪除</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    el.querySelectorAll('[data-edit]').forEach(b => {
      b.onclick = () => _showForm(b.dataset.edit);
    });
    el.querySelectorAll('[data-del]').forEach(b => {
      b.onclick = () => _delete(b.dataset.del);
    });
  }

  function _showForm(editId) {
    const v = editId ? MockData.VEHICLES.find(x => x.id === editId) : { id: '', name: '', type: '兩用', color: COLOR_OPTIONS[0] };
    const isEdit = !!editId;

    const formId = 'vehicle-form-overlay';
    const exist = document.getElementById(formId);
    if (exist) exist.remove();

    const overlay = document.createElement('div');
    overlay.id = formId;
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '60';
    overlay.innerHTML = `
      <div class="modal-content p-6" style="max-width: 480px">
        <h3 class="text-lg font-bold mb-4">${isEdit ? '編輯' : '新增'}車輛</h3>
        <form id="vehicle-form" class="space-y-3">
          <div>
            <label class="text-xs text-gray-600">編號 *（建議 V1, V2...）</label>
            <input name="id" required value="${v.id}" ${isEdit ? 'readonly' : ''} class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-600">名稱 *</label>
            <input name="name" required value="${v.name}" placeholder="例：車1、配送1號" class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-600">類型 *</label>
            <select name="type" class="w-full border rounded px-3 py-2 text-sm">
              ${VEHICLE_TYPES.map(t => `<option value="${t}" ${t===v.type?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs text-gray-600">顏色（用於地圖）</label>
            <div class="flex gap-3 flex-wrap" id="color-picker-row">
              ${COLOR_OPTIONS.map(c => `
                <label class="cursor-pointer color-swatch-label" data-color="${c}">
                  <input type="radio" name="color" value="${c}" ${c===v.color?'checked':''} style="display:none;" />
                  <span class="color-swatch" style="display:inline-block; width:32px; height:32px; border-radius:50%; background:${c}; border:3px solid ${c===v.color ? '#0F172A' : 'transparent'}; box-shadow:${c===v.color ? '0 0 0 2px white inset' : 'none'}; cursor:pointer; transition:all 0.15s;"></span>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="flex justify-between pt-3 border-t">
            <button type="button" id="cancel-form" class="px-3 py-1.5 border rounded text-sm">取消</button>
            <button type="submit" class="px-4 py-1.5 bg-blue-600 text-white rounded text-sm">儲存</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    // 顏色選擇視覺回饋
    overlay.querySelectorAll('input[name="color"]').forEach(inp => {
      inp.addEventListener('change', () => {
        overlay.querySelectorAll('.color-swatch').forEach(sw => {
          const isChecked = sw.parentElement.querySelector('input').checked;
          sw.style.border = isChecked ? '3px solid #0F172A' : '3px solid transparent';
          sw.style.boxShadow = isChecked ? '0 0 0 2px white inset' : 'none';
        });
      });
    });
    // 點 swatch 也能切換
    overlay.querySelectorAll('.color-swatch-label').forEach(lbl => {
      lbl.addEventListener('click', (e) => {
        const inp = lbl.querySelector('input');
        if (inp) {
          inp.checked = true;
          inp.dispatchEvent(new Event('change'));
        }
      });
    });

    overlay.querySelector('#cancel-form').onclick = () => overlay.remove();
    overlay.querySelector('#vehicle-form').onsubmit = async (e) => {
      e.preventDefault();
      console.log('[VS] 🟢 onsubmit triggered');
      const fd = new FormData(e.target);
      const data = { id: fd.get('id'), name: fd.get('name'), type: fd.get('type'), color: fd.get('color') };
      console.log('[VS] form data =', data);
      console.log('[VS] isEdit =', isEdit);

      const submitBtn = e.target.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = '儲存中...';

      try {
        if (isEdit) {
          console.log('[VS] calling updateVehicle...');
          await DataWriter.updateVehicle(data.id, { name: data.name, type: data.type, color: data.color });
          console.log('[VS] ✅ updateVehicle done');
          Object.assign(v, data);
        } else {
          if (MockData.VEHICLES.find(x => x.id === data.id)) {
            console.warn('[VS] code duplicate in MockData:', data.id);
            alert('代號重複');
            submitBtn.disabled = false;
            submitBtn.innerText = '儲存';
            return;
          }
          console.log('[VS] calling createVehicle...');
          const dbId = await DataWriter.createVehicle(data);
          console.log('[VS] ✅ createVehicle done, dbId =', dbId);
          data._dbId = dbId;
          MockData.VEHICLES.push(data);
          console.log('[VS] ✅ pushed to MockData. Total =', MockData.VEHICLES.length);
        }
        overlay.remove();
        render(document.getElementById('settings-body'));
        console.log('[VS] ✅ form closed + re-rendered');
      } catch (err) {
        console.error('[VS] ❌ save failed:', err);
        alert('儲存到 DB 失敗：' + err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = '儲存';
      }
    };
  }

  async function _delete(id) {
    if (!confirm(`確定刪除 ${id}？該車有排班的案件不會跟著刪除。`)) return;

    // ⭐ Optimistic UI
    const idx = MockData.VEHICLES.findIndex(v => v.id === id);
    if (idx < 0) return;
    const removed = MockData.VEHICLES.splice(idx, 1)[0];
    const affected = MockData.PEOPLE.filter(p => p.vehicleId === id);
    const oldVehicleIds = affected.map(p => p.vehicleId);
    affected.forEach(p => p.vehicleId = null);
    render(document.getElementById('settings-body'));

    try {
      await DataWriter.deleteVehicle(id);
    } catch (err) {
      console.error('[vehicle-settings] delete failed, rolling back:', err);
      MockData.VEHICLES.splice(idx, 0, removed);
      affected.forEach((p, i) => p.vehicleId = oldVehicleIds[i]);
      render(document.getElementById('settings-body'));
      alert('刪除失敗（已復原）：' + err.message);
    }
  }

  return { render };
})();
