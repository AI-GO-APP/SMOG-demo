/**
 * config.js
 * 環境設定 — 對外公開（瀏覽器端 JS 沒有真正的 env）
 *
 * 切換不同環境（dev / staging / prod）時改這裡
 */

window.SMOG_CONFIG = {
  // Supabase 連線
  SUPABASE_URL:  'https://pnnydzixdvlfwcdoegjy.supabase.co',
  SUPABASE_KEY:  'sb_publishable__9KCocjPJOcfpMV2KWfl0g_PaRJlu7c',  // publishable 設計為對外公開

  // 環境標示
  ENV: 'staging',
};
