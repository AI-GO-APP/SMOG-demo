/**
 * utils.js
 * 純函式工具：時間轉換、距離計算、行車時間估算
 */

const Utils = (() => {

  /** "HH:MM" 字串轉為「從 0:00 起算的分鐘數」*/
  function timeToMinutes(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  /** 分鐘數轉回 "HH:MM" 字串 */
  function minutesToTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  /** Haversine 公式：計算兩座標之間的球面距離（公里） */
  function distanceKm(a, b) {
    if (!a.lat || !b.lat) return 0;
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const x = Math.sin(dLat/2)**2 +
              Math.sin(dLng/2)**2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }

  /**
   * 估算行車時間（分鐘）
   * 假設市區平均車速 30km/h，再加 5 分鐘 buffer（停車、找路）
   */
  function travelMinutes(km) {
    return Math.round(km * 2 + 5);
  }

  /** 把 Date 轉成本地時區的 YYYY-MM-DD（避免 toISOString 偏移）*/
  function _toLocalDateStr(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /** 取得今日日期 YYYY-MM-DD (本地時區) */
  function todayStr() {
    return _toLocalDateStr(new Date());
  }

  /** 日期 ±1 (本地時區) */
  function shiftDate(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');  // 強制當作本地午夜
    d.setDate(d.getDate() + days);
    return _toLocalDateStr(d);
  }

  return {
    timeToMinutes,
    minutesToTime,
    distanceKm,
    travelMinutes,
    todayStr,
    shiftDate,
  };
})();
