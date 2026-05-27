/**
 * components/settings-modal.js
 * 設定中心 Modal - 主框架（tabs）
 *
 * 子元件：
 *  - VehicleSettings: 車輛 CRUD
 *  - PersonSettings: 人員 CRUD
 *  - DefaultsSettings: 預設值
 */

const SettingsModal = (() => {

  const MODAL_ID = 'settings-modal';
  let _activeTab = 'vehicles';

  function open() {
    _ensureModal();
    document.getElementById(MODAL_ID).style.display = 'flex';
    _switchTab(_activeTab);
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (el) el.style.display = 'none';
    // 觸發外部重渲染（資料可能變動）
    TimelineComponent.render();
  }

  function _switchTab(tabName) {
    _activeTab = tabName;
    document.querySelectorAll('.settings-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabName);
    });
    const body = document.getElementById('settings-body');
    if (tabName === 'vehicles') VehicleSettings.render(body);
    else if (tabName === 'people') PersonSettings.render(body);
    else if (tabName === 'defaults') DefaultsSettings.render(body);
  }

  function _ensureModal() {
    if (document.getElementById(MODAL_ID)) return;
    const root = document.getElementById('modal-root');
    const div = document.createElement('div');
    div.id = MODAL_ID;
    div.className = 'modal-overlay';
    div.style.display = 'none';
    div.innerHTML = `
      <div class="modal-content" style="max-width: 800px; padding:0; overflow:hidden">
        <div class="flex justify-between items-center px-6 py-4 border-b">
          <h2 class="text-xl font-bold">⚙️ 設定中心</h2>
          <button class="close-btn text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div class="flex border-b bg-gray-50">
          <button class="settings-tab" data-tab="vehicles">🚐 車輛管理</button>
          <button class="settings-tab" data-tab="people">👤 人員管理</button>
          <button class="settings-tab" data-tab="defaults">⚙️ 預設值</button>
        </div>
        <div id="settings-body" style="max-height:60vh; overflow-y:auto"></div>
      </div>
    `;
    root.appendChild(div);
    div.querySelectorAll('.close-btn').forEach(b => b.onclick = close);
    div.querySelectorAll('.settings-tab').forEach(t => {
      t.onclick = () => _switchTab(t.dataset.tab);
    });
  }

  return { open, close };
})();
