/**
 * components/location-filter.js
 * 分區多選 filter（共用元件）
 *
 * 使用方式：
 *   const html = LocationFilter.render();
 *   container.innerHTML = `... ${html} ...`;
 *   LocationFilter.bind(container, () => {
 *     // 選擇改變時的 callback (重新 render 頁面)
 *   });
 *
 * 狀態：State.get('currentLocations') = ['taoyuan','taichung',...]
 */

const LocationFilter = (() => {

  function render() {
    const locs = MockData.LOCATIONS || [];
    const selected = State.get('currentLocations') || [];
    const allSelected = locs.length > 0 && locs.every(l => selected.includes(l.code));

    return `
      <div class="location-filter">
        <span class="location-filter-label">🏢 分區：</span>
        <button class="location-filter-btn ${allSelected ? 'active' : ''}" data-loc="__all__">全部</button>
        ${locs.map(l => `
          <button class="location-filter-btn ${selected.includes(l.code) ? 'active' : ''}"
                  data-loc="${l.code}">${l.name}</button>
        `).join('')}
      </div>
    `;
  }

  /**
   * 綁定 click 事件
   * @param {HTMLElement} container 包含 location-filter 的容器
   * @param {Function} onChange 選擇改變後的 callback
   */
  function bind(container, onChange) {
    const buttons = container.querySelectorAll('.location-filter-btn');
    const locs = MockData.LOCATIONS || [];

    buttons.forEach(btn => {
      btn.onclick = () => {
        const loc = btn.dataset.loc;
        let selected = State.get('currentLocations') || [];

        if (loc === '__all__') {
          // 「全部」按鈕：toggle all / none
          const allSelected = locs.every(l => selected.includes(l.code));
          selected = allSelected ? [] : locs.map(l => l.code);
        } else {
          // 個別分區：toggle
          if (selected.includes(loc)) {
            selected = selected.filter(x => x !== loc);
          } else {
            selected = [...selected, loc];
          }
        }

        State.set('currentLocations', selected);
        if (typeof onChange === 'function') onChange();
      };
    });
  }

  /**
   * 過濾 helper：判斷某筆資料的 locationCode 是否在當前選擇內
   */
  function isInFilter(locationCode) {
    const selected = State.get('currentLocations') || [];
    // 空陣列 = 沒選任何分區 → 都不顯示（讓用戶明白要選）
    if (selected.length === 0) return false;
    return selected.includes(locationCode);
  }

  return { render, bind, isInFilter };
})();

window.LocationFilter = LocationFilter;
