/**
 * components/single-vehicle-map-modal.js
 * 單車路線地圖 Modal - 點時間軸的 🗺️ 按鈕跳出
 *
 * 功能：
 * - 顯示該車今日所有案件
 * - 自動計算路線（OSRM）
 * - 顯示總距離、預估時間、站點清單
 */

const SingleVehicleMapModal = (() => {

  const MODAL_ID = 'single-vehicle-map-modal';
  let _map = null;
  let _markers = [];
  let _routeLine = null;

  function open(vehicleId) {
    _ensureModal();
    document.getElementById(MODAL_ID).style.display = 'flex';

    const v = MockData.VEHICLES.find(x => x.id === vehicleId);
    document.getElementById('svm-title').textContent = `${v.name} 今日路線`;

    setTimeout(() => _initMap(vehicleId), 100); // 等 modal 渲染
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (el) el.style.display = 'none';
    if (_map) {
      _map.remove();
      _map = null;
    }
  }

  function _ensureModal() {
    if (document.getElementById(MODAL_ID)) return;

    const root = document.getElementById('modal-root');
    const div = document.createElement('div');
    div.id = MODAL_ID;
    div.className = 'modal-overlay';
    div.style.display = 'none';
    div.innerHTML = `
      <div class="modal-content" style="max-width: 900px; padding: 0; overflow:hidden">
        <div class="flex justify-between items-center px-6 py-4 border-b">
          <h2 id="svm-title" class="text-xl font-bold">車輛路線</h2>
          <button class="close-btn text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div class="flex" style="height: 500px">
          <div id="svm-stops" class="w-64 overflow-y-auto p-3 border-r border-gray-200 bg-gray-50"></div>
          <div id="svm-map" class="flex-1"></div>
        </div>
        <div id="svm-stats" class="px-6 py-3 border-t bg-gray-50 text-sm text-gray-700"></div>
      </div>
    `;
    root.appendChild(div);
    div.querySelectorAll('.close-btn').forEach(b => b.onclick = close);
  }

  async function _initMap(vehicleId) {
    if (_map) {
      _map.remove();
      _map = null;
    }

    const cases = MockData.CASES.filter(c =>
      c.vehicleId === vehicleId && c.date === State.get('currentDate') && c.lat > 0
    ).sort((a,b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start));

    _map = L.map('svm-map').setView([MockData.HQ.lat, MockData.HQ.lng], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19,
    }).addTo(_map);

    // HQ marker
    L.marker([MockData.HQ.lat, MockData.HQ.lng], {
      icon: L.divIcon({
        html: '<div class="hq-marker">總</div>', iconSize: [32, 32], iconAnchor: [16, 16], className: '',
      }),
    }).bindPopup(MockData.HQ.name).addTo(_map);

    // Case markers
    cases.forEach((c, i) => {
      const marker = L.marker([c.lat, c.lng], {
        icon: L.divIcon({
          html: `<div class="numbered-marker">${i+1}</div>`,
          iconSize: [32, 32], iconAnchor: [16, 16], className: '',
        }),
      }).bindPopup(`<b>站 ${i+1} · ${c.customer}</b><br/>${c.start} · ${c.duration}min<br/>${c.address}`).addTo(_map);
      _markers.push(marker);
    });

    // 站點清單
    _renderStops(cases);

    // 計算路線
    if (cases.length > 0) {
      const points = [MockData.HQ, ...cases.map(c => ({lat:c.lat,lng:c.lng})), MockData.HQ];
      document.getElementById('svm-stats').innerHTML = '<div class="loader inline-block mr-2"></div>正在計算路線...';

      const route = await RouteService.getRoute(points);
      _drawRoute(route);
      _renderStats(cases.length, route);

      // Fit bounds
      const bounds = L.latLngBounds([
        [MockData.HQ.lat, MockData.HQ.lng],
        ...cases.map(c => [c.lat, c.lng]),
      ]);
      _map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      document.getElementById('svm-stats').innerHTML = '<span class="text-gray-500">該車今日沒有現場案件</span>';
    }
  }

  function _drawRoute(route) {
    if (_routeLine) _map.removeLayer(_routeLine);
    if (route.coordinates.length < 2) return;
    _routeLine = L.polyline(route.coordinates, {
      color: '#2563eb', weight: 4, opacity: 0.7,
      dashArray: route.isFallback ? '8, 8' : null,
    }).addTo(_map);
  }

  function _renderStops(cases) {
    const el = document.getElementById('svm-stops');
    el.innerHTML = '<h3 class="font-semibold text-sm mb-2 text-gray-700">行程順序</h3>';
    el.innerHTML += `<div class="stop-card mb-2"><div class="stop-number hq">起</div><div class="text-xs"><div class="font-medium">${MockData.HQ.name}</div><div class="text-gray-500">出發</div></div></div>`;
    cases.forEach((c, i) => {
      el.innerHTML += `
        <div class="stop-card mb-2">
          <div class="stop-number">${i+1}</div>
          <div class="flex-1 min-w-0 text-xs">
            <div class="font-semibold truncate">${c.customer}</div>
            <div class="text-gray-500">${c.start} · ${c.duration}min</div>
          </div>
        </div>`;
    });
    el.innerHTML += `<div class="stop-card"><div class="stop-number hq">終</div><div class="text-xs"><div class="font-medium">${MockData.HQ.name}</div><div class="text-gray-500">收工</div></div></div>`;
  }

  function _renderStats(stopCount, route) {
    const fb = route.isFallback ? '<span class="text-amber-600 ml-2">⚠️ 直線估算</span>' : '';
    document.getElementById('svm-stats').innerHTML = `
      <div class="flex gap-6">
        <div><span class="text-gray-500">站點：</span><span class="font-semibold">${stopCount}</span></div>
        <div><span class="text-gray-500">總距離：</span><span class="font-semibold">${route.distanceKm.toFixed(1)} km</span></div>
        <div><span class="text-gray-500">預估行車：</span><span class="font-semibold">${Math.round(route.durationMin)} 分</span></div>
        ${fb}
      </div>
    `;
  }

  return { open, close };
})();
