/**
 * pages/settings-page.js
 * 設定頁 - 預設值設定
 */

const SettingsPage = (() => {

  function render(container) {
    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <h1 style="font-size:var(--fs-xl); font-weight:700;">⚙️ 系統設定</h1>
          <p style="font-size:var(--fs-sm); color:var(--c-text-mute); margin-top:4px;">案件預設時長、工作時間、排程權重</p>
        </div>
        <div class="page-body">
          <div style="background:white; border:1px solid var(--c-border); border-radius:12px;" id="settings-page-body"></div>
        </div>
      </div>
    `;
    DefaultsSettings.render(document.getElementById('settings-page-body'));
  }

  return { render };
})();
