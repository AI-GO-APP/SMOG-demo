/**
 * components/new-inquiry-modal.js
 * 「+ 新增諮詢」表單 - 比新增案件簡化
 *
 * 流程：
 *   建立 status='諮詢中' 的案件，沒有 vehicleId/start
 *   進到「未排案件」、「案件看板」中可看到
 *   後續客服可以拖卡片改狀態，不會建立新卡片
 */

const NewInquiryModal = (() => {

  const MODAL_ID = 'new-inquiry-modal';

  function open() {
    _ensureModal();
    document.getElementById('new-inquiry-form').reset();
    document.getElementById(MODAL_ID).style.display = 'flex';
  }

  function close() {
    const el = document.getElementById(MODAL_ID);
    if (el) el.style.display = 'none';
  }

  function _ensureModal() {
    // 每次重建避免 cache 殘留舊 HTML
    const existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();

    const root = document.getElementById('modal-root');
    const div = document.createElement('div');
    div.id = MODAL_ID;
    div.className = 'modal-overlay';
    div.style.display = 'none';
    div.innerHTML = `
      <div class="modal-content" style="padding:24px; max-width:980px; max-height:90vh; overflow-y:auto;">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:16px;">
          <div>
            <h2 style="font-size:var(--fs-lg); font-weight:700;">+ 新增諮詢</h2>
            <p style="font-size:var(--fs-xs); color:var(--c-text-mute); margin-top:2px;">客戶剛進線、還沒約時間 · 進到「未排案件」</p>
          </div>
          <button class="close-btn" style="background:none; border:none; font-size:24px; color:#9CA3AF; cursor:pointer;">×</button>
        </div>
        <form id="new-inquiry-form" style="display:flex; flex-direction:column; gap:14px;"><div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">

          <!-- 區塊 1: 客戶資訊 -->
          <section class="form-section">
            <div class="form-section-title">👤 客戶資訊</div>
            <div class="form-section-body" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label class="form-label">客戶姓名 *</label>
                <input type="text" name="customer" required placeholder="王小姐" class="form-input" />
              </div>
              <div>
                <label class="form-label">電話 *</label>
                <input type="text" name="phone" required placeholder="0912-345-678" class="form-input" />
              </div>
              <div>
                <label class="form-label">來源 *</label>
                <select name="source" class="form-input">
                  <option value="LINE">LINE</option>
                  <option value="電話">電話</option>
                  <option value="官網">官網</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label class="form-label">參加說明會 / 1對1 時間</label>
                <input type="date" name="briefing_attended_at" class="form-input" id="inquiry-briefing-input" />
                <div class="form-hint">有時間 = 舊客戶 (丈量 60 分)</div>
              </div>
            </div>
          </section>

          <!-- 區塊 2: 案件資訊 -->
          <section class="form-section">
            <div class="form-section-title">📋 案件資訊</div>
            <div class="form-section-body" style="display:flex; flex-direction:column; gap:12px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div>
                  <label class="form-label">服務類型 *</label>
                  <select name="type" class="form-input" id="inquiry-type-select">
                    <option value="現場丈量">現場丈量</option>
                    <option value="線上丈量">線上丈量</option>
                    <option value="施作">施作（直接）</option>
                  </select>
                </div>
                <div id="inquiry-measure-extra">
                  <label class="form-label">案件性質 *</label>
                  <select name="case_nature" class="form-input" id="inquiry-nature-select">
                    <option value="normal">一般</option>
                    <option value="house">透天</option>
                    <option value="two_household">兩戶</option>
                    <option value="neighbors_combined">鄰居一起</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="form-label">服務地址 *</label>
                <input type="text" name="address" required placeholder="例：台北市信義區信義路五段100號" class="form-input" id="inquiry-address-input" />
                <div style="display:flex; gap:8px; align-items:center; margin-top:6px;">
                  <label class="form-hint" style="white-space:nowrap;">快選 (測試)：</label>
                  <select class="form-input" id="inquiry-address-quick" style="font-size:13px;">
                    <option value="">-- 不使用 --</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="form-label">服務分區 *</label>
                <select name="branch" id="inquiry-branch-select" required class="form-input">
                  <option value="">-- 請選擇分區 --</option>
                </select>
                <div id="inquiry-branch-hint" class="form-hint">系統會依地址自動偵測最近分區</div>
              </div>
            </div>
          </section>

          <!-- 區塊 3: 排程資訊 -->
          <section class="form-section">
            <div class="form-section-title">⏰ 排程資訊</div>
            <div class="form-section-body" style="display:flex; flex-direction:column; gap:12px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div>
                  <label class="form-label">客戶期望日期</label>
                  <input type="date" name="preferred_date" class="form-input" id="inquiry-preferred-date" />
                  <div class="form-hint">空白 = 客戶說「都可以」</div>
                </div>
                <div>
                  <label class="form-label">客戶期望開始時段</label>
                  <select name="preferred_start" class="form-input" id="inquiry-preferred-start">
                    <option value="">-- 不指定 --</option>
                    <option value="10:00">10:00</option>
                  <option value="10:30">10:30</option>
                  <option value="11:00">11:00</option>
                  <option value="11:30">11:30</option>
                  <option value="12:00">12:00</option>
                  <option value="12:30">12:30</option>
                  <option value="13:00">13:00</option>
                  <option value="13:30">13:30</option>
                  <option value="14:00">14:00</option>
                  <option value="14:30">14:30</option>
                  <option value="15:00">15:00</option>
                  <option value="15:30">15:30</option>
                  <option value="16:00">16:00</option>
                  </select>
                  <div class="form-hint">10:00 ~ 16:00 半小時為單位</div>
                </div>
              </div>

              <div>
                <label class="form-label">客服預估丈量時長（選填，覆蓋系統建議）</label>
                <select name="cs_estimated_duration" class="form-input" id="inquiry-cs-duration">
                  <option value="">-- 使用系統建議 --</option>
                  <option value="60">1 小時</option>
                  <option value="90">1.5 小時</option>
                  <option value="120">2 小時</option>
                  <option value="150">2.5 小時</option>
                  <option value="180">3 小時</option>
                  <option value="210">3.5 小時</option>
                  <option value="240">4 小時</option>
                </select>
              </div>

              <div id="inquiry-duration-hint" style="background:#F0FDF4; border-left:3px solid #10B981; padding:10px 12px; font-size:13px; color:#166534; border-radius:4px;">
                <div>⏱️ 系統推薦：<span id="inquiry-duration-system">90 分 (一般完整丈量)</span></div>
                <div style="margin-top:4px;">✅ 實際採用：<strong id="inquiry-duration-final">90 分</strong></div>
              </div>
            </div>
          </section>

          <!-- 區塊 4: 備註 -->
          <section class="form-section">
            <div class="form-section-title">📝 備註</div>
            <div class="form-section-body">
              <textarea name="notes" rows="2" placeholder="例：3面紗窗、有陽台、需要評估" class="form-input"></textarea>
            </div>
          </section>

          </div>  <!-- 關閉 2 欄 grid -->

          <div style="background:#EFF6FF; border-left:3px solid #3B82F6; padding:8px 12px; font-size:12px; color:#1E40AF; border-radius:4px;">
            💡 送出後在「📋 未排案件」與「🗂️ 案件看板」看到此筆，狀態 = <strong>諮詢中</strong>
          </div>

          <div style="display:flex; justify-content:space-between; padding-top:8px; border-top:1px solid var(--c-border);">
            <button type="button" class="close-btn btn-secondary">取消</button>
            <button type="submit" class="btn-primary">建立諮詢</button>
          </div>
        </form>
      </div>
    `;
    root.appendChild(div);

    // 填充「快選常用地址」下拉
    const addrInput = div.querySelector('#inquiry-address-input');
    const quickSel = div.querySelector('#inquiry-address-quick');
    const branchSel = div.querySelector('#inquiry-branch-select');
    const branchHint = div.querySelector('#inquiry-branch-hint');

    MockData.SAMPLE_ADDRESSES.forEach(a => {
      const o = document.createElement('option');
      o.value = a.addr;
      o.textContent = a.addr;
      quickSel.appendChild(o);
    });

    // 填充分區下拉
    (MockData.LOCATIONS || []).forEach(l => {
      const o = document.createElement('option');
      o.value = l.code;
      o.textContent = l.name;
      branchSel.appendChild(o);
    });

    /** 從 lat/lng 推算最近分區 */
    function _detectNearestBranch(lat, lng) {
      const locs = (MockData.LOCATIONS || []).filter(l => l.lat && l.lng);
      if (locs.length === 0 || !lat || !lng) return null;
      let nearest = null;
      let minDist = Infinity;
      locs.forEach(l => {
        const d = Utils.distanceKm({lat, lng}, {lat: l.lat, lng: l.lng});
        if (d < minDist) {
          minDist = d;
          nearest = l;
        }
      });
      return { branch: nearest, distance: minDist };
    }

    /** 嘗試偵測地址對應的分區（從 SAMPLE_ADDRESSES 找匹配的 lat/lng）*/
    function _tryDetectBranch(address) {
      if (!address) return;
      const sample = MockData.SAMPLE_ADDRESSES.find(s => s.addr === address);
      if (!sample || !sample.lat) {
        // 找不到精確匹配 → 從地址文字推測（簡單字串比對）
        const cityMatch = (addr) => {
          if (addr.includes('桃園') || addr.includes('中壢') || addr.includes('八德') || addr.includes('龜山')) return 'taoyuan';
          if (addr.includes('台中')) return 'taichung';
          if (addr.includes('台南')) return 'tainan';
          if (addr.includes('高雄')) return 'kaohsiung';
          // 台北 / 新北 預設給桃園處理（最近分部）
          if (addr.includes('台北') || addr.includes('新北') || addr.includes('基隆') || addr.includes('宜蘭')) return 'taoyuan';
          return null;
        };
        const code = cityMatch(address);
        if (code) {
          const branch = (MockData.LOCATIONS || []).find(l => l.code === code);
          if (branch) {
            branchSel.value = code;
            branchHint.textContent = `🔍 從地址字面推測：${branch.name}（可手動更改）`;
            branchHint.style.color = '#0891B2';
          }
        }
        return;
      }
      const result = _detectNearestBranch(sample.lat, sample.lng);
      if (result && result.branch) {
        branchSel.value = result.branch.code;
        branchHint.textContent = `🔍 已自動帶入：${result.branch.name}（距離 ${result.distance.toFixed(1)} km）`;
        branchHint.style.color = '#059669';
      }
    }

    // 選擇快選時：填地址 + 自動偵測分區
    quickSel.onchange = () => {
      if (quickSel.value) {
        addrInput.value = quickSel.value;
        _tryDetectBranch(quickSel.value);
      }
    };

    // 手動輸入地址後（blur 觸發），也嘗試自動偵測
    addrInput.onblur = () => {
      if (addrInput.value && !branchSel.value) {
        _tryDetectBranch(addrInput.value);
      }
    };

    div.querySelectorAll('.close-btn').forEach(b => b.onclick = close);

    // ========== 預估時長即時計算 ==========
    const typeSel    = div.querySelector('#inquiry-type-select');
    const natureSel  = div.querySelector('#inquiry-nature-select');
    const briefIn    = div.querySelector('#inquiry-briefing-input');
    const csDurSel   = div.querySelector('#inquiry-cs-duration');
    const measureExt = div.querySelector('#inquiry-measure-extra');
    const durSystem  = div.querySelector('#inquiry-duration-system');
    const durFinal   = div.querySelector('#inquiry-duration-final');

    function calcSystemDuration(type, nature, briefingDate) {
      if (type === '線上丈量') return { min: 30, label: '30 分 (線上)' };
      if (type === '施作')     return { min: 90, label: '90 分 (施作)' };
      if (nature && nature !== 'normal') {
        const map = { house: '透天', two_household: '兩戶', neighbors_combined: '鄰居一起' };
        return { min: 120, label: `120 分 (${map[nature] || nature})` };
      }
      if (briefingDate) return { min: 60, label: '60 分 (舊客戶)' };
      return { min: 90, label: '90 分 (一般完整丈量)' };
    }

    function updateDurationHint() {
      const type   = typeSel.value;
      const nature = natureSel.value;
      const brief  = briefIn.value;
      const cs     = csDurSel.value;
      const sys = calcSystemDuration(type, nature, brief);
      durSystem.textContent = sys.label;

      let finalMin = sys.min;
      let finalLabel = sys.label.replace(/\(.*\)/, '').trim();
      if (cs) {
        finalMin = parseInt(cs);
        finalLabel = `${finalMin} 分 (客服指定)`;
      } else {
        finalLabel = `${sys.min} 分`;
      }
      durFinal.textContent = finalLabel;

      // 線上/施作 隱藏 案件性質
      const typeParent = typeSel.parentElement;
      if (type === '線上丈量' || type === '施作') {
        measureExt.style.display = 'none';
        if (typeParent) typeParent.style.gridColumn = '1 / -1';
      } else {
        measureExt.style.display = '';
        if (typeParent) typeParent.style.gridColumn = '';
      }
    }

    typeSel.onchange   = updateDurationHint;
    natureSel.onchange = updateDurationHint;
    briefIn.onchange   = updateDurationHint;
    csDurSel.onchange  = updateDurationHint;
    updateDurationHint();

    div.querySelector('#new-inquiry-form').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const addr = MockData.SAMPLE_ADDRESSES.find(a => a.addr === fd.get('address'));
      const today = new Date().toISOString().slice(0, 10);
      // 用 timestamp-based code 避免撞 unique key
      // 格式：I + YYYYMMDD + - + 6 位數字 (例: I20260513-345678)
      const todayStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
      const newId = 'I' + todayStr + '-' + Date.now().toString().slice(-6);

      const branchCode = fd.get('branch');
      const branchObj = (MockData.LOCATIONS || []).find(l => l.code === branchCode);

      const caseType = fd.get('type');
      const caseNature = fd.get('case_nature') || 'normal';
      const briefingDate = fd.get('briefing_attended_at') || null;
      const preferredDate = fd.get('preferred_date') || null;
      const preferredStart = fd.get('preferred_start') || null;
      const csEstimatedDuration = fd.get('cs_estimated_duration') || null;

      // 算 duration：客服手動 > 系統自動
      function _calcSysDur(type, nature, brief) {
        if (type === '線上丈量') return 30;
        if (type === '施作') return 90;
        if (nature && nature !== 'normal') return 120;
        if (brief) return 60;
        return 90;
      }
      const computedDuration = csEstimatedDuration
        ? parseInt(csEstimatedDuration)
        : _calcSysDur(caseType, caseNature, briefingDate);

      const newCase = {
        id: newId,
        vehicleId: null,
        start: null,
        date: today,
        type: caseType,
        duration: computedDuration,
        case_nature: caseNature,
        briefing_attended_at: briefingDate,
        preferred_date: preferredDate,
        preferred_start: preferredStart,
        cs_estimated_duration: csEstimatedDuration,
        customer: fd.get('customer'),
        phone: fd.get('phone'),
        address: fd.get('address'),
        lat: addr ? addr.lat : 0,
        lng: addr ? addr.lng : 0,
        status: '諮詢中',
        amount: 0,
        notes: fd.get('notes') || '',
        source: fd.get('source'),
        createdAt: today,
        locationCode: branchCode,
        locationName: branchObj ? branchObj.name : null,
      };

      const submitBtn = e.target.querySelector('button[type="submit"]');
      const origText = submitBtn.innerText;
      submitBtn.disabled = true;
      submitBtn.innerText = '建立中...';

      try {
        // ⭐ 寫到 DB
        const dbId = await DataWriter.createCase({
          code:        newId,
          locationCode: branchCode,
          customer: { name: newCase.customer, phone: newCase.phone },
          phone:    newCase.phone,
          address:  newCase.address,
          lat:      newCase.lat,
          lng:      newCase.lng,
          type:     newCase.type,
          status:   newCase.status,
          source:   newCase.source,
          duration:            newCase.duration,
          notes:               newCase.notes,
          caseNature:          caseNature,
          briefingAttendedAt:  briefingDate,
        });
        newCase._dbId = dbId;
        MockData.CASES.push(newCase);
        close();

        setTimeout(() => {
          if (confirm(`✅ 已建立諮詢：${newCase.customer}\n\n要立即跳到「📋 未排案件」查看嗎？`)) {
            Router.navigate('unscheduled');
          }
        }, 100);
      } catch (err) {
        console.error('[new-inquiry] createCase failed:', err);
        alert('儲存到 DB 失敗：' + err.message);
        submitBtn.disabled = false;
        submitBtn.innerText = origText;
      }
    };
  }

  return { open, close };
})();
