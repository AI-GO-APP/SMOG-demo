/**
 * pages/dashboard-page.js
 * 儀表板 - KPI 數字 + 待跟進清單 + 漏斗轉換率
 */

const DashboardPage = (() => {

  function render(container) {
    const stats = _calcStats();
    const followUp = _findFollowUp();
    const funnel = _calcFunnel();

    container.innerHTML = `
      <div class="page-container">
        <div class="page-header">
          <h1 style="font-size:var(--fs-xl); font-weight:700;">📊 儀表板</h1>
          <p style="font-size:var(--fs-sm); color:var(--c-text-mute); margin-top:4px;">即時 KPI 與待跟進清單</p>
        </div>

        <div class="page-body">

          <!-- KPI 卡片 -->
          <section style="margin-bottom:24px;">
            <h2 style="font-size:var(--fs-md); font-weight:600; margin-bottom:12px;">📈 今日數字</h2>
            <div class="kpi-grid">
              <div class="kpi-card kpi-blue">
                <div class="kpi-label">新進諮詢</div>
                <div class="kpi-value">${stats.newInquiry}</div>
                <div class="kpi-sub">含後補名單</div>
              </div>
              <div class="kpi-card kpi-amber">
                <div class="kpi-label">待回訪</div>
                <div class="kpi-value">${stats.toFollowUp}</div>
                <div class="kpi-sub">>3 天無動</div>
              </div>
              <div class="kpi-card kpi-emerald">
                <div class="kpi-label">待排施作</div>
                <div class="kpi-value">${stats.toInstall}</div>
                <div class="kpi-sub">已成交未排車</div>
              </div>
              <div class="kpi-card kpi-teal">
                <div class="kpi-label">本月已完工</div>
                <div class="kpi-value">${stats.completed}</div>
                <div class="kpi-sub">營收 NT$ ${(stats.revenue/1000).toFixed(0)}k</div>
              </div>
            </div>
          </section>

          <!-- 待跟進 -->
          <section style="margin-bottom:24px;">
            <h2 style="font-size:var(--fs-md); font-weight:600; margin-bottom:12px;">🔴 需立即跟進（${followUp.length} 筆）</h2>
            <div style="background:white; border:1px solid var(--c-border); border-radius:12px; overflow:hidden;">
              ${followUp.length === 0
                ? '<div style="padding:32px; text-align:center; color:var(--c-text-mute);">✓ 沒有待跟進的案件</div>'
                : `<table class="data-table">
                    <thead><tr><th>客戶</th><th>狀態</th><th>類型</th><th>來源</th><th>原因</th><th style="text-align:right">操作</th></tr></thead>
                    <tbody>
                      ${followUp.map(f => `
                        <tr>
                          <td><div style="font-weight:600;">${f.case.customer}</div><div style="font-size:var(--fs-xs); color:var(--c-text-mute);">${f.case.phone}</div></td>
                          <td><span class="status-badge status-${f.case.status}">${f.case.status}</span></td>
                          <td>${f.case.type}</td>
                          <td>${f.case.source || '-'}</td>
                          <td style="font-size:var(--fs-sm); color:#DC2626;">${f.reason}</td>
                          <td style="text-align:right;"><button class="link-btn" data-case="${f.case.id}">查看</button></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>`
              }
            </div>
          </section>

          <!-- 漏斗轉換率 -->
          <section>
            <h2 style="font-size:var(--fs-md); font-weight:600; margin-bottom:12px;">📊 案件漏斗（轉換率）</h2>
            <div style="background:white; border:1px solid var(--c-border); border-radius:12px; padding:24px;">
              ${_renderFunnel(funnel)}
            </div>
          </section>

        </div>
      </div>
    `;

    container.querySelectorAll('[data-case]').forEach(b => {
      b.onclick = () => CaseModalComponent.open(b.dataset.case);
    });
  }

  function _calcStats() {
    const today = new Date().toISOString().slice(0, 10);
    const yyyymm = today.slice(0, 7);
    return {
      newInquiry: MockData.CASES.filter(c => ['諮詢中', '後補名單'].includes(c.status)).length,
      toFollowUp: _findFollowUp().length,
      toInstall: MockData.CASES.filter(c => c.status === '已成交' && !c.start).length,
      completed: MockData.CASES.filter(c => c.status === '已完工' && c.date && c.date.startsWith(yyyymm)).length,
      revenue: MockData.CASES.filter(c => c.status === '已完工' && c.date && c.date.startsWith(yyyymm))
                              .reduce((s, c) => s + (c.amount || 0), 0),
    };
  }

  function _findFollowUp() {
    // 條件：諮詢中 / 已丈量 / 已成交 / 後補名單，且有 createdAt（demo 簡化：全列）
    const PROBLEM_STATUS = ['諮詢中', '已丈量', '已成交', '後補名單'];
    const reasons = {
      '諮詢中': '尚未排丈量',
      '已丈量': '丈量完未報價/未決定',
      '已成交': '已成交未排施作',
      '後補名單': '客戶猶豫，需追',
    };
    return MockData.CASES
      .filter(c => PROBLEM_STATUS.includes(c.status))
      .map(c => ({ case: c, reason: reasons[c.status] }));
  }

  function _calcFunnel() {
    const total = MockData.CASES.length;
    const inquiry = MockData.CASES.filter(c => ['諮詢中', '已排丈量', '已丈量', '已成交', '已排施作', '施作中', '已完工'].includes(c.status)).length;
    const measured = MockData.CASES.filter(c => ['已丈量', '已成交', '已排施作', '施作中', '已完工'].includes(c.status)).length;
    const sold = MockData.CASES.filter(c => ['已成交', '已排施作', '施作中', '已完工'].includes(c.status)).length;
    const installed = MockData.CASES.filter(c => ['已完工'].includes(c.status)).length;
    return [
      { label: '進線諮詢', value: inquiry, total: inquiry, color: '#9CA3AF' },
      { label: '完成丈量', value: measured, total: inquiry, color: '#F59E0B' },
      { label: '客戶成交', value: sold, total: measured, color: '#10B981' },
      { label: '完工結案', value: installed, total: sold, color: '#19A8B5' },
    ];
  }

  function _renderFunnel(stages) {
    const max = Math.max(...stages.map(s => s.value));
    return stages.map((s, i) => {
      const widthPct = max > 0 ? (s.value / max * 100) : 0;
      const conversionPct = (i > 0 && s.total > 0) ? (s.value / s.total * 100).toFixed(1) : '-';
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span style="font-size:var(--fs-sm); font-weight:600;">${s.label}</span>
            <span style="font-size:var(--fs-sm);">
              <span style="font-weight:700;">${s.value}</span>
              ${i > 0 ? `<span style="color:var(--c-text-mute); margin-left:8px;">轉換 ${conversionPct}%</span>` : ''}
            </span>
          </div>
          <div style="background:#F3F4F6; border-radius:6px; overflow:hidden; height:24px;">
            <div style="background:${s.color}; width:${widthPct}%; height:100%; transition:width 0.3s;"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  return { render };
})();
