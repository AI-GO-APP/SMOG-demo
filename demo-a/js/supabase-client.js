/**
 * supabase-client.js
 *
 * 連線 Supabase 的全域 client。
 * 在所有需要存取 DB 的地方都使用 window.SupabaseClient。
 *
 * 注意：Publishable key 是公開值（會在瀏覽器看到），
 * 安全靠 Supabase RLS 控制（目前 demo 階段 RLS disabled）。
 */

// 從 window.SMOG_CONFIG 讀（config.js 必須先載入）
const SUPABASE_URL = (window.SMOG_CONFIG && window.SMOG_CONFIG.SUPABASE_URL)
  || 'https://pnnydzixdvlfwcdoegjy.supabase.co';
const SUPABASE_KEY = (window.SMOG_CONFIG && window.SMOG_CONFIG.SUPABASE_KEY)
  || 'sb_publishable__9KCocjPJOcfpMV2KWfl0g_PaRJlu7c';

// 等 supabase JS CDN 載完後才能用 supabase.createClient
const SupabaseClient = (() => {
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    console.error('[Supabase] supabase-js CDN not loaded! 請檢查 index.html 的 <script> 順序');
    return null;
  }

  const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      // 不持久化 session（demo 階段不需要登入）
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log('[Supabase] Client initialized for', SUPABASE_URL);
  return client;
})();

window.SupabaseClient = SupabaseClient;
