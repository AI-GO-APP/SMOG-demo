/**
 * suggestion-engine.js
 * 排程建議引擎 - 計算 Top 3 適合的插入位置
 *
 * 核心邏輯：
 *   對每台車的每個可能時段（30 分鐘為單位）：
 *   1. 檢查時間衝突
 *   2. 檢查車輛類型相容（丈量車不接施作）
 *   3. 估算與前後案件的距離與行車時間
 *   4. 確認時間夠用（前案完工後+行車能否趕到）
 *   5. 計算分數 = w1*距離分 + w2*空檔分 + w3*金額分
 *   6. 排序取前 3 名
 *
 * 真實開發建議：
 *   - 距離改用 OSRM/ORS 真實道路距離
 *   - 加入師傅技能匹配
 *   - 加入時段偏好（客戶可配合時間）
 *   - 加入避開尖峰時段
 */

const SuggestionEngine = (() => {

  /** 檢查車輛類型是否能接此案 */
  function isVehicleTypeMatch(vehicleType, caseType) {
    if (caseType === '線上丈量') return true; // 任何車都行（其實不需要車）
    if (caseType === '施作' && vehicleType === '丈量') return false;
    if (caseType.includes('丈量') && vehicleType === '施作') return false;
    return true;
  }

  /** 檢查時段是否與既有案件衝突 */
  function hasConflict(vehicleCases, startMin, duration) {
    return vehicleCases.some(c => {
      const cStart = Utils.timeToMinutes(c.start);
      const cEnd = cStart + c.duration;
      return !(startMin + duration <= cStart || startMin >= cEnd);
    });
  }

  /** 檢查行車時間是否來得及 */
  function isTravelFeasible(prev, next, point, startMin, duration) {
    const HQ = MockData.HQ;
    const prevPoint = prev ? { lat: prev.lat, lng: prev.lng } : HQ;
    const nextPoint = next ? { lat: next.lat, lng: next.lng } : HQ;

    const distToPrev = Utils.distanceKm(prevPoint, point);
    const distToNext = next ? Utils.distanceKm(point, nextPoint) : 0;

    const travelFromPrev = Utils.travelMinutes(distToPrev);
    // 沒有 prev 案件 → 從上班時段起算（9:00），不是寫死的 8:00
    const range = (typeof State !== 'undefined' && State.get) ? State.get('timeRange') : { start: 9 * 60 };
    const prevEndTime = prev ? Utils.timeToMinutes(prev.start) + prev.duration : range.start;

    if (prevEndTime + travelFromPrev > startMin) return null; // 來不及

    // ⭐ 第一場 of day 規則:
    //   HQ → 案點 ≤ 30 min  → 第一場最早 9:30
    //   HQ → 案點 > 30 min  → 第一場最早 10:00
    if (!prev) {
      const firstSlotEarliest = travelFromPrev <= 30 ? (9 * 60 + 30) : (10 * 60);
      if (startMin < firstSlotEarliest) return null;
    }

    if (next) {
      const travelToNext = Utils.travelMinutes(distToNext);
      const nextStartTime = Utils.timeToMinutes(next.start);
      if (startMin + duration + travelToNext > nextStartTime) return null;
    }

    return { distToPrev, distToNext, totalDist: distToPrev + distToNext };
  }

  /** 計算單一時段的分數 */
  function calculateScore(weights, distInfo, gapBefore, amount) {
    // distance_score: 距離越短越好
    const distanceScore = 1 / (1 + distInfo.totalDist / 5);
    // gap_score: 時間空檔太大代表浪費
    const gapScore = 1 - Math.min(gapBefore / 180, 1);
    // amount_score: 案件金額大優先
    const amountScore = amount ? Math.min(amount / 50000, 1) : 0.5;

    return weights.distance * distanceScore +
           weights.gap * gapScore +
           weights.amount * amountScore;
  }

  /**
   * 主入口：根據新案計算 Top 3 建議
   * @param {Object} newCase - { type, duration, lat, lng, amount, ... }
   * @param {String} date - YYYY-MM-DD
   * @returns {Array} top 3 suggestions
   */
  function suggest(newCase, date) {
    const weights = State.get('weights');
    const range = State.get('timeRange');
    const dateCases = MockData.CASES.filter(c => c.date === date);
    const suggestions = [];

    MockData.VEHICLES.forEach(v => {
      if (!isVehicleTypeMatch(v.type, newCase.type)) return;

      const vCases = dateCases
        .filter(c => c.vehicleId === v.id)
        .sort((a,b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start));

      // 嘗試每個 30 分鐘起始點
      for (let t = range.start; t + newCase.duration <= range.end; t += range.step) {

        if (hasConflict(vCases, t, newCase.duration)) continue;

        const prev = [...vCases].reverse().find(c =>
          Utils.timeToMinutes(c.start) + c.duration <= t
        );
        const next = vCases.find(c =>
          Utils.timeToMinutes(c.start) >= t + newCase.duration
        );

        const distInfo = isTravelFeasible(prev, next, newCase, t, newCase.duration);
        if (!distInfo) continue;

        const prevEndTime = prev
          ? Utils.timeToMinutes(prev.start) + prev.duration
          : range.start;
        const gapBefore = t - prevEndTime;

        const score = calculateScore(weights, distInfo, gapBefore, newCase.amount);

        suggestions.push({
          vehicleId: v.id,
          vehicleName: v.name,
          startTime: Utils.minutesToTime(t),
          score,
          totalDist: distInfo.totalDist,
          gapBefore,
          prev,
          next,
        });
      }
    });

    return suggestions.sort((a,b) => b.score - a.score).slice(0, 5);
  }


  // ============================================================
  // 新版：跨 14 天 + 分區 + 距離邏輯
  // ============================================================

  const REMOTE_DISTANCE_KM = 40;   // ≥ 40km 算遠
  const AFTERNOON_START    = 13 * 60;   // 13:00
  const SEARCH_DAYS        = 14;

  /**
   * 新版主入口：依 v0.5 業務邏輯為新諮詢找推薦時段
   *   - 限制在同分區內
   *   - 隔天起 14 天找候選
   *   - 順路（< 40km）: 插入既有路線
   *   - 孤立（≥ 40km 或空白天）: 排空白天下午，避開早上
   *   - 線上丈量：跳過距離邏輯
   *
   * @param {Object} newCase - { type, duration, lat, lng, locationCode, amount, ... }
   * @returns {Array} top 3 suggestions ({ vehicleId, vehicleName, date, startTime, score, reason, ... })
   */
  function suggestForBooking(newCase) {
    const branch = newCase.locationCode;
    if (!branch) {
      console.warn('[SuggestionEngine] newCase 缺少 locationCode，無法推薦');
      return [];
    }

    // 用本地時區產生日期字串 (避免 toISOString 的 UTC 偏移問題)
    function _toLocalDateStr(d) {
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }

    // 14 天候選（隔天起）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let i = 1; i <= SEARCH_DAYS; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      days.push(_toLocalDateStr(d));
    }

    // 該分區的車輛
    const branchVehicles = MockData.VEHICLES.filter(v => v.locationCode === branch);
    if (branchVehicles.length === 0) {
      console.warn('[SuggestionEngine] 該分區沒車');
      return [];
    }

    // 線上丈量：簡化邏輯
    if (newCase.type === '線上丈量') {
      return _suggestOnline(newCase, branchVehicles, days);
    }

    const onRoute = [];      // 順路候選
    const emptyDays = [];    // 空白天候選

    days.forEach(day => {
      // 該日該分區的「確認」案件
      const dayCases = MockData.CASES.filter(c =>
        c.date === day &&
        c.locationCode === branch &&
        c.start && c.vehicleId &&
        c.id !== newCase.excludeCaseId  // 排除自己 (更改時程時)
      );

      if (dayCases.length === 0) {
        emptyDays.push(day);
        return;
      }

      // 算最短距離到該日案件
      let minDist = Infinity;
      let nearestCase = null;
      dayCases.forEach(c => {
        const d = Utils.distanceKm(
          { lat: newCase.lat, lng: newCase.lng },
          { lat: c.lat, lng: c.lng }
        );
        if (d < minDist) { minDist = d; nearestCase = c; }
      });

      if (minDist >= REMOTE_DISTANCE_KM) {
        // 都很遠 → 算近似「孤立日」
        emptyDays.push(day);
        return;
      }

      // 順路 → 找該日插入點
      const range = State.get('timeRange');
      branchVehicles.forEach(v => {
        if (!isVehicleTypeMatch(v.type, newCase.type)) return;

        const vCases = dayCases.filter(c => c.vehicleId === v.id)
          .sort((a, b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start));

        for (let t = range.start; t + newCase.duration <= range.end; t += range.step) {
          if (hasConflict(vCases, t, newCase.duration)) continue;

          const prev = [...vCases].reverse().find(cc =>
            Utils.timeToMinutes(cc.start) + cc.duration <= t
          );
          const next = vCases.find(cc =>
            Utils.timeToMinutes(cc.start) >= t + newCase.duration
          );

          const distInfo = isTravelFeasible(prev, next, newCase, t, newCase.duration);
          if (!distInfo) continue;

          // 分數：基於最短距離 + 行車距離（越近越高）
          // 範圍 50~100，順路一律 > 孤立
          const proximityScore = (1 - minDist / REMOTE_DISTANCE_KM) * 30;   // 0~30
          const routeScore     = Math.max(0, 20 - distInfo.totalDist);       // 0~20
          const score          = 50 + proximityScore + routeScore;

          onRoute.push({
            vehicleId: v.id,
            vehicleName: v.name,
            date: day,
            startTime: Utils.minutesToTime(t),
            score,
            minDist,
            totalDist: distInfo.totalDist,
            prev,
            next,
            reason: `🛣️ 順路（最近案件 ${minDist.toFixed(1)} km）`,
            isIsolated: false,
          });
        }
      });
    });

    // 套用客戶期望時間（軟限制 + 加分）
    function _applyPreferenceBonus(list) {
      const pDate  = newCase.preferred_date;
      const pStart = newCase.preferred_start;
      if (!pDate && !pStart) return list;

      list.forEach(s => {
        let bonus = 0;
        let labels = [];

        // 日期匹配度
        if (pDate) {
          if (s.date === pDate) {
            bonus += 30;
            labels.push('📅 完全符合期望日期');
          } else {
            // 計算差幾天
            const diff = Math.abs((new Date(s.date) - new Date(pDate)) / 86400000);
            if (diff <= 1) { bonus += 20; labels.push(`📅 差 ${Math.round(diff)} 天`); }
            else if (diff <= 3) { bonus += 10; labels.push(`📅 差 ${Math.round(diff)} 天`); }
            else { labels.push(`📅 差 ${Math.round(diff)} 天`); }
          }
        }

        // 時段匹配度
        if (pStart) {
          const pMin = Utils.timeToMinutes(pStart);
          const sMin = Utils.timeToMinutes(s.startTime);
          const diffMin = Math.abs(sMin - pMin);
          if (diffMin === 0) {
            bonus += 30;
            labels.push('⏰ 完全符合期望時段');
          } else if (diffMin <= 30) {
            bonus += 20;
            labels.push(`⏰ 差 ${diffMin} 分`);
          } else if (diffMin <= 60) {
            bonus += 10;
            labels.push(`⏰ 差 ${diffMin} 分`);
          } else {
            labels.push(`⏰ 差 ${diffMin} 分`);
          }
        }

        s.score += bonus;
        s.preferenceMatch = labels.join(' · ');
      });
      return list;
    }

    _applyPreferenceBonus(onRoute);

    // 排序順路：分數高的優先 (含客戶期望加分)
    onRoute.sort((a, b) => b.score - a.score);

    if (onRoute.length >= 3) {
      return onRoute.slice(0, 5);
    }

    // 不夠 3 個 → 補空白天（最近的、下午、跳過早上）
    emptyDays.sort();
    const range = State.get('timeRange');
    const result = [...onRoute];

    for (const day of emptyDays) {
      for (const v of branchVehicles) {
        if (!isVehicleTypeMatch(v.type, newCase.type)) continue;

        // 從 13:00 起找第一個可放下 duration 的 slot
        const t = Math.max(AFTERNOON_START, range.start);
        if (t + newCase.duration > range.end) continue;

        const dayIdx = emptyDays.indexOf(day);
        // 空白天分數：30~50（一定低於順路）
        const score = 50 - dayIdx * (30 / SEARCH_DAYS);

        result.push({
          vehicleId: v.id,
          vehicleName: v.name,
          date: day,
          startTime: Utils.minutesToTime(t),
          score,
          minDist: null,
          totalDist: 0,
          prev: null,
          next: null,
          reason: '🏝️ 空白日下午（保留早上給未來順路案件）',
          isIsolated: true,
        });

        if (result.length >= 3) break;
      }
      if (result.length >= 3) break;
    }

    // 對空白日 + 順路混合的結果也套用偏好加分
    _applyPreferenceBonus(result);
    result.sort((a, b) => b.score - a.score);
    return result.slice(0, 5);
  }

  /** 線上丈量：優先用「線上專員」虛擬車 */
  function _suggestOnline(newCase, branchVehicles, days) {
    const range = State.get('timeRange');
    const result = [];

    // 找該分區的「線上專員」虛擬車（code 以 ONLINE- 開頭）
    const onlineVehicles = branchVehicles.filter(v => v.id && v.id.startsWith('ONLINE-'));
    // 若沒設定線上專員車，fallback 用該分區所有車
    const vehiclesToUse = onlineVehicles.length > 0 ? onlineVehicles : branchVehicles;

    for (const day of days) {
      const dayCases = MockData.CASES.filter(c =>
        c.date === day && c.locationCode === newCase.locationCode &&
        c.id !== newCase.excludeCaseId
      );

      for (const v of vehiclesToUse) {
        const vCases = dayCases.filter(c => c.vehicleId === v.id)
          .sort((a, b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start));

        for (let t = range.start; t + newCase.duration <= range.end; t += range.step) {
          if (hasConflict(vCases, t, newCase.duration)) continue;
          result.push({
            vehicleId: v.id,
            vehicleName: v.name,
            date: day,
            startTime: Utils.minutesToTime(t),
            score: 80,
            totalDist: 0,
            prev: null, next: null,
            reason: '💻 線上丈量（線上專員處理，無需出車）',
            isIsolated: false,
          });
          if (result.length >= 3) return result;
          break;
        }
      }
    }
    return result;
  }

  return { suggest, suggestForBooking };
})();
