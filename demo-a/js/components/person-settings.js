/**
 * components/person-settings.js
 * 人員 CRUD 子元件
 */

const PersonSettings = (() => {

  const SKILL_OPTIONS = ['丈量', '施作'];

  function _sortByCodeNumber(a, b) {
    const numA = parseInt((a.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    const numB = parseInt((b.id || '').replace(/[^0-9]/g, ''), 10) || 0;
    return numA - numB;
  }

  function render(container) {
    container.innerHTML = `
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h3 class="font-semibold text-base">人員清單</h3>
            <p class="text-xs text-gray-500">共 ${MockData.PEOPLE.length} 位</p>
          </div>
          <button id="add-person-btn" class="btn-primary">+ 新增人員</button>
        </div>
        <div id="person-table"></div>
      </div>
    `;
    container.querySelector('#add-person-btn').onclick = () => _showForm();
    _renderTable(container.querySelector('#person-table'));
  }

  function _renderTable(el) {
    el.innerHTML = `
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b text-xs text-gray-500">
          <tr>
            <th class="text-left py-2 px-3">編號</th>
            <th class="text-left py-2 px-3">姓名</th>
            <th class="text-left py-2 px-3">技能</th>
            <th class="text-left py-2 px-3">所屬車輛</th>
            <th class="text-right py-2 px-3">操作</th>
          </tr>
        </thead>
        <tbody>
          ${MockData.PEOPLE.slice().sort(_sortByCodeNumber).map(p => {
            const v = MockData.VEHICLES.find(x => x.id === p.vehicleId);
            return `
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 px-3 font-mono text-xs">${p.id}</td>
                <td class="py-2 px-3 font-medium">${p.name}</td>
                <td class="py-2 px-3 text-xs">${p.skills.map(s => `<span class="status-badge case-${s} mr-1">${s}</span>`).join('')}</td>
                <td class="py-2 px-3 text-xs">${v ? v.name : '<span class="text-gray-400">未綁定</span>'}</td>
                <td class="py-2 px-3 text-right">
                  <button class="text-blue-600 text-xs hover:underline mr-2" data-edit="${p.id}">編輯</button>
                  <button class="text-red-600 text-xs hover:underline" data-del="${p.id}">刪除</button>
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
    const p = editId ? MockData.PEOPLE.find(x => x.id === editId) : { id: '', name: '', skills: [], vehicleId: '' };
    const isEdit = !!editId;

    const formId = 'person-form-overlay';
    const exist = document.getElementById(formId);
    if (exist) exist.remove();

    const overlay = document.createElement('div');
    overlay.id = formId;
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '60';
    overlay.innerHTML = `
      <div class="modal-content p-6" style="max-width: 480px">
        <h3 class="text-lg font-bold mb-4">${isEdit ? '編輯' : '新增'}人員</h3>
        <form id="person-form" class="space-y-3">
          <div>
            <label class="text-xs text-gray-600">編號 *（建議 P1, P2...）</label>
            <input name="id" required value="${p.id}" ${isEdit ? 'readonly' : ''} class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-600">姓名 *</label>
            <input name="name" required value="${p.name}" placeholder="例：王師傅" class="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-600">技能（複選）</label>
            <div class="flex gap-3">
              ${SKILL_OPTIONS.map(s => `
                <label class="flex items-center gap-1">
                  <input type="checkbox" name="skills" value="${s}" ${p.skills.includes(s) ? 'checked' : ''} />
                  <span>${s}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div>
            <label class="text-xs text-gray-600">所屬車輛</label>
            <select name="vehicleId" class="w-full border rounded px-3 py-2 text-sm">
              <option value="">未綁定</option>
              ${MockData.VEHICLES.map(v => `<option value="${v.id}" ${v.id===p.vehicleId?'selected':''}>${v.name}（${v.type}）</option>`).join('')}
            </select>
          </div>
          <div class="flex justify-between pt-3 border-t">
            <button type="button" id="cancel-form" class="px-3 py-1.5 border rounded text-sm">取消</button>
            <button type="submit" class="px-4 py-1.5 bg-blue-600 text-white rounded text-sm">儲存</button>
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
          // ⭐ 寫 name/skills 到 DB（vehicleId 變動暫時只改前端，daily_assignments 之後做）
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
        render(document.getElementById('settings-body'));
      } catch (err) {
        console.error('[person-settings] save failed:', err);
        alert('儲存到 DB 失敗：' + err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = '儲存';
      }
    };
  }

  async function _delete(id) {
    if (!confirm(`確定刪除 ${id}？`)) return;

    // ⭐ Optimistic UI
    const idx = MockData.PEOPLE.findIndex(p => p.id === id);
    if (idx < 0) return;
    const removed = MockData.PEOPLE.splice(idx, 1)[0];
    render(document.getElementById('settings-body'));

    try {
      await DataWriter.deleteTechnician(id);
    } catch (err) {
      console.error('[person-settings] delete failed, rolling back:', err);
      MockData.PEOPLE.splice(idx, 0, removed);
      render(document.getElementById('settings-body'));
      alert('刪除失敗（已復原）：' + err.message);
    }
  }

  return { render };
})();
