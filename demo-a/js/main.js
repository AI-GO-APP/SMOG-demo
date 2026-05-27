/**
 * main.js
 * v0.4 入口：先從 Supabase 載入資料 → 渲染 UI
 */

(function init() {

  document.addEventListener('DOMContentLoaded', async () => {

    // 0. 顯示 loading
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
      <div style="padding:60px; text-align:center; color:#666;">
        <div class="loader" style="margin:0 auto 16px; width:32px; height:32px; border-width:4px;"></div>
        <p>從 Supabase 載入資料中...</p>
      </div>
    `;

    // 1. 從 DB 載入資料（會把 DB 資料寫進 MockData 同名變數）
    try {
      await DataLoader.loadAll();
    } catch (err) {
      console.error('[main] 資料載入失敗:', err);
      pageContent.innerHTML = `
        <div style="padding:40px; color:#B91C1C; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:8px; margin:24px;">
          <h2 style="font-size:20px; margin-bottom:12px;">❌ 資料載入失敗</h2>
          <p style="margin-bottom:8px;">錯誤訊息：<code>${err.message}</code></p>
          <p style="margin-bottom:8px;">請打開瀏覽器 Console (F12) 查看詳細訊息</p>
          <p style="margin-top:16px; font-size:14px; color:#666;">
            常見原因：<br>
            1. Supabase URL 或 anon key 不對<br>
            2. 04-demo-data.sql 沒跑（DB 沒資料）<br>
            3. RLS 設定造成 anon 沒權限<br>
            4. 網路連線問題
          </p>
        </div>
      `;
      return;
    }

    // 2. 註冊頁面（router）
    Router.register('schedule',    SchedulePage.render);
    Router.register('vehicles',    VehiclesPage.render);
    Router.register('people',      PeoplePage.render);
    Router.register('vehicle-team',VehicleTeamPage.render);
    Router.register('unscheduled', UnscheduledPage.render);
    Router.register('kanban',      KanbanPage.render);
    Router.register('dashboard',   DashboardPage.render);
    Router.register('settings',    SettingsPage.render);

    // 3. 路由變更時：更新側邊欄 active 狀態 + 控制 topbar 顯示
    Router.onChange((pageId) => {
      Sidebar.syncActive();
      _updateActionButtons(pageId);
    });

    // 4. 渲染側邊欄
    Sidebar.render();

    // 5. 全域按鈕（Top Bar 的新增）
    // 注意：拿掉「+ 新增案件」— 所有案件都從「+ 新增諮詢」開始
    document.getElementById('new-inquiry-btn').onclick = () => NewInquiryModal.open();

    // 6. 初始導航到「排程」
    Router.navigate('schedule');
  });

  /** 根據當前頁面顯示/隱藏 Top Bar
   *  按鈕隱藏時，整個 topbar 也一起隱藏（每個頁面已有自己的 header）
   */
  function _updateActionButtons(pageId) {
    const HIDE_ON = ['vehicles', 'people', 'settings', 'dashboard', 'unscheduled'];
    const shouldHide = HIDE_ON.includes(pageId);

    const topbar = document.getElementById('main-topbar');
    if (topbar) topbar.style.display = shouldHide ? 'none' : 'flex';
  }

})();
