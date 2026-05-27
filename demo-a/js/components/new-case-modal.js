/**
 * components/new-case-modal.js
 * 「新增案件」表單 Modal 元件
 */

const NewCaseModalComponent = (() => {

  const MODAL_ID = 'new-case-modal';

  function open() {
    _ensureModal();
    document.getElementById('new-case-form').reset();
    document.getElementById(MODAL_ID).style.display = 'flex';
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (el) el.style.display = 'none';
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
          <h2 class="text-xl font-bold">新增案件</h2>
          <button class="close-btn text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form id="new-case-form" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">案件類型 *</label>
              <select name="type" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="現場丈量">現場丈量（1人，60min）</option>
                <option value="線上丈量">線上丈量（不出車）</option>
                <option value="施作">施作（2人，90min）</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">預估時長（分鐘） *</label>
              <input type="number" name="duration" required value="60" step="15" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">客戶姓名 *</label>
              <input type="text" name="customer" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="王小姐" />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">電話</label>
              <input type="text" name="phone" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="0912-345-678" />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">服務地址 *</label>
            <select name="address" required class="w-full border border-gray-300 rounded px-3 py-2 text-sm" id="address-select">
              <option value="">-- 選擇示範地址 --</option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">案件金額（NT$）</label>
            <input type="number" name="amount" value="20000" step="1000" class="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">特殊條件（影響時長）</label>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <label class="flex items-center gap-2"><input type="checkbox" name="special" value="加壓條" /> 加壓條 (+15min)</label>
              <label class="flex items-center gap-2"><input type="checkbox" name="special" value="鋁條" /> 鋁條 (+10min)</label>
              <label class="flex items-center gap-2"><input type="checkbox" name="special" value="陽台" /> 陽台 (+20min)</label>
              <label class="flex items-center gap-2"><input type="checkbox" name="special" value="舊條難拆" /> 舊條難拆 (+30min)</label>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">備註</label>
            <textarea name="notes" rows="2" class="w-full border border-gray-300 rounded px-3 py-2 text-sm"></textarea>
          </div>
          <div class="flex justify-between pt-4 border-t">
            <button type="button" class="close-btn px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">取消</button>
            <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">計算建議插入位置</button>
          </div>
        </form>
      </div>
    `;
    root.appendChild(div);

    // 填充地址下拉
    const addrSel = div.querySelector('#address-select');
    MockData.SAMPLE_ADDRESSES.forEach(a => {
      const o = document.createElement('option');
      o.value = a.addr;
      o.textContent = a.addr;
      addrSel.appendChild(o);
    });

    // 關閉按鈕
    div.querySelectorAll('.close-btn').forEach(b => b.onclick = close);

    // 提交
    div.querySelector('#new-case-form').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const addr = MockData.SAMPLE_ADDRESSES.find(a => a.addr === fd.get('address'));
      // 從 State 取「上次的草稿」帶 locationCode（_accept 後返回修改的情境）
      const draft = State.get('lastNewCaseDraft') || {};
      const newCase = {
        type: fd.get('type'),
        duration: parseInt(fd.get('duration')),
        customer: fd.get('customer'),
        phone: fd.get('phone'),
        address: fd.get('address'),
        lat: addr ? addr.lat : 0,
        lng: addr ? addr.lng : 0,
        amount: parseInt(fd.get('amount')) || 0,
        notes: fd.get('notes'),
        locationCode: draft.locationCode,   // ← 補上分區（從上次草稿）
      };
      close();
      SuggestionsModalComponent.show(newCase);
    };
  }

  return { open, close };
})();
