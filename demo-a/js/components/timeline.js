/**
 * components/timeline.js
 * 時間軸元件 - 渲染車輛 row + 時間 column 的網格
 *
 * v0.3 起：支援拖曳改派車輛 / 改時間
 */

const TimelineComponent = (() => {

  const containerId = 'timeline-container';

  function render() {
    const range = State.get('timeRange');
    const cellCount = (range.end - range.start) / range.step;
    const grid = document.getElementById(containerId);
    grid.innerHTML = '';
    // 動態 grid 欄數 (避免 CSS 寫死 22 跟實際格數不符)
    grid.style.gridTemplateColumns = `180px repeat(${cellCount}, minmax(60px, 1fr))`;

    // 1. 渲染左上角
    grid.appendChild(_renderCorner());

    // 2. 渲染時間軸表頭
    for (let t = range.start; t < range.end; t += range.step) {
      grid.appendChild(_renderTimeHeader(t));
    }

    // 3. 渲染車輛 row + 案件 (依當前 location 多選過濾)
    const filteredVehicles = MockData.VEHICLES.filter(v => LocationFilter.isInFilter(v.locationCode));
    filteredVehicles.forEach(v => {
      grid.appendChild(_renderVehicleCell(v));
      grid.appendChild(_renderVehicleRow(v, cellCount));
    });
  }

  function _renderCorner() {
    const corner = document.createElement('div');
    corner.className = 'corner';
    corner.innerHTML = '<div class="text-xs font-semibold text-gray-700">車輛 \\ 時間</div>';
    return corner;
  }

  function _renderTimeHeader(min) {
    const cell = document.createElement('div');
    cell.className = 'time-header';
    cell.textContent = Utils.minutesToTime(min);
    return cell;
  }

  function _renderVehicleCell(v) {
    const cell = document.createElement('div');
    cell.className = 'vehicle-cell';
    const members = MockData.getVehicleMembers(v.id);
    const memberNames = members.map(m => m.name).join(' / ');
    cell.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:2px; position:relative;">
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="vehicle-color-dot" style="background:${v.color}"></span>
          <div style="font-weight:600; color:var(--c-text);">${v.name}</div>
        </div>
        <div style="font-size:var(--fs-xs); color:var(--c-text-mute);" title="${memberNames}">${memberNames || '無人員'}</div>
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="status-badge vehicle-tag-${v.type}">${v.type}</span>
          <span style="font-size:var(--fs-xs); color:var(--c-text-mute);">${members.length}人</span>
        </div>
      </div>
    `;

    return cell;
  }

  function _renderVehicleRow(v, cellCount) {
    const range = State.get('timeRange');
    const currentDate = State.get('currentDate');

    const row = document.createElement('div');
    row.className = 'vehicle-row';
    row.dataset.vehicleId = v.id;
    row.style.gridColumn = `2 / -1`;
    row.style.position = 'relative';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = `repeat(${cellCount}, minmax(60px, 1fr))`;
    row.style.borderBottom = '1px solid #e5e7eb';
    row.style.height = '80px';

    // 空格子
    for (let i = 0; i < cellCount; i++) {
      const c = document.createElement('div');
      c.className = 'time-cell';
      row.appendChild(c);
    }

    // 案件方塊
    const vehicleCases = MockData.CASES.filter(c =>
      c.vehicleId === v.id && c.date === currentDate
    );
    vehicleCases.forEach(c => {
      row.appendChild(_renderCaseBlock(c, range, cellCount));
    });

    // 行車距離標示（在案件之間）
    _renderTravelGaps(row, vehicleCases, range, cellCount);

    // ===== 拖放：把案件拖到本 row =====
    _attachRowDropHandlers(row, v, cellCount, range);

    return row;
  }

  /** 在案件之間渲染行車距離/時間標示 */
  function _renderTravelGaps(row, vehicleCases, range, cellCount) {
    // 排序（依時間）
    const sorted = vehicleCases.slice()
      .filter(c => c.lat > 0 && c.start) // 排除線上丈量
      .sort((a, b) => Utils.timeToMinutes(a.start) - Utils.timeToMinutes(b.start));

    for (let i = 0; i < sorted.length - 1; i++) {
      const prev = sorted[i];
      const next = sorted[i + 1];
      const prevEndMin = Utils.timeToMinutes(prev.start) + prev.duration;
      const nextStartMin = Utils.timeToMinutes(next.start);
      const gapMin = nextStartMin - prevEndMin;
      if (gapMin <= 0) continue; // 重疊或銜接

      const distKm = Utils.distanceKm(prev, next);
      const travelMin = Utils.travelMinutes(distKm);
      const insufficient = travelMin > gapMin;

      const label = document.createElement('div');
      label.className = 'travel-gap-label' + (insufficient ? ' insufficient' : '');

      // 置中於 gap 中間
      const gapMidCell = (prevEndMin + gapMin / 2 - range.start) / range.step;
      label.style.left = `calc(${gapMidCell} * (100% / ${cellCount}))`;

      label.innerHTML = `← ${travelMin}min →`;
      label.title = insufficient
        ? `⚠️ 來不及！行車需 ${travelMin} 分（${distKm.toFixed(1)}km），但只有 ${gapMin} 分空檔（缺 ${travelMin - gapMin} 分）`
        : `行車預估 ${travelMin} 分（${distKm.toFixed(1)}km）· 空檔 ${gapMin} 分`;

      row.appendChild(label);
    }
  }

  function _renderCaseBlock(c, range, cellCount) {
    const startMin = Utils.timeToMinutes(c.start);
    const offsetCells = (startMin - range.start) / range.step;
    const widthCells = c.duration / range.step;

    // 短類型名稱：丈量 / 施作
    const typeShort = c.type.includes('丈量') ? '丈量' : '施作';
    // 簡化地址：去掉「桃園市」「新北市」等市名前綴，更省空間
    const shortAddr = (c.address || '').replace(/^.{0,3}市/, '');

    const block = document.createElement('div');
    block.className = `case-block case-${c.type}`;
    block.dataset.caseId = c.id;
    block.draggable = true;       // ⭐ 可拖曳
    block.style.left = `calc(${offsetCells} * (100% / ${cellCount}))`;
    block.style.width = `calc(${widthCells} * (100% / ${cellCount}) - 4px)`;
    block.title = `${c.customer} · ${c.type}\n${c.start} · ${c.duration}min · ${c.status}\n拖曳可改派車輛/改時間`;
    block.innerHTML = `
      <div class="cb-title">${c.customer} · ${typeShort}</div>
      <div class="cb-time">${c.start} · ${c.duration}min</div>
      <div class="cb-addr">${shortAddr}</div>
    `;

    // ===== 點擊（區分點擊與拖曳）=====
    let _dragStarted = false;
    block.onclick = (e) => {
      if (_dragStarted) { _dragStarted = false; return; }
      CaseModalComponent.open(c.id);
    };

    // ===== 拖曳起始 =====
    block.ondragstart = (e) => {
      _dragStarted = true;
      e.dataTransfer.setData('text/plain', c.id);
      e.dataTransfer.effectAllowed = 'move';
      // 記錄滑鼠在卡片內的偏移（以 cell 為單位）
      const blockRect = block.getBoundingClientRect();
      const cellPx = blockRect.width / widthCells;
      const offsetCellsInBlock = (e.clientX - blockRect.left) / cellPx;
      e.dataTransfer.setData('application/x-cell-offset', String(offsetCellsInBlock));
      e.dataTransfer.setData('application/x-duration', String(c.duration));
      block.classList.add('dragging');
    };
    block.ondragend = () => {
      block.classList.remove('dragging');
    };

    return block;
  }

  /** 給 row 綁定拖曳目標處理 */
  function _attachRowDropHandlers(row, vehicle, cellCount, range) {
    row.ondragover = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      row.classList.add('row-drop-target');
    };
    row.ondragleave = (e) => {
      // 確認是真的離開 row（不是進入子元素）
      if (!row.contains(e.relatedTarget)) {
        row.classList.remove('row-drop-target');
      }
    };
    row.ondrop = (e) => {
      e.preventDefault();
      row.classList.remove('row-drop-target');

      const caseId = e.dataTransfer.getData('text/plain');
      const cellOffsetInBlock = parseFloat(e.dataTransfer.getData('application/x-cell-offset')) || 0;
      if (!caseId) return;

      // 計算掉落位置 → 時間
      const rowRect = row.getBoundingClientRect();
      const cellPx = rowRect.width / cellCount;
      const dropX = e.clientX - rowRect.left;
      // 滑鼠位置減去拖曳起始的偏移 = 卡片左緣應該對齊的位置
      const blockStartCell = (dropX / cellPx) - cellOffsetInBlock;
      // snap 到 30 分鐘格（向下取整）
      const cellIdx = Math.max(0, Math.round(blockStartCell));
      const newStartMin = range.start + cellIdx * range.step;
      const newStart = Utils.minutesToTime(newStartMin);

      _moveCase(caseId, vehicle.id, newStart);
    };
  }

  /** 移動案件（含衝突檢查與類型相容檢查）*/
  function _moveCase(caseId, newVehicleId, newStart) {
    const c = MockData.CASES.find(x => x.id === caseId);
    if (!c) return;

    // 沒變化 → 不動
    if (c.vehicleId === newVehicleId && c.start === newStart) return;

    // 1. 車輛類型相容檢查
    const allowedTypes = MockData.getVehicleAllowedTypes(newVehicleId);
    if (!allowedTypes.includes(c.type)) {
      const v = MockData.VEHICLES.find(x => x.id === newVehicleId);
      alert(`⚠️ ${v.name}（${v.type}車）無法接「${c.type}」案件`);
      return;
    }

    // 2. 工作時間檢查
    const range = State.get('timeRange');
    const startMin = Utils.timeToMinutes(newStart);
    if (startMin + c.duration > range.end) {
      alert(`⚠️ 超出工作時間（${Utils.minutesToTime(range.end)}）`);
      return;
    }

    // 3. 衝突檢查
    const sameVehicleCases = MockData.CASES.filter(x =>
      x.vehicleId === newVehicleId &&
      x.id !== caseId &&
      x.date === State.get('currentDate')
    );
    const conflict = sameVehicleCases.find(x => {
      const xStart = Utils.timeToMinutes(x.start);
      const xEnd = xStart + x.duration;
      return !(startMin + c.duration <= xStart || startMin >= xEnd);
    });

    if (conflict) {
      const conflictEnd = Utils.minutesToTime(Utils.timeToMinutes(conflict.start) + conflict.duration);
      const ok = confirm(
        `⚠️ 與「${conflict.customer}」(${conflict.start} - ${conflictEnd}) 時段衝突\n\n` +
        `按【確定】仍要放下（兩個案件會視覺重疊）\n` +
        `按【取消】放棄這次拖曳`
      );
      if (!ok) return;
    }

    // 4. ⭐ 寫到 DB
    DataWriter.updateCaseSchedule(c.id, {
      vehicleCode: newVehicleId,
      start:       newStart,
    }).then(() => {
      // 5. DB 成功才更新前端 + 重新渲染
      c.vehicleId = newVehicleId;
      c.start = newStart;
      render();
      if (typeof AllVehiclesMap !== 'undefined' && AllVehiclesMap.markStale) {
        AllVehiclesMap.markStale();
      }
    }).catch(err => {
      console.error('[timeline] moveCase failed:', err);
      alert('儲存到 DB 失敗：' + err.message);
    });
  }

  return { render };
})();
