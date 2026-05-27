/**
 * route-service.js
 * 路線計算服務 - 呼叫 OSRM 公開 API
 * （從 demo-b 移植過來）
 */

const RouteService = (() => {

  const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

  /**
   * 取得路線
   * @param {Array<{lat, lng}>} points
   * @returns {Promise<{coordinates: Array<[lat,lng]>, distanceKm: number, durationMin: number, isFallback?: boolean}>}
   */
  async function getRoute(points) {
    if (points.length < 2) {
      return { coordinates: [], distanceKm: 0, durationMin: 0 };
    }

    const coordsStr = points.map(p => `${p.lng},${p.lat}`).join(';');
    const url = `${OSRM_BASE}/${coordsStr}?overview=full&geometries=geojson`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(data.message || '無法計算路線');
      }
      const route = data.routes[0];
      const leafletCoords = route.geometry.coordinates.map(c => [c[1], c[0]]);
      return {
        coordinates: leafletCoords,
        distanceKm: route.distance / 1000,
        durationMin: route.duration / 60,
      };
    } catch (err) {
      console.warn('[RouteService] OSRM 失敗，改用直線:', err);
      return _fallback(points);
    }
  }

  function _fallback(points) {
    const coords = points.map(p => [p.lat, p.lng]);
    let totalKm = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalKm += Utils.distanceKm(points[i], points[i+1]);
    }
    return {
      coordinates: coords,
      distanceKm: totalKm,
      durationMin: totalKm * 2,
      isFallback: true,
    };
  }

  return { getRoute };
})();
