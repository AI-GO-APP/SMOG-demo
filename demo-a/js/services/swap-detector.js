/**
 * swap-detector.js
 * 自動偵測「可調換點」演算法
 *
 * 核心邏輯：
 *   對於不同車的每對案件 (A on V_a, B on V_b)：
 *     1. 計算目前路線總距離（A 在 V_a 上、B 在 V_b 上）
 *     2. 計算交換後路線總距離（A 在 V_b 上、B 在 V_a 上）
 *     3. 若交換後總距離明顯較短（節省 > 閾值），標記為可調換
 *     4. 過濾車輛類型不相容的情況（例如丈量車不能接施作）
 *
 * 複雜度：O(n²) where n = 案件數
 *   現有 14 個案件 → 196 次比較，瞬間完成
 *
 * 真實開發時可優化：
 *   - 用空間索引（KD-tree）快速找近鄰
 *   - 加入時間窗約束
 *   - 考慮人員技能匹配
 */

const SwapDetector = (() => {

  // 節省距離 > 此閾值才建議調換（公里）
  const SAVING_THRESHOLD_KM = 3;

  /**
   * 找出可調換的案件對
   * @param {String} date - YYYY-MM-DD
   * @returns {Array<{caseAId, caseBId, vehicleA, vehicleB, currentTotal, swappedTotal, saving, reason}>}
   */
  function detect(date) {
    const cases = MockData.CASES.filter(c =>
      c.date === date && c.lat > 0 && c.vehicleId // 已排車且非線上丈量
    );

    const swaps = [];

    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        const A = cases[i];
        const B = cases[j];

        if (A.vehicleId === B.vehicleId) continue; // 同車不算

        // 檢查車輛類型相容性
        if (!_isTypeCompatible(A.type, B.vehicleId)) continue;
        if (!_isTypeCompatible(B.type, A.vehicleId)) continue;

        const swap = _evaluateSwap(A, B, cases);
        if (swap && swap.saving >= SAVING_THRESHOLD_KM) {
          swaps.push(swap);
        }
      }
    }

    // 依節省距離排序
    return swaps.sort((a, b) => b.saving - a.saving);
  }

  /** 評估單一對的調換效果 */
  function _evaluateSwap(A, B, allCases) {
    // A 在原車的前後鄰居
    const aNeighbors = _getNeighbors(A, allCases);
    const bNeighbors = _getNeighbors(B, allCases);

    // 目前路線距離（A 與其鄰居 + B 與其鄰居）
    const currentDist =
      Utils.distanceKm(aNeighbors.prev, A) +
      Utils.distanceKm(A, aNeighbors.next) +
      Utils.distanceKm(bNeighbors.prev, B) +
      Utils.distanceKm(B, bNeighbors.next);

    // 交換後：B 接在 A 原本的位置、A 接在 B 原本的位置
    const swappedDist =
      Utils.distanceKm(aNeighbors.prev, B) +
      Utils.distanceKm(B, aNeighbors.next) +
      Utils.distanceKm(bNeighbors.prev, A) +
      Utils.distanceKm(A, bNeighbors.next);

    const saving = currentDist - swappedDist;

    if (saving <= 0) return null;

    return {
      caseAId: A.id,
      caseBId: B.id,
      caseACustomer: A.customer,
      caseBCustomer: B.customer,
      vehicleAId: A.vehicleId,
      vehicleBId: B.vehicleId,
      currentTotal: currentDist,
      swappedTotal: swappedDist,
      saving,
      reason: `${A.customer}（${_getVName(A.vehicleId)}）與 ${B.customer}（${_getVName(B.vehicleId)}）對調可節省 ${saving.toFixed(1)} km`,
    };
  }

  /** 取得案件的時間順序前後鄰居（含 HQ） */
  function _getNeighbors(c, allCases) {
    const sameVehicle = allCases
      .filter(x => x.vehicleId === c.vehicleId && x.lat > 0)
      .sort((a, b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start));

    const idx = sameVehicle.findIndex(x => x.id === c.id);
    return {
      prev: idx > 0 ? sameVehicle[idx - 1] : MockData.HQ,
      next: idx < sameVehicle.length - 1 ? sameVehicle[idx + 1] : MockData.HQ,
    };
  }

  function _isTypeCompatible(caseType, vehicleId) {
    return MockData.getVehicleAllowedTypes(vehicleId).includes(caseType);
  }

  function _getVName(vehicleId) {
    const v = MockData.VEHICLES.find(x => x.id === vehicleId);
    return v ? v.name : vehicleId;
  }

  return { detect };
})();
