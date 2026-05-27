/**
 * components/all-vehicles-map.js
 * 全車路線總覽 - 永遠開啟（v0.3 起不再可摺疊）
 *
 * 功能：
 * - 一張地圖顯示所有車路線
 * - 每車一個顏色（從 VEHICLES.color 取）
 * - pill 按鈕控制顯示哪些車（多選疊加）
 * - 自動偵測「可調換點」（呼叫 SwapDetector）
 */

const AllVehiclesMap = (() => {

  let _map = null;
  let _layers = {};      // vehicleId -> { markers: [...], line: polyline }
  let _swapMarkers = []; // 高亮可調換的點
  let _isStale = false;  // 路線是否過期（拖曳改動後）

  /** 由 SchedulePage 在渲染完 DOM 後呼叫 */
  function init() {
    // 釋放前次 map（切頁回來時）
    if (_map) {
      _map.remove();
      _map = null;
      _layers = {};
      _swapMarkers = [];
    }
    _isStale = false;
    setTimeout(() => _initMap(), 100);
  }

  /** 標記路線過期（拖曳後呼叫）*/
  function markStale() {
    _isStale = true;
    _updateReloadButton();
  }

  /** 重新計算所有路線 */
  async function reloadRoutes() {
    if (!_map) return;
    // 清除既有 markers + lines
    Object.values(_layers).forEach(layer => {
      layer.markers.forEach(m => _map.removeLayer(m));
      if (layer.line) _map.removeLayer(layer.line);
    });
    _layers = {};
    _swapMarkers.forEach(m => _map.removeLayer(m));
    _swapMarkers = [];

    await _renderAllRoutes();
    _renderSwapSuggestions();
    _isStale = false;
    _updateReloadButton();
  }

  function _updateReloadButton() {
    const btn = document.getElementById('reload-routes-btn');
    if (!btn) return;
    btn.classList.toggle('stale', _isStale);
    btn.textContent = _isStale ? '🔄 路線已過期，點此重算' : '🔄 重新計算路線';
  }

  async function _initMap() {
    _map = L.map('overview-map').setView([MockData.HQ.lat, MockData.HQ.lng], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(_map);

    // HQ
    L.marker([MockData.HQ.lat, MockData.HQ.lng], {
      icon: L.divIcon({
        html: '<div class="hq-marker">總</div>', iconSize: [32, 32], iconAnchor: [16, 16], className: '',
      }),
    }).bindPopup(MockData.HQ.name).addTo(_map);

    // 渲染各車
    _renderVehicleToggles();
    await _renderAllRoutes();
    _renderSwapSuggestions();
  }

  // 記住每台車當前的顯示狀態
  const _activeVehicles = new Set(MockData.VEHICLES.map(v => v.id));

  function _renderVehicleToggles() {
    const container = document.getElementById('vehicle-toggles');
    container.innerHTML = '';

    // 各車按鈕（pill 樣式，可疊加切換）
    MockData.VEHICLES.forEach(v => {
      const btn = document.createElement('button');
      btn.className = 'vehicle-pill active';
      btn.dataset.vehicleId = v.id;
      btn.style.setProperty('--pill-color', v.color);
      btn.innerHTML = `
        <span class="vehicle-color-dot" style="background:${v.color}"></span>
        <span>${v.name}</span>
      `;
      btn.onclick = () => _togglePill(v.id);
      container.appendChild(btn);
    });

    // 分隔線
    const sep = document.createElement('span');
    sep.className = 'vehicle-pill-sep';
    container.appendChild(sep);

    // 全選 / 全不選
    const selectAllBtn = document.createElement('button');
    selectAllBtn.className = 'vehicle-pill-secondary';
    selectAllBtn.textContent = '全選';
    selectAllBtn.onclick = () => _setAll(true);
    container.appendChild(selectAllBtn);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'vehicle-pill-secondary';
    clearBtn.textContent = '全不選';
    clearBtn.onclick = () => _setAll(false);
    container.appendChild(clearBtn);
  }

  function _togglePill(vehicleId) {
    const isActive = _activeVehicles.has(vehicleId);
    if (isActive) _activeVehicles.delete(vehicleId);
    else _activeVehicles.add(vehicleId);
    _updatePillStyles();
    _toggleVehicle(vehicleId, !isActive);
  }

  function _setAll(show) {
    MockData.VEHICLES.forEach(v => {
      const wasActive = _activeVehicles.has(v.id);
      if (show && !wasActive) _activeVehicles.add(v.id);
      else if (!show && wasActive) _activeVehicles.delete(v.id);
      _toggleVehicle(v.id, show);
    });
    _updatePillStyles();
  }

  function _updatePillStyles() {
    document.querySelectorAll('.vehicle-pill[data-vehicle-id]').forEach(btn => {
      const isActive = _activeVehicles.has(btn.dataset.vehicleId);
      btn.classList.toggle('active', isActive);
    });
  }

  async function _renderAllRoutes() {
    const date = State.get('currentDate');
    document.getElementById('overview-loading').classList.remove('hidden');

    for (const v of MockData.VEHICLES) {
      const cases = MockData.CASES
        .filter(c => c.vehicleId === v.id && c.date === date && c.lat > 0)
        .sort((a,b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start));

      _layers[v.id] = { markers: [], line: null };
      if (cases.length === 0) continue;

      // Markers (帶顏色)
      cases.forEach((c, i) => {
        const marker = L.marker([c.lat, c.lng], {
          icon: L.divIcon({
            html: `<div class="numbered-marker" style="background:${v.color}">${i+1}</div>`,
            iconSize: [28, 28], iconAnchor: [14, 14], className: '',
          }),
        }).bindPopup(`<b>${v.name} · 站 ${i+1}</b><br/>${c.customer}<br/>${c.start} · ${c.address}`).addTo(_map);
        _layers[v.id].markers.push(marker);
      });

      // Polyline
      const points = [MockData.HQ, ...cases.map(c => ({lat:c.lat,lng:c.lng})), MockData.HQ];
      const route = await RouteService.getRoute(points);
      const line = L.polyline(route.coordinates, {
        color: v.color, weight: 4, opacity: 0.7,
        dashArray: route.isFallback ? '8, 8' : null,
      }).addTo(_map);
      _layers[v.id].line = line;
    }

    document.getElementById('overview-loading').classList.add('hidden');
  }

  function _toggleVehicle(vehicleId, show) {
    const layer = _layers[vehicleId];
    if (!layer) return;
    layer.markers.forEach(m => show ? m.addTo(_map) : _map.removeLayer(m));
    if (layer.line) show ? layer.line.addTo(_map) : _map.removeLayer(layer.line);
  }

  function _renderSwapSuggestions() {
    const date = State.get('currentDate');
    const swaps = SwapDetector.detect(date);
    const container = document.getElementById('swap-suggestions');

    if (swaps.length === 0) {
      container.innerHTML = '<div class="text-sm text-gray-500">✓ 目前無明顯可調換點，路線分配合理</div>';
      return;
    }

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <div style="font-weight:600; font-size:var(--fs-sm);">💡 系統發現 ${swaps.length} 組可考慮調換</div>
        <button class="link-btn" onclick="AllVehiclesMap.applyAllSwaps()" style="font-weight:600;">⚡ 全部套用</button>
      </div>
      <div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto;">
        ${swaps.slice(0, 5).map((s, i) => {
          const vA = MockData.VEHICLES.find(v => v.id === s.vehicleAId);
          const vB = MockData.VEHICLES.find(v => v.id === s.vehicleBId);
          const pairId = `${s.caseAId}__${s.caseBId}`;
          return `
          <div class="swap-card" data-pair-id="${pairId}" style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
            <div style="flex:1; min-width:0; font-size:var(--fs-sm); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              <span style="font-weight:600;">第 ${i+1} 組：</span>
              ${s.caseACustomer}（${vA ? vA.name : ''}）↔ ${s.caseBCustomer}（${vB ? vB.name : ''}）
              <span style="color:var(--c-text-mute); margin:0 6px;">·</span>
              <span style="color:var(--c-text-mute);">${s.currentTotal.toFixed(1)} → ${s.swappedTotal.toFixed(1)} km</span>
              <span style="color:#059669; font-weight:600; margin-left:6px;">省 ${s.saving.toFixed(1)} km</span>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              <button class="link-btn" onclick="AllVehiclesMap.highlightSwap('${s.caseAId}','${s.caseBId}','${pairId}')">📍 標出</button>
              <button class="link-btn" style="color:#059669; font-weight:600;" onclick="AllVehiclesMap.applySwap('${s.caseAId}','${s.caseBId}')">✅ 套用</button>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function highlightSwap(caseAId, caseBId, pairId) {
    const A = MockData.CASES.find(c => c.id === caseAId);
    const B = MockData.CASES.find(c => c.id === caseBId);
    if (!A || !B) return;

    // 清除前次地圖高亮
    _swapMarkers.forEach(m => _map.removeLayer(m));
    _swapMarkers = [];

    [A, B].forEach(c => {
      const m = L.circleMarker([c.lat, c.lng], {
        radius: 22, color: '#dc2626', weight: 3, fillColor: 'transparent', fillOpacity: 0,
      }).addTo(_map);
      _swapMarkers.push(m);
    });

    const arrow = L.polyline([[A.lat, A.lng], [B.lat, B.lng]], {
      color: '#dc2626', weight: 2, dashArray: '6,6',
    }).addTo(_map);
    _swapMarkers.push(arrow);

    _map.fitBounds([[A.lat, A.lng], [B.lat, B.lng]], { padding: [80, 80] });

    // 同步：把對應的 swap-card 標成淺灰，其他卡片清除高亮
    if (pairId) {
      document.querySelectorAll('.swap-card').forEach(card => {
        card.classList.toggle('marked', card.dataset.pairId === pairId);
      });
    }
  }

  /**
   * 套用單一組調換（互換 vehicleId 與 start time）
   */
  function applySwap(caseAId, caseBId) {
    const A = MockData.CASES.find(c => c.id === caseAId);
    const B = MockData.CASES.find(c => c.id === caseBId);
    if (!A || !B) return;

    // 檢查相容性：對方車輛能否接受此案件類型
    const aOkOnB = MockData.getVehicleAllowedTypes(B.vehicleId).includes(A.type);
    const bOkOnA = MockData.getVehicleAllowedTypes(A.vehicleId).includes(B.type);
    if (!aOkOnB || !bOkOnA) {
      alert(`⚠️ 車輛類型不相容，無法調換。\n\n${A.customer}（${A.type}）→ ${MockData.VEHICLES.find(v=>v.id===B.vehicleId).name}：${aOkOnB ? '✓' : '✗'}\n${B.customer}（${B.type}）→ ${MockData.VEHICLES.find(v=>v.id===A.vehicleId).name}：${bOkOnA ? '✓' : '✗'}`);
      return;
    }

    // 互換 vehicleId 與 start
    [A.vehicleId, B.vehicleId] = [B.vehicleId, A.vehicleId];
    [A.start, B.start]         = [B.start, A.start];

    // 重新渲染時間軸 + 標記路線過期 + 重算建議
    if (typeof TimelineComponent !== 'undefined') TimelineComponent.render();
    markStale();
    _renderSwapSuggestions();
  }

  /** 套用全部建議（從節省最多開始，依序套用，每次重算建議避免衝突）*/
  function applyAllSwaps() {
    const date = State.get('currentDate');
    let applied = 0;
    let totalSaved = 0;

    // 重複處理直到沒有可調換或達到上限
    for (let iter = 0; iter < 10; iter++) {
      const swaps = SwapDetector.detect(date);
      if (swaps.length === 0) break;

      const top = swaps[0];
      const A = MockData.CASES.find(c => c.id === top.caseAId);
      const B = MockData.CASES.find(c => c.id === top.caseBId);
      if (!A || !B) break;

      // 檢查相容性
      const aOk = MockData.getVehicleAllowedTypes(B.vehicleId).includes(A.type);
      const bOk = MockData.getVehicleAllowedTypes(A.vehicleId).includes(B.type);
      if (!aOk || !bOk) {
        // 跳過此組，但因為 detect 永遠先排序，下次會回到同一組 → 強制 break
        break;
      }

      [A.vehicleId, B.vehicleId] = [B.vehicleId, A.vehicleId];
      [A.start, B.start]         = [B.start, A.start];
      applied++;
      totalSaved += top.saving;
    }

    if (typeof TimelineComponent !== 'undefined') TimelineComponent.render();
    markStale();
    _renderSwapSuggestions();

    if (applied > 0) {
      alert(`✅ 已套用 ${applied} 組調換，估計總共節省 ${totalSaved.toFixed(1)} km\n\n別忘了點「🔄 路線已過期」按鈕重算路線`);
    } else {
      alert('沒有可套用的調換（可能類型不相容）');
    }
  }

  return { init, highlightSwap, markStale, reloadRoutes, applySwap, applyAllSwaps };
})();
