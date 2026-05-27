/**
 * state.js
 * 全域狀態管理（簡單版，不用引入 Redux/Zustand）
 *
 * 真實開發時建議改用 Zustand 或 React Context
 */

const State = (() => {

  // 私有狀態
  let _state = {
    currentPage: 'schedule',
    currentLocations: ['taoyuan','taichung','tainan','kaohsiung'],  // 多選分區陣列（預設全選）
    currentLocation: 'taoyuan',  // [Deprecated] 保留向下相容
    currentDate: Utils.todayStr(),
    selectedCaseId: null,
    lastNewCaseDraft: null,
    lastSuggestions: [],
    weights: { distance: 0.6, gap: 0.3, amount: 0.1 },
    timeRange: { start: 9 * 60, end: 19 * 60, step: 30 },  // 09:00-19:00, 30 分鐘格
  };

  // 訂閱者
  const _subscribers = [];

  function get(key) {
    return key ? _state[key] : { ..._state };
  }

  function set(key, value) {
    _state[key] = value;
    _notify(key);
  }

  function update(patch) {
    Object.assign(_state, patch);
    _notify(Object.keys(patch));
  }

  function subscribe(fn) {
    _subscribers.push(fn);
    return () => {
      const idx = _subscribers.indexOf(fn);
      if (idx >= 0) _subscribers.splice(idx, 1);
    };
  }

  function _notify(keys) {
    _subscribers.forEach(fn => fn(keys, _state));
  }

  return { get, set, update, subscribe };
})();
