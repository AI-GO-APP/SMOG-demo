/**
 * mock-data.js
 *
 * v0.2 變更：
 * - 新增 PEOPLE（人員獨立）
 * - VEHICLES 不再寫死 members 名稱，改用 PEOPLE.vehicleId 關聯
 * - 新增 SETTINGS（預設值）
 *
 * 真實開發時：這個檔會被「API call」或「DB query」取代
 */

const MockData = (() => {

  const HQ = { name: '桃園總部', lat: 24.9936, lng: 121.3010 };

  const SAMPLE_ADDRESSES = [
    // 原有（idx 0-9，順序不變，避免破壞既有 case 引用）
    { addr: '桃園市中壢區中央西路100號', lat: 24.9532, lng: 121.2235 },         // 0
    { addr: '桃園市八德區介壽路二段50號', lat: 24.9286, lng: 121.2849 },         // 1
    { addr: '桃園市龜山區萬壽路一段200號', lat: 25.0144, lng: 121.3471 },        // 2
    { addr: '新北市新莊區中正路500號', lat: 25.0419, lng: 121.4509 },            // 3
    { addr: '新北市中和區景平路300號', lat: 24.9999, lng: 121.4923 },            // 4
    { addr: '新北市板橋區文化路一段80號', lat: 25.0145, lng: 121.4602 },         // 5
    { addr: '新北市淡水區中山路150號', lat: 25.1714, lng: 121.4422 },            // 6
    { addr: '新北市三重區重新路三段100號', lat: 25.0683, lng: 121.4847 },        // 7
    { addr: '台北市萬華區康定路250號', lat: 25.0349, lng: 121.5030 },            // 8
    { addr: '桃園市平鎮區延平路100號', lat: 24.9433, lng: 121.2173 },            // 9
    // 新增台北市地址（idx 10-17，用於替換原本重複的案件）
    { addr: '台北市信義區信義路五段100號', lat: 25.0330, lng: 121.5645 },        // 10 ⭐ 新
    { addr: '台北市大安區仁愛路四段50號', lat: 25.0395, lng: 121.5450 },         // 11 ⭐ 新
    { addr: '台北市中山區南京東路二段80號', lat: 25.0531, lng: 121.5320 },       // 12 ⭐ 新
    { addr: '台北市松山區八德路四段200號', lat: 25.0490, lng: 121.5605 },        // 13 ⭐ 新
    { addr: '台北市內湖區成功路三段150號', lat: 25.0825, lng: 121.5827 },        // 14 ⭐ 新
    { addr: '台北市士林區中山北路六段100號', lat: 25.0950, lng: 121.5290 },      // 15 ⭐ 新
    { addr: '台北市文山區興隆路二段50號', lat: 25.0023, lng: 121.5536 },         // 16 ⭐ 新
    { addr: '台北市北投區光明路100號', lat: 25.1366, lng: 121.5074 },            // 17 ⭐ 新
  ];

  // ========== 車輛（不再寫死 members）==========
  // 配色：Tailwind 600 色階，飽和度/明度一致，與 SMOG teal 主色協調
  const VEHICLES = [
    { id: 'V1', name: '車1', type: '兩用', color: '#0284C7' },  // sky-600
    { id: 'V2', name: '車2', type: '施作', color: '#2563EB' },  // blue-600
    { id: 'V3', name: '車3', type: '丈量', color: '#059669' },  // emerald-600
    { id: 'V4', name: '車4', type: '施作', color: '#D97706' },  // amber-600
    { id: 'V5', name: '車5', type: '兩用', color: '#7C3AED' },  // violet-600
  ];

  // ========== 人員 ==========
  const PEOPLE = [
    { id: 'P1', name: 'Andy',  skills: ['丈量', '施作'], vehicleId: 'V1' },
    { id: 'P2', name: '小王',  skills: ['施作'],         vehicleId: 'V1' },
    { id: 'P3', name: 'Joe',   skills: ['施作'],         vehicleId: 'V2' },
    { id: 'P4', name: 'Mike',  skills: ['施作'],         vehicleId: 'V2' },
    { id: 'P5', name: 'Lisa',  skills: ['丈量'],         vehicleId: 'V3' },
    { id: 'P6', name: 'Tom',   skills: ['施作'],         vehicleId: 'V4' },
    { id: 'P7', name: 'Jerry', skills: ['施作'],         vehicleId: 'V4' },
    { id: 'P8', name: 'Henry', skills: ['丈量', '施作'], vehicleId: 'V5' },
    { id: 'P9', name: '阿志',  skills: ['丈量', '施作'], vehicleId: 'V5' },
  ];

  // ========== 系統預設值 ==========
  const SETTINGS = {
    defaultDuration: { '線上丈量': 30, '現場丈量': 60, '施作': 90 },
    workTime: { start: '08:00', end: '19:00' },
  };

  const STATUS_LIST = [
    '諮詢中', '已排丈量', '已丈量', '已成交',
    '已排施作', '施作中', '已完工',
    '後補名單', '跳票', '已取消'
  ];

  const today = new Date().toISOString().slice(0,10);

  const CASES = [
    { id: 'C001', vehicleId: 'V1', date: today, start: '09:00', duration: 60, type: '現場丈量', customer: '王小姐', phone: '0912-111-001', address: SAMPLE_ADDRESSES[0].addr, lat: SAMPLE_ADDRESSES[0].lat, lng: SAMPLE_ADDRESSES[0].lng, status: '已排丈量', amount: 0, notes: '透天3樓，6面紗窗' },
    { id: 'C002', vehicleId: 'V1', date: today, start: '11:00', duration: 90, type: '施作', customer: '陳先生', phone: '0912-111-002', address: SAMPLE_ADDRESSES[1].addr, lat: SAMPLE_ADDRESSES[1].lat, lng: SAMPLE_ADDRESSES[1].lng, status: '已排施作', amount: 28000, notes: '陽台2面 + 加壓條' },
    { id: 'C003', vehicleId: 'V1', date: today, start: '14:00', duration: 90, type: '施作', customer: '林太太', phone: '0912-111-003', address: SAMPLE_ADDRESSES[2].addr, lat: SAMPLE_ADDRESSES[2].lat, lng: SAMPLE_ADDRESSES[2].lng, status: '已排施作', amount: 35000, notes: '4面紗窗 + 鋁條' },

    { id: 'C004', vehicleId: 'V2', date: today, start: '09:30', duration: 90, type: '施作', customer: '張先生', phone: '0922-222-001', address: SAMPLE_ADDRESSES[3].addr, lat: SAMPLE_ADDRESSES[3].lat, lng: SAMPLE_ADDRESSES[3].lng, status: '已排施作', amount: 42000, notes: '5面 + 舊條難拆' },
    { id: 'C005', vehicleId: 'V2', date: today, start: '13:00', duration: 120, type: '施作', customer: '黃小姐', phone: '0922-222-002', address: SAMPLE_ADDRESSES[4].addr, lat: SAMPLE_ADDRESSES[4].lat, lng: SAMPLE_ADDRESSES[4].lng, status: '已排施作', amount: 55000, notes: '陽台 3 面複雜' },
    { id: 'C006', vehicleId: 'V2', date: today, start: '16:00', duration: 60, type: '施作', customer: '吳先生', phone: '0922-222-003', address: SAMPLE_ADDRESSES[5].addr, lat: SAMPLE_ADDRESSES[5].lat, lng: SAMPLE_ADDRESSES[5].lng, status: '已排施作', amount: 22000, notes: '2面紗窗' },

    { id: 'C007', vehicleId: 'V3', date: today, start: '10:00', duration: 60, type: '現場丈量', customer: '蔡小姐', phone: '0933-333-001', address: SAMPLE_ADDRESSES[6].addr, lat: SAMPLE_ADDRESSES[6].lat, lng: SAMPLE_ADDRESSES[6].lng, status: '已排丈量', amount: 0, notes: '淡水案件' },
    { id: 'C008', vehicleId: 'V3', date: today, start: '11:30', duration: 30, type: '線上丈量', customer: '劉先生', phone: '0933-333-002', address: '線上視訊', lat: 0, lng: 0, status: '已排丈量', amount: 0, notes: '視訊丈量' },
    { id: 'C009', vehicleId: 'V3', date: today, start: '14:30', duration: 60, type: '現場丈量', customer: '楊小姐', phone: '0933-333-003', address: SAMPLE_ADDRESSES[7].addr, lat: SAMPLE_ADDRESSES[7].lat, lng: SAMPLE_ADDRESSES[7].lng, status: '已排丈量', amount: 0, notes: '公寓 5F' },

    { id: 'C010', vehicleId: 'V4', date: today, start: '09:00', duration: 90, type: '施作', customer: '周先生', phone: '0944-444-001', address: SAMPLE_ADDRESSES[8].addr, lat: SAMPLE_ADDRESSES[8].lat, lng: SAMPLE_ADDRESSES[8].lng, status: '施作中', amount: 30000, notes: '老公寓3面' },
    { id: 'C011', vehicleId: 'V4', date: today, start: '13:30', duration: 120, type: '施作', customer: '徐小姐', phone: '0944-444-002', address: SAMPLE_ADDRESSES[9].addr, lat: SAMPLE_ADDRESSES[9].lat, lng: SAMPLE_ADDRESSES[9].lng, status: '已排施作', amount: 48000, notes: '陽台 + 加壓條' },

    { id: 'C012', vehicleId: 'V5', date: today, start: '10:30', duration: 60, type: '現場丈量', customer: '何先生', phone: '0955-555-001', address: SAMPLE_ADDRESSES[10].addr, lat: SAMPLE_ADDRESSES[10].lat, lng: SAMPLE_ADDRESSES[10].lng, status: '已排丈量', amount: 0, notes: '信義區公寓' },
    { id: 'C013', vehicleId: 'V5', date: today, start: '13:00', duration: 90, type: '施作', customer: '謝小姐', phone: '0955-555-002', address: SAMPLE_ADDRESSES[11].addr, lat: SAMPLE_ADDRESSES[11].lat, lng: SAMPLE_ADDRESSES[11].lng, status: '已排施作', amount: 26000, notes: '大安區3面紗窗' },
    { id: 'C014', vehicleId: 'V5', date: today, start: '15:30', duration: 60, type: '現場丈量', customer: '羅先生', phone: '0955-555-003', address: SAMPLE_ADDRESSES[12].addr, lat: SAMPLE_ADDRESSES[12].lat, lng: SAMPLE_ADDRESSES[12].lng, status: '已排丈量', amount: 0, notes: '中山區公寓' },
  ];

  // 把「未排案件」也當成 CASES 的一部分（vehicleId/start = null）
  // 這樣同一筆紀錄可以從「諮詢中」一路走到「已完工」，不需要複製
  CASES.push(
    { id: 'P001', vehicleId: null, start: null, date: today, type: '現場丈量', duration: 60, customer: '彭小姐', phone: '0966-666-001', address: SAMPLE_ADDRESSES[13].addr, lat: SAMPLE_ADDRESSES[13].lat, lng: SAMPLE_ADDRESSES[13].lng, status: '諮詢中', amount: 0, notes: '松山區新案 - LINE 進線', source: 'LINE', createdAt: today },
    { id: 'P002', vehicleId: null, start: null, date: today, type: '施作', duration: 90, customer: '蘇先生', phone: '0966-666-002', address: SAMPLE_ADDRESSES[14].addr, lat: SAMPLE_ADDRESSES[14].lat, lng: SAMPLE_ADDRESSES[14].lng, status: '已成交', amount: 38000, notes: '內湖案，客戶確定要施作', source: '電話', createdAt: today },
    { id: 'P003', vehicleId: null, start: null, date: today, type: '現場丈量', duration: 60, customer: '葉太太', phone: '0966-666-003', address: SAMPLE_ADDRESSES[15].addr, lat: SAMPLE_ADDRESSES[15].lat, lng: SAMPLE_ADDRESSES[15].lng, status: '諮詢中', amount: 0, notes: '士林區', source: 'LINE', createdAt: today },
    { id: 'P004', vehicleId: null, start: null, date: today, type: '現場丈量', duration: 60, customer: '吳大哥', phone: '0966-666-004', address: SAMPLE_ADDRESSES[16].addr, lat: SAMPLE_ADDRESSES[16].lat, lng: SAMPLE_ADDRESSES[16].lng, status: '已丈量', amount: 0, notes: '文山區，已丈量待報價', source: '電話', createdAt: today },
    { id: 'P005', vehicleId: null, start: null, date: today, type: '施作', duration: 90, customer: '張董', phone: '0966-666-005', address: SAMPLE_ADDRESSES[17].addr, lat: SAMPLE_ADDRESSES[17].lat, lng: SAMPLE_ADDRESSES[17].lng, status: '後補名單', amount: 25000, notes: '北投區，客戶猶豫中', source: 'LINE', createdAt: today },
  );

  // ============ 班表（每月固定）============
  // 預設規則：週一~週六 上班、週日 休假
  // 加班預設時段：19:00~21:00
  const SHIFTS = _generateMonthShifts();

  function _generateMonthShifts() {
    const shifts = [];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    PEOPLE.forEach(p => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateStr = d.toISOString().slice(0, 10);
        const dow = d.getDay(); // 0=Sun, 6=Sat
        let status = '上班';
        if (dow === 0) status = '休假';

        // 隨機加班/特休
        const seed = (p.id.charCodeAt(1) + day) % 17;
        if (seed === 0 && status === '上班') status = '加班';
        if (seed === 1 && status === '上班') status = '特休';

        const shift = {
          personId: p.id,
          date: dateStr,
          status,
        };
        if (status === '加班') {
          shift.overtime = { start: '19:00', end: '21:00' };
        }
        shifts.push(shift);
      }
    });
    return shifts;
  }

  // ============ 輔助函式 ============

  function getVehicleMembers(vehicleId) {
    return PEOPLE.filter(p => p.vehicleId === vehicleId);
  }

  function getVehicleAllowedTypes(vehicleId) {
    const v = VEHICLES.find(x => x.id === vehicleId);
    if (!v) return [];
    if (v.type === '兩用') return ['線上丈量', '現場丈量', '施作'];
    if (v.type === '丈量') return ['線上丈量', '現場丈量'];
    if (v.type === '施作') return ['施作'];
    return [];
  }

  /** 取得未排案件 = 沒指派車、或沒時段、或狀態還在前期 */
  function getPendingCases() {
    return CASES.filter(c => !c.vehicleId || !c.start);
  }

  /** 取得指定狀態的案件 */
  function getCasesByStatus(status) {
    return CASES.filter(c => c.status === status);
  }

  /** 取得某人某月的班表 */
  function getPersonShifts(personId, yyyymm) {
    return SHIFTS.filter(s => s.personId === personId && s.date.startsWith(yyyymm));
  }

  /** 取得某天某人的班 */
  function getShift(personId, dateStr) {
    return SHIFTS.find(s => s.personId === personId && s.date === dateStr);
  }

  /** 設定某天某人的班（會覆蓋）*/
  function setShift(personId, dateStr, status, overtime) {
    let s = SHIFTS.find(x => x.personId === personId && x.date === dateStr);
    if (s) {
      s.status = status;
      if (overtime) s.overtime = overtime; else delete s.overtime;
    } else {
      const shift = { personId, date: dateStr, status };
      if (overtime) shift.overtime = overtime;
      SHIFTS.push(shift);
    }
  }

  /** 取得某車當月案件統計 */
  function getVehicleStats(vehicleId, yyyymm) {
    const vCases = CASES.filter(c => c.vehicleId === vehicleId && c.date && c.date.startsWith(yyyymm));
    return {
      total: vCases.length,
      丈量: vCases.filter(c => c.type.includes('丈量')).length,
      施作: vCases.filter(c => c.type === '施作').length,
      已完工: vCases.filter(c => c.status === '已完工').length,
      營收: vCases.reduce((sum, c) => sum + (c.amount || 0), 0),
    };
  }

  const LOCATIONS = [];   // 由 DataLoader 從 DB 載入

  return {
    HQ, SAMPLE_ADDRESSES, VEHICLES, PEOPLE, SETTINGS, SHIFTS,
    LOCATIONS, STATUS_LIST, CASES,
    getVehicleMembers, getVehicleAllowedTypes,
    getPendingCases, getCasesByStatus,
    getPersonShifts, getShift, setShift,
    getVehicleStats,
  };
})();
