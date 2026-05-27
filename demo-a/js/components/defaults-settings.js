/**
 * components/defaults-settings.js
 * 預設值設定（時長、工作時間、權重）
 */

const DefaultsSettings = (() => {

  function render(container) {
    const s = MockData.SETTINGS;
    const w = State.get('weights');
    container.innerHTML = `
      <div class="p-6 space-y-6">
        <section>
          <h3 class="font-semibold mb-3">⏱️ 各案件類型預設時長（分鐘）</h3>
          <div class="grid grid-cols-3 gap-3">
            ${Object.entries(s.defaultDuration).map(([type, val]) => `
              <div>
                <label class="text-xs text-gray-600 block mb-1">${type}</label>
                <input type="number" data-default="${type}" value="${val}" step="15" class="w-full border rounded px-3 py-2 text-sm" />
              </div>
            `).join('')}
          </div>
        </section>

        <section>
          <h3 class="font-semibold mb-3">🕗 工作時間範圍</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-gray-600 block mb-1">開始</label>
              <input type="time" id="work-start" value="${s.workTime.start}" class="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">結束</label>
              <input type="time" id="work-end" value="${s.workTime.end}" class="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        <section>
          <h3 class="font-semibold mb-3">⚖️ 排程建議引擎權重</h3>
          <p class="text-xs text-gray-500 mb-3">三項加總 100%。距離通常最重要，因為車輛跑遠成本高。</p>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between mb-1"><span class="text-sm">距離</span><span class="text-sm font-semibold" id="dw-distance">${Math.round(w.distance*100)}%</span></div>
              <input type="range" min="0" max="100" value="${Math.round(w.distance*100)}" id="weight-distance" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between mb-1"><span class="text-sm">時間空檔</span><span class="text-sm font-semibold" id="dw-gap">${Math.round(w.gap*100)}%</span></div>
              <input type="range" min="0" max="100" value="${Math.round(w.gap*100)}" id="weight-gap" class="w-full" />
            </div>
            <div>
              <div class="flex justify-between mb-1"><span class="text-sm">案件金額</span><span class="text-sm font-semibold" id="dw-amount">${Math.round(w.amount*100)}%</span></div>
              <input type="range" min="0" max="100" value="${Math.round(w.amount*100)}" id="weight-amount" class="w-full" />
            </div>
          </div>
        </section>

        <div class="pt-4 border-t flex justify-end">
          <button id="save-defaults" class="btn-primary">儲存預設值</button>
        </div>
      </div>
    `;

    // 綁定即時更新權重 slider
    ['distance', 'gap', 'amount'].forEach(k => {
      const slider = container.querySelector(`#weight-${k}`);
      const label = container.querySelector(`#dw-${k}`);
      slider.oninput = () => {
        label.textContent = slider.value + '%';
      };
    });

    container.querySelector('#save-defaults').onclick = () => {
      // 儲存預設時長
      container.querySelectorAll('[data-default]').forEach(input => {
        s.defaultDuration[input.dataset.default] = parseInt(input.value);
      });
      // 儲存工作時間
      s.workTime.start = container.querySelector('#work-start').value;
      s.workTime.end = container.querySelector('#work-end').value;
      // 儲存權重
      const newW = {
        distance: parseInt(container.querySelector('#weight-distance').value) / 100,
        gap: parseInt(container.querySelector('#weight-gap').value) / 100,
        amount: parseInt(container.querySelector('#weight-amount').value) / 100,
      };
      State.set('weights', newW);
      // 同步側欄 slider
      ['distance', 'gap', 'amount'].forEach(k => {
        const s = document.getElementById(`w-${k}`);
        if (s) {
          s.value = Math.round(newW[k] * 100);
          document.getElementById(`w-${k}-val`).textContent = s.value + '%';
        }
      });

      alert('✅ 已儲存');
    };
  }

  return { render };
})();
