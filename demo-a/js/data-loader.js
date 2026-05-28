/**
 * data-loader.js
 *
 * 從 Supabase 載入資料 → 寫入 MockData 的同名變數
 * 這樣其他 page/component 不用改，繼續用 MockData.VEHICLES / MockData.CASES 等。
 *
 * 重要：DB 用英文 enum，前端 page 還在用中文 status，
 *      所以這裡會做 enum 中英對應。
 *
 * 還需要注意：
 *   - VEHICLES / PEOPLE / CASES 從 DB 完整覆蓋
 *   - SHIFTS 採「DB 覆蓋 mock」策略：DB 有的優先，DB 沒有的保留 mock 自動產生的
 *     （因為 DB 目前只塞今天的 9 筆班，但 demo 月曆要看當月所有日子）
 */

const DataLoader = (() => {

  // ============ Enum 中英對應（DB → 前端中文）============
  const ENUM_MAP = {
    vehicle_type: {
      'measurement':   '丈量',
      'installation':  '施作',
      'both':          '兩用',
    },
    case_type: {
      'measurement_on_site': '現場丈量',
      'measurement_online':  '線上丈量',
      'installation':        '施作',
    },
    case_status: {
      'inquiry':                '諮詢中',
      'measurement_scheduled':  '已排丈量',
      'measured':               '已丈量',
      'awaiting_quote':         '等待報價',
      'quoted':                 '已報價',
      'awaiting_deposit':       '待付訂金',
      'awaiting_schedule':      '待排施作',
      'work_scheduled':         '已排施作',
      'work_in_progress':       '施作中',
      'work_completed':         '已完工',
      'no_show':                '跳票',
      'cancelled':              '已取消',
    },
    case_source: {
      'line_official': 'LINE',
      'phone':         '電話',
      'referral':      '介紹',
      'walk_in':       '直接上門',
      'website':       '官網',
      'other':         '其他',
    },
    skill_type: {
      'measurement':  '丈量',
      'installation': '施作',
    },
    shift_status: {
      'on_duty':        '上班',
      'off_duty':       '休假',
      'overtime':       '加班',
      'annual_leave':   '特休',
      'personal_leave': '事假',
      'sick_leave':     '病假',
    },
  };

  function mapEnum(category, value) {
    return (ENUM_MAP[category] || {})[value] || value;
  }

  // ============ 個別 loader ============

  async function loadVehicles() {
    const { data, error } = await SupabaseClient
      .from('vehicles')
      .select('*, location:company_locations(code, name)')
      .is('deleted_at', null)
      .order('code');

    if (error) throw new Error(`loadVehicles: ${error.message}`);

    MockData.VEHICLES.length = 0;
    data.forEach(v => {
      MockData.VEHICLES.push({
        id:           v.code,
        _dbId:        v.id,
        name:         v.name,
        type:         mapEnum('vehicle_type', v.type),
        color:        v.color,
        locationCode: v.location?.code  || null,
        locationName: v.location?.name  || null,
      });
    });
    console.log(`[DataLoader] vehicles: ${MockData.VEHICLES.length} 筆`);
  }

  async function loadTechnicians() {
    const { data, error } = await SupabaseClient
      .from('technicians')
      .select('*, location:company_locations(code, name)')
      .is('deleted_at', null)
      .order('code');

    if (error) throw new Error(`loadTechnicians: ${error.message}`);

    MockData.PEOPLE.length = 0;
    data.forEach(t => {
      MockData.PEOPLE.push({
        id:           t.code,
        _dbId:        t.id,
        name:         t.name,
        skills:       (t.skills || []).map(s => mapEnum('skill_type', s)),
        vehicleId:    null,
        locationCode: t.location?.code || null,
        locationName: t.location?.name || null,
      });
    });
    console.log(`[DataLoader] technicians: ${MockData.PEOPLE.length} 筆`);
  }

  async function loadCases() {
    const { data, error } = await SupabaseClient
      .from('cases')
      .select(`
        *,
        customer:customers(name, phone, line_name),
        vehicle:vehicles(code, name),
        location:company_locations(code, name)
      `)
      .is('deleted_at', null)
      .order('code');

    if (error) throw new Error(`loadCases: ${error.message}`);

    MockData.CASES.length = 0;
    const today = new Date().toISOString().slice(0, 10);

    data.forEach(c => {
      MockData.CASES.push({
        id:         c.code,
        _dbId:      c.id,
        vehicleId:  c.vehicle?.code || null,
        date:       c.scheduled_date || today,
        start:      c.scheduled_start ? c.scheduled_start.slice(0, 5) : null,  // '09:00:00' → '09:00'
        duration:   c.duration_minutes,
        type:       mapEnum('case_type', c.case_type),
        customer:   c.customer?.name  || '',
        phone:      c.customer?.phone || '',
        address:    c.address,
        lat:        c.lat ? Number(c.lat) : 0,
        lng:        c.lng ? Number(c.lng) : 0,
        status:     mapEnum('case_status', c.status),
        amount:     c.estimated_amount ? Number(c.estimated_amount) : 0,
        notes:      c.notes || '',
        source:     mapEnum('case_source', c.source),
        createdAt:  c.created_at,
        locationCode: c.location?.code || null,
        locationName: c.location?.name || null,
        // v0.3 新欄位（未來給寫入功能用）
        isConfirmed:        c.is_confirmed,
        proposedSlots:      c.proposed_slots || [],
        releasedSlots:      c.released_slots || [],
        isWaitingEarlier:   c.is_waiting_earlier,
      });
    });
    console.log(`[DataLoader] cases: ${MockData.CASES.length} 筆`);
  }

  async function loadDailyAssignments() {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await SupabaseClient
      .from('daily_assignments')
      .select(`
        *,
        vehicle:vehicles(code),
        technician:technicians(code)
      `)
      .eq('assignment_date', today);

    if (error) throw new Error(`loadDailyAssignments: ${error.message}`);

    // 把 vehicleId 寫回 PEOPLE（mock 結構需要）
    data.forEach(a => {
      const personCode  = a.technician?.code;
      const vehicleCode = a.vehicle?.code;
      if (!personCode || !vehicleCode) return;

      const person = MockData.PEOPLE.find(p => p.id === personCode);
      if (person) {
        person.vehicleId = vehicleCode;
      }
    });
    console.log(`[DataLoader] daily_assignments: ${data.length} 筆 → 寫回 PEOPLE.vehicleId`);
  }

  /** 切日期時重載某天的 daily_assignments → 更新 PEOPLE.vehicleId */
  async function loadDailyAssignmentsForDate(dateStr) {
    const { data, error } = await SupabaseClient
      .from('daily_assignments')
      .select(`*, vehicle:vehicles(code), technician:technicians(code)`)
      .eq('assignment_date', dateStr);

    if (error) throw new Error(`loadDailyAssignmentsForDate(${dateStr}): ${error.message}`);

    // 清空所有 PEOPLE.vehicleId
    MockData.PEOPLE.forEach(p => { p.vehicleId = null; });
    // 寫回該天的配對
    data.forEach(a => {
      if (!a.technician?.code || !a.vehicle?.code) return;
      const p = MockData.PEOPLE.find(x => x.id === a.technician.code);
      if (p) p.vehicleId = a.vehicle.code;
    });
    console.log(`[DataLoader] daily_assignments(${dateStr}): ${data.length} 筆 → 重寫 PEOPLE.vehicleId`);
  }

  async function loadShifts() {
    const today = new Date();
    const yyyymm = today.toISOString().slice(0, 7);
    const startDate = `${yyyymm}-01`;

    const { data, error } = await SupabaseClient
      .from('technician_shifts')
      .select(`
        *,
        technician:technicians(code)
      `)
      .gte('shift_date', startDate);

    if (error) throw new Error(`loadShifts: ${error.message}`);

    // 採覆蓋策略：DB 有的覆蓋 mock，DB 沒的保留 mock
    let overrideCount = 0;
    let appendCount = 0;

    data.forEach(s => {
      if (!s.technician?.code) return;

      const personId = s.technician.code;
      const date     = s.shift_date;
      const status   = mapEnum('shift_status', s.status);

      const existing = MockData.SHIFTS.find(x => x.personId === personId && x.date === date);
      if (existing) {
        existing.status = status;
        if (s.overtime_start) {
          existing.overtime = { start: s.overtime_start.slice(0, 5), end: s.overtime_end?.slice(0, 5) };
        } else {
          delete existing.overtime;
        }
        overrideCount++;
      } else {
        const newShift = { personId, date, status };
        if (s.overtime_start) {
          newShift.overtime = { start: s.overtime_start.slice(0, 5), end: s.overtime_end?.slice(0, 5) };
        }
        MockData.SHIFTS.push(newShift);
        appendCount++;
      }
    });
    console.log(`[DataLoader] shifts: DB ${data.length} 筆（覆蓋 ${overrideCount}, 新增 ${appendCount}），mock 保留 ${MockData.SHIFTS.length - appendCount} 筆`);
  }


  async function loadCommunities() {
    const { data, error } = await SupabaseClient
      .from('communities')
      .select('*, location:company_locations(code, name)')
      .is('deleted_at', null)
      .order('code');
    if (error) {
      console.warn('[DataLoader] loadCommunities skipped:', error.message);
      MockData.COMMUNITIES = [];
      return;
    }
    MockData.COMMUNITIES = (data || []).map(c => ({
      id:           c.code || c.id,
      _dbId:        c.id,
      code:         c.code,
      name:         c.name,
      address:      c.address,
      city:         c.city,
      district:     c.district,
      lat:          c.lat ? Number(c.lat) : null,
      lng:          c.lng ? Number(c.lng) : null,
      locationCode: c.location?.code || null,
      locationName: c.location?.name || null,
    }));
    console.log(`[DataLoader] communities: ${MockData.COMMUNITIES.length} 筆`);
  }

  async function loadGroupPurchases() {
    const { data, error } = await SupabaseClient
      .from('group_purchases')
      .select('*')
      .is('deleted_at', null)
      .order('code');
    if (error) {
      console.warn('[DataLoader] loadGroupPurchases skipped:', error.message);
      MockData.GROUP_PURCHASES = [];
      return;
    }
    MockData.GROUP_PURCHASES = (data || []).map(g => ({
      id:    g.code || g.id,
      _dbId: g.id,
      code:  g.code,
      name:  g.name,
      notes: g.notes,
    }));
    console.log(`[DataLoader] group_purchases: ${MockData.GROUP_PURCHASES.length} 筆`);
  }

  // ============ 主入口 ============

  async function loadLocations() {
    const { data, error } = await SupabaseClient
      .from('company_locations')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw new Error(`loadLocations: ${error.message}`);

    MockData.LOCATIONS = (data || []).map(l => ({
      code: l.code,
      name: l.name,
      address: l.address,
      lat: l.lat ? Number(l.lat) : null,
      lng: l.lng ? Number(l.lng) : null,
    }));
    console.log(`[DataLoader] locations: ${MockData.LOCATIONS.length} 筆`);
  }

  async function loadAll() {
    if (!SupabaseClient) {
      throw new Error('SupabaseClient 沒初始化（檢查 supabase-client.js 跟 CDN）');
    }

    console.log('[DataLoader] 開始從 Supabase 載入資料...');
    const t0 = Date.now();

    // 順序：先載入 locations，再 vehicles + technicians
    await loadLocations();
    await Promise.all([
      loadVehicles(),
      loadTechnicians(),
    ]);

    // 然後 cases（不相依，可平行但只多一個 promise 太瑣碎）
    await loadCases();

    // daily_assignments 需要 PEOPLE 已載入（要寫回 vehicleId）
    await loadDailyAssignments();

    // shifts 獨立
    await loadShifts();

    // 對齊 Ragic schema 的新表
    await loadCommunities();
    await loadGroupPurchases();

    const elapsed = Date.now() - t0;
    console.log(`[DataLoader] ✅ 全部載入完成 (${elapsed}ms)`, {
      vehicles: MockData.VEHICLES.length,
      people:   MockData.PEOPLE.length,
      cases:    MockData.CASES.length,
      shifts:   MockData.SHIFTS.length,
    });
  }

  return {
    loadAll,
    loadLocations,
    loadCommunities,
    loadGroupPurchases,
    loadDailyAssignmentsForDate,
    mapEnum,
    ENUM_MAP,
  };
})();

window.DataLoader = DataLoader;
