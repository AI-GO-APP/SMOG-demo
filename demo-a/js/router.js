/**
 * router.js
 * 簡易頁面切換器 - 不靠 hash/history，純 state 切換
 *
 * 用法：
 *   Router.register('schedule', SchedulePage.render);
 *   Router.navigate('schedule');
 */

const Router = (() => {

  const _pages = {};
  const _onChangeListeners = [];

  function register(name, renderFn, opts = {}) {
    _pages[name] = { render: renderFn, ...opts };
  }

  function navigate(name) {
    if (!_pages[name]) {
      console.warn('[Router] Unknown page:', name);
      return;
    }
    State.set('currentPage', name);
    try {
      _render();
    } catch (err) {
      console.error('[Router] render error:', err);
    }
    // 不管 render 成功或失敗，listeners 都要跑（讓 sidebar 保持同步）
    _onChangeListeners.forEach(fn => fn(name));
  }

  function getCurrent() {
    return State.get('currentPage');
  }

  function getPageMeta(name) {
    return _pages[name] || null;
  }

  function onChange(fn) {
    _onChangeListeners.push(fn);
  }

  function _render() {
    const current = getCurrent();
    const container = document.getElementById('page-content');
    if (!container) return;

    const page = _pages[current];
    if (!page) {
      container.innerHTML = '<div class="page-stub"><div class="page-stub-icon">❓</div><div class="page-stub-title">頁面未定義</div></div>';
      return;
    }

    container.innerHTML = ''; // 清空
    page.render(container);
  }

  return { register, navigate, getCurrent, getPageMeta, onChange };
})();
