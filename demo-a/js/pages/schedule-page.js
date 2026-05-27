/**
 * pages/schedule-page.js
 * 排程頁 - 包現有的時間軸 + 全車路線總覽
 */

const SchedulePage = (() => {

  function render(container) {
    container.innerHTML = `
      <div class="page-container">
        <div style="display:flex; flex-direction:column; height:100%">

          <!-- 頂部工具列：日期橫條 + 操作按鈕 + 權重 -->
          <div style="background:white; padding:10px 24px; border-bottom:1px solid var(--c-border-soft); display:flex; align-items:center; gap:12px;">
            <button id="today-btn" class="date-strip-today">今天</button>
            <div id="date-strip" class="date-strip"></div>
            <div id="schedule-loc-filter" style="margin-left:auto;">${LocationFilter.render()}</div>
            <input type="date" id="date-picker" class="form-input" style="width:140px; font-size:13px;" />
          </div>
          <!-- 圖例 -->
          <div style="background:white; padding:8px 24px; border-bottom:1px solid var(--c-border-soft); display:flex; gap:16px; font-size:11px; align-items:center;">
            <span style="color:var(--c-text-mute); font-weight:500;">圖例：</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span class="case-現場丈量" style="width:14px; height:14px; border-radius:3px; display:inline-block;"></span> 現場丈量</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span class="case-線上丈量" style="width:14px; height:14px; border-radius:3px; display:inline-block;"></span> 線上丈量</span>
            <span style="display:inline-flex; align-items:center; gap:4px;"><span class="case-施作" style="width:14px; height:14px; border-radius:3px; display:inline-block;"></span> 施作</span>
          </div>

          <!-- 時間軸 -->
          <div class="scrollable-x" style="flex-shrink:0; background:white;">
            <div class="timeline-grid" id="timeline-container"></div>
          </div>

          <!-- 全車路線總覽（永遠開啟）-->
          <section style="border-top:2px solid var(--c-border); background:white; flex:1; display:flex; flex-direction:column; min-height:0;">
            <div style="padding:14px 24px; border-bottom:1px solid var(--c-border-soft); display:flex; justify-content:space-between; align-items:center; gap:16px;">
              <div>
                <h2 style="font-weight:600; color:var(--c-text); font-size:var(--fs-md);">🗺️ 全車路線總覽</h2>
                <p style="font-size:var(--fs-xs); color:var(--c-text-mute);">拖曳時間軸卡片可改派車輛/時間，調整完點右側按鈕重算路線</p>
              </div>
              <button id="reload-routes-btn" class="btn-reload">🔄 重新計算路線</button>
            </div>

            <div id="overview-panel" style="display:flex; flex:1; flex-direction:column; min-height:0;">
              <div style="padding:14px 24px; border-bottom:1px solid var(--c-border-soft); background:var(--c-bg);">
                <div id="vehicle-toggles" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;"></div>
                <div id="swap-suggestions" style="background:#FFFBEB; border:1px solid #FCD34D; border-radius:10px; padding:12px;"></div>
              </div>
              <div style="flex:1; position:relative; min-height:500px;">
                <div id="overview-map" class="w-full h-full"></div>
                <div id="overview-loading" class="absolute top-4 right-4 bg-white shadow-lg rounded-full px-4 py-2 text-sm hidden z-[1000]">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <div class="loader"></div>
                    <span>正在計算所有路線...</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    `;

    // 渲染時間軸
    TimelineComponent.render();

    // 綁定日期切換
    _bindDateControls();

    // 綁定分區 filter（每次 render 重綁）
    LocationFilter.bind(container, () => render(container));
    // 綁定權重 slider
    _bindWeightSliders();
    // 初始化全車路線總覽
    AllVehiclesMap.init();

    // 綁定「重新計算路線」按鈕
    const reloadBtn = document.getElementById('reload-routes-btn');
    if (reloadBtn) {
      reloadBtn.onclick = () => {
        reloadBtn.disabled = true;
        reloadBtn.textContent = '⏳ 計算中...';
        AllVehiclesMap.reloadRoutes().finally(() => {
          reloadBtn.disabled = false;
        });
      };
    }
  }

  function _bindDateControls() {
    const dp = document.getElementById('date-picker');
    dp.value = State.get('currentDate');

    // 「今天」按鈕
    document.getElementById('today-btn').onclick = async () => {
      const newDate = Utils.todayStr();
      State.set('currentDate', newDate);
      dp.value = newDate;
      await _reloadAssignmentsForDate(newDate);
      TimelineComponent.render();
      _renderDateStrip();
    };

    // 渲染日期橫條
    _renderDateStrip();
    dp.onchange = async (e) => {
      State.set('currentDate', e.target.value);
      await _reloadAssignmentsForDate(e.target.value);
      TimelineComponent.render();
      _renderDateStrip();
    };

  }

  /** 切換日期時重新載入該天的 daily_assignments，更新 PEOPLE.vehicleId */
  async function _reloadAssignmentsForDate(dateStr) {
    if (typeof DataLoader === 'undefined' || !DataLoader.loadDailyAssignmentsForDate) return;
    try {
      await DataLoader.loadDailyAssignmentsForDate(dateStr);
    } catch (err) {
      console.error('[schedule-page] reload assignments failed:', err);
    }
  }

  /** 渲染日期橫條：今天 + 未來 6 天 + 過去 7 天，可滾動 */
  function _renderDateStrip() {
    const strip = document.getElementById('date-strip');
    if (!strip) return;

    const today = Utils.todayStr();
    const current = State.get('currentDate');
    const days = [];

    // 過去 3 天 ~ 未來 7 天（包含今天，共 11 天）
    for (let offset = -3; offset <= 7; offset++) {
      days.push(Utils.shiftDate(today, offset));
    }

    const dowMap = ['日','一','二','三','四','五','六'];

    strip.innerHTML = days.map(d => {
      const dt = new Date(d + 'T00:00:00');
      const mmdd = String(dt.getMonth() + 1).padStart(2, '0') + '/' + String(dt.getDate()).padStart(2, '0');
      const dow = dowMap[dt.getDay()];
      const isCurrent = d === current;
      const isToday = d === today;
      const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;

      return `
        <button class="date-strip-btn ${isCurrent ? 'active' : ''} ${isToday ? 'is-today' : ''} ${isWeekend ? 'is-weekend' : ''}" data-date="${d}">
          <div class="date-strip-mmdd">${mmdd}</div>
          <div class="date-strip-dow">${dow}</div>
        </button>
      `;
    }).join('');

    strip.querySelectorAll('[data-date]').forEach(b => {
      b.onclick = async () => {
        const d = b.dataset.date;
        State.set('currentDate', d);
        const dp = document.getElementById('date-picker');
        if (dp) dp.value = d;
        await _reloadAssignmentsForDate(d);
        TimelineComponent.render();
        _renderDateStrip();
      };
    });

    // scroll 到當前選中那格
    const activeEl = strip.querySelector('.date-strip-btn.active');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
    }
  }

  function _bindWeightSliders() {
    ['distance', 'gap', 'amount'].forEach(k => {
      const slider = document.getElementById(`w-${k}`);
      const valSpan = document.getElementById(`w-${k}-val`);
      // 從 State 還原當前值
      const w = State.get('weights');
      slider.value = Math.round(w[k] * 100);
      valSpan.textContent = slider.value + '%';

      slider.oninput = () => {
        valSpan.textContent = slider.value + '%';
        const cur = State.get('weights');
        cur[k] = parseInt(slider.value) / 100;
        State.set('weights', cur);
      };
    });
  }

  return { render };
})();
