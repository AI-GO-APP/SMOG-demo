/**
 * components/sidebar.js
 * 側邊欄導航
 */

const Sidebar = (() => {

  const NAV_ITEMS = [
    { id: 'schedule',    icon: '📅', label: '排程',     section: 'main' },
    { id: 'unscheduled', icon: '📋', label: '未排案件', section: 'main', badgeKey: 'pending' },
    { id: 'vehicle-team',icon: '🤝', label: '人車搭配', section: 'main' },
    { id: 'people',      icon: '👤', label: '人員班表', section: 'main' },
    { id: 'vehicles',    icon: '🚐', label: '車輛',     section: 'main' },
    { id: 'kanban',      icon: '🗂️', label: '案件看板', section: 'main' },
    { id: 'dashboard',   icon: '📊', label: '儀表板',   section: 'main' },
    { id: 'settings',    icon: '⚙️', label: '設定',     section: 'system' },
  ];

  function render() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = `
      <div class="sidebar-logo">
        <div class="sidebar-logo-title">SMOG</div>
        <div class="sidebar-logo-sub">派工排班系統</div>
      </div>
      <nav class="sidebar-nav" id="sidebar-nav"></nav>
      <div class="sidebar-footer">v0.4 · Demo</div>
    `;
    _renderNavItems();
  }

  function _renderNavItems() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = '';

    // 主功能區
    const mainLabel = document.createElement('div');
    mainLabel.className = 'sidebar-section-label';
    mainLabel.textContent = '主要';
    nav.appendChild(mainLabel);

    NAV_ITEMS.filter(i => i.section === 'main').forEach(item => {
      nav.appendChild(_renderItem(item));
    });

    // 系統區
    const sysLabel = document.createElement('div');
    sysLabel.className = 'sidebar-section-label';
    sysLabel.style.marginTop = '16px';
    sysLabel.textContent = '系統';
    nav.appendChild(sysLabel);

    NAV_ITEMS.filter(i => i.section === 'system').forEach(item => {
      nav.appendChild(_renderItem(item));
    });
  }

  function _renderItem(item) {
    const btn = document.createElement('button');
    btn.className = 'sidebar-item';
    btn.dataset.pageId = item.id;
    if (Router.getCurrent() === item.id) btn.classList.add('active');

    const badge = item.badgeKey === 'pending'
      ? `<span class="sidebar-item-badge">${MockData.getPendingCases().length}</span>`
      : '';

    btn.innerHTML = `
      <span class="sidebar-item-icon">${item.icon}</span>
      <span>${item.label}</span>
      ${badge}
    `;
    btn.onclick = () => Router.navigate(item.id);
    return btn;
  }

  /** 切換 active state（router 變更時呼叫）*/
  function syncActive() {
    document.querySelectorAll('.sidebar-item[data-page-id]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.pageId === Router.getCurrent());
    });
  }

  /** 取得頁面 meta（給 topbar 顯示 title 用）*/
  function getPageMeta(pageId) {
    return NAV_ITEMS.find(i => i.id === pageId);
  }

  return { render, syncActive, getPageMeta };
})();
