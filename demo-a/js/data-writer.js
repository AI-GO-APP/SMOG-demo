/**
 * data-writer.js
 *
 * Supabase 寫入操作 (INSERT / UPDATE / DELETE) 的 wrapper。
 * 統一管理 enum 中→英對應、UUID lookup、錯誤處理。
 *
 * 用法（在 component 裡）：
 *   await DataWriter.createCase({...});
 *   await DataWriter.updateCaseStatus(caseId, 'work_completed');
 *
 * 注意：所有 ID 參數
 *   - 'V1', 'P1', 'C001'：前端用的 code（字串）
 *   - DataWriter 內部會自動換成 DB UUID
 */

const DataWriter = (() => {

  // ============ 中文 → 英文 enum 對應（前端 → DB）============
  const REVERSE_MAP = {
    vehicle_type: {
      '丈量':   'measurement',
      '施作':   'installation',
      '兩用':   'both',
    },
    case_type: {
      '現場丈量': 'measurement_on_site',
      '線上丈量': 'measurement_online',
      '施作':     'installation',
    },
    case_status: {
      '諮詢中':   'inquiry',
      '已排丈量': 'measurement_scheduled',
      '已丈量':   'measured',
      '等待報價': 'awaiting_quote',
      '已報價':   'quoted',
      '待付訂金': 'awaiting_deposit',
      '待排施作': 'awaiting_schedule',
      '已成交':   'awaiting_schedule',  // mock 舊名 → 新名
      '已排施作': 'work_scheduled',
      '施作中':   'work_in_progress',
      '已完工':   'work_completed',
      '跳票':     'no_show',
      '後補名單': 'awaiting_schedule',  // 舊名 → 新名（搭配 is_waiting_earlier=true）
      '已取消':   'cancelled',
    },
    case_source: {
      'LINE':       'line_official',
      '電話':       'phone',
      '介紹':       'referral',
      '直接上門':   'walk_in',
      '官網':       'website',
      '其他':       'other',
    },
    skill_type: {
      '丈量':   'measurement',
      '施作':   'installation',
    },
    shift_status: {
      '上班':   'on_duty',
      '休假':   'off_duty',
      '加班':   'overtime',
      '特休':   'annual_leave',
      '事假':   'personal_leave',
      '病假':   'sick_leave',
    },
  };

  function reverseEnum(category, value) {
    return (REVERSE_MAP[category] || {})[value] || value;
  }

  // ============ 內部 helper：code → DB UUID 查詢 ============
  async function _vehicleIdByCode(code) {
    if (!code) return null;
    // 先用 mock 快取（讀 _dbId）
    const v = MockData.VEHICLES.find(x => x.id === code);
    if (v && v._dbId) return v._dbId;

    // fallback 查 DB
    const { data, error } = await SupabaseClient
      .from('vehicles')
      .select('id')
      .eq('code', code)
      .single();
    if (error) throw error;
    return data?.id;
  }

  async function _technicianIdByCode(code) {
    if (!code) return null;
    const p = MockData.PEOPLE.find(x => x.id === code);
    if (p && p._dbId) return p._dbId;

    const { data, error } = await SupabaseClient
      .from('technicians')
      .select('id')
      .eq('code', code)
      .single();
    if (error) throw error;
    return data?.id;
  }

  async function _caseIdByCode(code) {
    if (!code) return null;
    const c = MockData.CASES.find(x => x.id === code);
    if (c && c._dbId) return c._dbId;

    const { data, error } = await SupabaseClient
      .from('cases')
      .select('id')
      .eq('code', code)
      .single();
    if (error) throw error;
    return data?.id;
  }

  async function _customerIdByPhone(phone) {
    if (!phone) return null;
    const { data, error } = await SupabaseClient
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (error) throw error;
    return data?.id;
  }

  async function _defaultLocationId(preferredCode) {
    // 1. 優先用呼叫方指定的 code（新增諮詢時客服選的分區）
    // 2. 否則 fallback 到 currentLocations 第一個
    // 3. 否則 'taoyuan'
    let code = preferredCode || 'taoyuan';
    if (!preferredCode) {
      const curs = State.get && State.get('currentLocations');
      if (Array.isArray(curs) && curs.length > 0) code = curs[0];
      const old = State.get && State.get('currentLocation');
      if (old && old !== 'all') code = old;
    }
    const { data, error } = await SupabaseClient
      .from('company_locations')
      .select('id')
      .eq('code', code)
      .single();
    if (error) throw error;
    return data?.id;
  }

  // ============ Customers ============

  /**
   * 建立或取回客戶（同 phone 視為同一人）
   * @param {{name, phone, lineId?, lineName?, address?, city?, district?, lat?, lng?}} data
   * @returns {Promise<string>} customer.id (UUID)
   */
  async function upsertCustomer(data) {
    if (!data.phone) throw new Error('upsertCustomer: phone 必填');
    if (!data.name)  throw new Error('upsertCustomer: name 必填');

    // 先看是否已存在
    const existingId = await _customerIdByPhone(data.phone);
    if (existingId) {
      // 既有客戶 → 若有提供 briefing_attended_at 就更新
      if (data.briefingAttendedAt) {
        await SupabaseClient
          .from('customers')
          .update({ briefing_attended_at: data.briefingAttendedAt })
          .eq('id', existingId);
      }
      return existingId;
    }

    // 不存在 → INSERT
    const lineId   = data.lineId   || `LINE_${data.phone.replace(/[^0-9]/g, '')}`;
    const lineName = data.lineName || data.name;

    const { data: inserted, error } = await SupabaseClient
      .from('customers')
      .insert({
        name:                  data.name,
        phone:                 data.phone,
        line_id:               lineId,
        line_name:             lineName,
        address:               data.address  || null,
        city:                  data.city     || null,
        district:              data.district || null,
        lat:                   data.lat      || null,
        lng:                   data.lng      || null,
        briefing_attended_at:  data.briefingAttendedAt || null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return inserted.id;
  }

  // ============ Cases ============

  /**
   * 建立案件
   * @param {object} data 來自前端（mock 格式）
   *   { code, customer:{name, phone}, address, city, district, lat, lng,
   *     type:'現場丈量'|...,  status:'諮詢中'|...,  source:'LINE'|...,
   *     vehicleId?:'V1', date?:'2026-05-08', start?:'09:00',
   *     duration?:60, amount?:0, notes?:'' }
   * @returns {Promise<string>} case.id (UUID)
   */
  async function createCase(data) {
    if (!data.code)     throw new Error('createCase: code 必填');
    if (!data.customer) throw new Error('createCase: customer 必填');

    const customerId   = await upsertCustomer({
      name:                data.customer.name || data.customer,
      phone:               data.customer.phone || data.phone,
      address:             data.address,
      city:                data.city,
      district:            data.district,
      lat:                 data.lat,
      lng:                 data.lng,
      briefingAttendedAt:  data.briefingAttendedAt,
    });
    const locationId   = await _defaultLocationId(data.locationCode);
    const vehicleDbId  = data.vehicleId ? await _vehicleIdByCode(data.vehicleId) : null;

    const insertData = {
      code:               data.code,
      customer_id:        customerId,
      location_id:        locationId,
      address:            data.address      || '',
      city:               data.city         || null,
      district:           data.district     || null,
      lat:                data.lat          || null,
      lng:                data.lng          || null,
      case_type:          reverseEnum('case_type',   data.type),
      status:             reverseEnum('case_status', data.status || '諮詢中'),
      source:             reverseEnum('case_source', data.source || 'LINE'),
      duration_minutes:   data.duration     || 60,
      vehicle_id:         vehicleDbId,
      scheduled_date:     data.date  || null,
      scheduled_start:    data.start || null,
      estimated_amount:   data.amount       || null,
      notes:              data.notes        || null,
      is_confirmed:       !!(data.vehicleId && data.start),  // 已派車且有時間 = 已確認
      case_nature:        data.caseNature || 'normal',
      venue_type:         data.venueType || null,
      floor_plan:         data.floorPlan || null,
    };

    // 社區 / 團購 FK 解析 (用 code 找 _dbId)
    if (data.communityCode) {
      const community = (MockData.COMMUNITIES || []).find(c => c.code === data.communityCode);
      if (community && community._dbId) insertData.community_id = community._dbId;
    }
    if (data.groupPurchaseCode) {
      const gp = (MockData.GROUP_PURCHASES || []).find(g => g.code === data.groupPurchaseCode);
      if (gp && gp._dbId) insertData.group_purchase_id = gp._dbId;
    }

    // 注意 schema CHECK：scheduled_date / scheduled_start 必須一起 NULL 或一起 NOT NULL
    if (!insertData.scheduled_date) insertData.scheduled_start = null;
    if (!insertData.scheduled_start) insertData.scheduled_date = null;

    const { data: inserted, error } = await SupabaseClient
      .from('cases')
      .insert(insertData)
      .select('id, code')
      .single();

    if (error) throw error;
    console.log(`[DataWriter] case ${inserted.code} created (UUID=${inserted.id})`);
    return inserted.id;
  }

  /**
   * 更新案件狀態（支援中文或英文 status）
   * @param {string} caseCode 例如 'C001'
   * @param {string} newStatus 例如 '已完工' 或 'work_completed'
   */
  async function updateCaseStatus(caseCode, newStatus) {
    const caseDbId = await _caseIdByCode(caseCode);
    if (!caseDbId) throw new Error(`updateCaseStatus: 找不到 case ${caseCode}`);

    const dbStatus = reverseEnum('case_status', newStatus);

    const updates = { status: dbStatus };

    // 變回「諮詢中」或「已取消」→ 清空排程資訊（從時間軸移除）
    if (dbStatus === 'inquiry' || dbStatus === 'cancelled') {
      updates.vehicle_id = null;
      updates.scheduled_date = null;
      updates.scheduled_start = null;
      updates.is_confirmed = false;
    }

    const { error } = await SupabaseClient
      .from('cases')
      .update(updates)
      .eq('id', caseDbId);

    if (error) throw error;
    console.log(`[DataWriter] case ${caseCode} status → ${dbStatus}`, updates);
  }

  /**
   * 更新案件的派車 / 時間（用於拖曳）
   * @param {string} caseCode
   * @param {{vehicleCode?:string, date?:string, start?:string, duration?:number}} updates
   */
  async function updateCaseSchedule(caseCode, updates) {
    const caseDbId = await _caseIdByCode(caseCode);
    if (!caseDbId) throw new Error(`updateCaseSchedule: 找不到 case ${caseCode}`);

    const updateData = {};
    if (updates.vehicleCode !== undefined) {
      updateData.vehicle_id = updates.vehicleCode ? await _vehicleIdByCode(updates.vehicleCode) : null;
    }
    if (updates.date !== undefined)     updateData.scheduled_date  = updates.date  || null;
    if (updates.start !== undefined)    updateData.scheduled_start = updates.start || null;
    if (updates.duration !== undefined) updateData.duration_minutes = updates.duration;

    // 維持 CHECK：date / start 必須一起 NULL 或一起 NOT NULL
    if (updateData.scheduled_date && !updateData.scheduled_start) updateData.scheduled_start = '09:00';
    if (updateData.scheduled_start && !updateData.scheduled_date) updateData.scheduled_date  = new Date().toISOString().slice(0, 10);

    const { error } = await SupabaseClient
      .from('cases')
      .update(updateData)
      .eq('id', caseDbId);

    if (error) throw error;
    console.log(`[DataWriter] case ${caseCode} schedule updated`, updateData);
  }

  /**
   * 通用：更新案件任意欄位（小心使用，欄位名要直接是 DB 名稱）
   */
  async function updateCaseRaw(caseCode, dbFields) {
    const caseDbId = await _caseIdByCode(caseCode);
    if (!caseDbId) throw new Error(`updateCaseRaw: 找不到 case ${caseCode}`);

    const { error } = await SupabaseClient
      .from('cases')
      .update(dbFields)
      .eq('id', caseDbId);

    if (error) throw error;
    console.log(`[DataWriter] case ${caseCode} raw update`, dbFields);
  }

  /**
   * 軟刪除案件
   */
  async function deleteCase(caseCode) {
    const caseDbId = await _caseIdByCode(caseCode);
    if (!caseDbId) throw new Error(`deleteCase: 找不到 case ${caseCode}`);

    const { error } = await SupabaseClient
      .from('cases')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', caseDbId);

    if (error) throw error;
    console.log(`[DataWriter] case ${caseCode} soft deleted`);
  }

  // ============ Vehicles ============

  async function createVehicle(data) {
    if (!data.id || !data.name) throw new Error('createVehicle: id (code) 與 name 必填');
    console.log('[DW.createVehicle] start, data =', data);

    const locationId = await _defaultLocationId();
    console.log('[DW.createVehicle] locationId =', locationId);

    const insertPayload = {
      code:        data.id,
      name:        data.name,
      type:        reverseEnum('vehicle_type', data.type),
      color:       data.color || '#0284C7',
      location_id: locationId,
    };
    console.log('[DW.createVehicle] INSERT payload =', insertPayload);

    const result = await SupabaseClient
      .from('vehicles')
      .insert(insertPayload)
      .select('id, code')
      .single();

    console.log('[DW.createVehicle] supabase response =', result);

    if (result.error) {
      console.error('[DW.createVehicle] ERROR:', result.error);
      throw result.error;
    }
    if (!result.data) {
      throw new Error('INSERT 沒回傳 row（可能 RLS 阻擋 SELECT）');
    }
    console.log(`[DataWriter] ✅ vehicle ${result.data.code} created (UUID=${result.data.id})`);
    return result.data.id;
  }

  async function updateVehicle(code, updates) {
    const vehicleDbId = await _vehicleIdByCode(code);
    if (!vehicleDbId) throw new Error(`updateVehicle: 找不到 ${code}`);

    const updateData = {};
    if (updates.name)  updateData.name  = updates.name;
    if (updates.type)  updateData.type  = reverseEnum('vehicle_type', updates.type);
    if (updates.color) updateData.color = updates.color;

    const { error } = await SupabaseClient
      .from('vehicles')
      .update(updateData)
      .eq('id', vehicleDbId);

    if (error) throw error;
    console.log(`[DataWriter] vehicle ${code} updated`);
  }

  async function deleteVehicle(code) {
    const vehicleDbId = await _vehicleIdByCode(code);
    if (!vehicleDbId) throw new Error(`deleteVehicle: 找不到 ${code}`);

    const { error } = await SupabaseClient
      .from('vehicles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', vehicleDbId);

    if (error) throw error;
    console.log(`[DataWriter] vehicle ${code} soft deleted`);
  }

  // ============ Technicians ============

  async function createTechnician(data) {
    if (!data.id || !data.name) throw new Error('createTechnician: id (code) 與 name 必填');
    const locationId = await _defaultLocationId();

    const skillsEn = (data.skills || []).map(s => reverseEnum('skill_type', s));

    const { data: inserted, error } = await SupabaseClient
      .from('technicians')
      .insert({
        code:        data.id,
        name:        data.name,
        phone:       data.phone || null,
        skills:      skillsEn,
        location_id: locationId,
      })
      .select('id, code')
      .single();

    if (error) throw error;
    console.log(`[DataWriter] technician ${inserted.code} created`);
    return inserted.id;
  }

  async function updateTechnician(code, updates) {
    const dbId = await _technicianIdByCode(code);
    if (!dbId) throw new Error(`updateTechnician: 找不到 ${code}`);

    const updateData = {};
    if (updates.name)   updateData.name  = updates.name;
    if (updates.phone)  updateData.phone = updates.phone;
    if (updates.skills) updateData.skills = updates.skills.map(s => reverseEnum('skill_type', s));

    const { error } = await SupabaseClient
      .from('technicians')
      .update(updateData)
      .eq('id', dbId);

    if (error) throw error;
    console.log(`[DataWriter] technician ${code} updated`);
  }

  async function deleteTechnician(code) {
    const dbId = await _technicianIdByCode(code);
    if (!dbId) throw new Error(`deleteTechnician: 找不到 ${code}`);

    const { error } = await SupabaseClient
      .from('technicians')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', dbId);

    if (error) throw error;
    console.log(`[DataWriter] technician ${code} soft deleted`);
  }

  // ============ Daily Assignments ============

  /**
   * 重設某天某車的搭配人員（簡單做法：先刪舊的、再插新的）
   * @param {string} vehicleCode 'V1'
   * @param {string} dateStr     'YYYY-MM-DD'
   * @param {Array<{personCode:string, isDriver?:boolean}>} assignments
   */
  async function setDailyAssignment(vehicleCode, dateStr, assignments) {
    const vehicleDbId = await _vehicleIdByCode(vehicleCode);
    if (!vehicleDbId) throw new Error(`setDailyAssignment: 找不到 vehicle ${vehicleCode}`);

    // 刪舊的
    const { error: delErr } = await SupabaseClient
      .from('daily_assignments')
      .delete()
      .eq('vehicle_id', vehicleDbId)
      .eq('assignment_date', dateStr);
    if (delErr) throw delErr;

    // 插新的
    if (assignments.length === 0) return;

    const rows = await Promise.all(
      assignments.map(async a => ({
        vehicle_id:      vehicleDbId,
        technician_id:   await _technicianIdByCode(a.personCode),
        assignment_date: dateStr,
        is_driver:       !!a.isDriver,
      }))
    );

    const { error: insErr } = await SupabaseClient
      .from('daily_assignments')
      .insert(rows);
    if (insErr) throw insErr;

    console.log(`[DataWriter] daily_assignment for ${vehicleCode}@${dateStr} set: ${rows.length} 人`);
  }

  /**
   * 複製某天的 daily_assignments 到另一天
   * @param {string} srcDate 'YYYY-MM-DD' 來源日（例如昨天）
   * @param {string} destDate 'YYYY-MM-DD' 目標日（例如今天）
   * @returns {Promise<number>} 複製的筆數
   */
  async function copyDailyAssignments(srcDate, destDate) {
    // 1. 拿來源日的所有配對
    const { data: srcRows, error: srcErr } = await SupabaseClient
      .from('daily_assignments')
      .select('vehicle_id, technician_id, is_driver')
      .eq('assignment_date', srcDate);
    if (srcErr) throw srcErr;
    if (!srcRows || srcRows.length === 0) {
      throw new Error(`${srcDate} 沒有任何車↔人配對`);
    }

    // 2. 刪掉目標日現有的配對
    const { error: delErr } = await SupabaseClient
      .from('daily_assignments')
      .delete()
      .eq('assignment_date', destDate);
    if (delErr) throw delErr;

    // 3. INSERT 新的配對
    const newRows = srcRows.map(r => ({
      vehicle_id:      r.vehicle_id,
      technician_id:   r.technician_id,
      assignment_date: destDate,
      is_driver:       r.is_driver,
    }));

    const { error: insErr } = await SupabaseClient
      .from('daily_assignments')
      .insert(newRows);
    if (insErr) throw insErr;

    console.log(`[DataWriter] copyDailyAssignments: ${srcDate} → ${destDate} (${newRows.length} 筆)`);
    return newRows.length;
  }

  // ============ Shifts ============

  /**
   * 設定某人某天的班別
   * @param {string} personCode 'P1'
   * @param {string} dateStr 'YYYY-MM-DD'
   * @param {string} status 中文或英文，例如 '上班' / 'on_duty'
   * @param {{start:string, end:string}=} overtime 加班時段
   */
  async function setShift(personCode, dateStr, status, overtime) {
    const personDbId = await _technicianIdByCode(personCode);
    if (!personDbId) throw new Error(`setShift: 找不到 ${personCode}`);

    const dbStatus = reverseEnum('shift_status', status);

    const upsertData = {
      technician_id:  personDbId,
      shift_date:     dateStr,
      status:         dbStatus,
      overtime_start: overtime?.start || null,
      overtime_end:   overtime?.end   || null,
    };

    const { error } = await SupabaseClient
      .from('technician_shifts')
      .upsert(upsertData, { onConflict: 'technician_id,shift_date' });

    if (error) throw error;
    console.log(`[DataWriter] shift ${personCode}@${dateStr} → ${dbStatus}`);
  }

  // ============ 對外 API ============

  return {
    // 客戶
    upsertCustomer,
    // 案件
    createCase,
    updateCaseStatus,
    updateCaseSchedule,
    updateCaseRaw,
    deleteCase,
    // 車輛
    createVehicle,
    updateVehicle,
    deleteVehicle,
    // 師傅
    createTechnician,
    updateTechnician,
    deleteTechnician,
    // 每日分派
    setDailyAssignment,
    copyDailyAssignments,
    // 班表
    setShift,
    // helper
    reverseEnum,
  };
})();

window.DataWriter = DataWriter;
