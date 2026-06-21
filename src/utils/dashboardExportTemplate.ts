export function getDashboardExportTemplate(safePayload: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dashboard Analitik UMKM</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 40%, #ecfdf5 100%);
      color: #0f172a;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
      min-height: 100vh;
    }
    .page {
      max-width: 1440px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .topbar {
      background: linear-gradient(135deg, #065f46 0%, #047857 40%, #059669 100%);
      border-radius: 16px;
      padding: 20px 24px;
      box-shadow: 0 4px 12px rgba(5,150,105,0.25);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(255,255,255,0.2);
      color: #fff;
      margin-right: 8px;
      backdrop-filter: blur(4px);
    }
    .badge.secondary {
      background: rgba(255,255,255,0.15);
      color: #d1fae5;
      border: 1px solid rgba(255,255,255,0.2);
    }
    h1 {
      margin: 8px 0 4px;
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.025em;
    }
    .muted {
      color: rgba(255,255,255,0.7);
      font-size: 13px;
      margin: 0;
    }
    .filters {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .filters label {
      font-size: 11px;
      font-weight: 700;
      color: #065f46;
      text-transform: uppercase;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 150px;
    }
    .filters select {
      height: 38px;
      border: 1px solid #86efac;
      border-radius: 8px;
      background: #fff;
      padding: 0 12px;
      color: #0f172a;
      font-size: 13px;
      font-weight: 500;
      outline: none;
      transition: border-color 0.2s;
    }
    .filters select:focus {
      border-color: #059669;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 10px;
    }
    .kpi {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      min-height: 92px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
      border-left: 4px solid #10b981;
    }
    .kpi.emerald { border-left-color: #10b981; }
    .kpi.blue { border-left-color: #3b82f6; }
    .kpi.amber { border-left-color: #f59e0b; }
    .kpi.violet { border-left-color: #8b5cf6; }
    .kpi.rose { border-left-color: #f43f5e; }
    .kpi.orange { border-left-color: #f97316; }
    .kpi.slate { border-left-color: #64748b; }
    .kpi span.title {
      color: #059669;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: #ecfdf5;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
    }
    .kpi.blue span.title { color: #2563eb; background: #eff6ff; }
    .kpi.amber span.title { color: #d97706; background: #fffbeb; }
    .kpi.violet span.title { color: #7c3aed; background: #f5f3ff; }
    .kpi.rose span.title { color: #e11d48; background: #fff1f2; }
    .kpi.orange span.title { color: #ea580c; background: #fff7ed; }
    .kpi.slate span.title { color: #475569; background: #f8fafc; }
    .kpi span.helper {
      color: #94a3b8;
      font-size: 10px;
      display: block;
      margin-top: 1px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .kpi strong.value {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .kpi .growth {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 99px;
      margin-top: 4px;
    }
    .kpi .growth.up { background: #ecfdf5; color: #15803d; }
    .kpi .growth.down { background: #fff1f2; color: #e11d48; }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 12px;
    }
    .card {
      background: #fff;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 16px;
      min-height: 240px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .card h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
      color: #065f46;
      background: #ecfdf5;
      padding: 6px 14px;
      border-radius: 10px;
      display: inline-block;
      border: 1px solid #d1fae5;
    }
    .card p {
      margin: 4px 0 12px;
      color: #64748b;
      font-size: 11px;
    }
    .mini-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }
    .mini-summary div {
      background: #f8fafc;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 11px;
      border: 1px solid #f1f5f9;
    }
    .mini-summary span {
      display: block;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 500;
    }
    .mini-summary strong {
      display: block;
      color: #0f172a;
      margin-top: 2px;
      font-size: 13px;
      font-weight: 700;
    }
    .chart-scroll {
      flex-grow: 1;
      height: 220px;
      overflow-y: auto;
      overflow-x: hidden;
      padding-right: 4px;
    }
    .chart-box {
      height: 200px;
      min-height: 200px;
    }
    details.detail {
      border-top: 1px solid #f1f5f9;
      margin-top: 12px;
      padding-top: 10px;
    }
    details.detail summary {
      cursor: pointer;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      list-style: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .detail-body {
      margin-top: 8px;
      max-height: 140px;
      overflow-y: auto;
    }
    .detail-row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 8px;
      align-items: center;
      padding: 6px 4px;
      border-top: 1px solid #f8fafc;
      font-size: 11px;
    }
    .detail-row:first-child {
      border-top: 0;
    }
    .detail-row span:first-child {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      color: #334155;
      font-weight: 500;
    }
    .detail-row strong {
      color: #0f172a;
    }
    .detail-row em {
      color: #64748b;
      font-style: normal;
      font-weight: 600;
    }
    .insight-section {
      margin-bottom: 4px;
    }
    .insight-section h2 {
      font-size: 16px;
      font-weight: 800;
      margin: 0 0 12px;
      color: #0f172a;
    }
    .insight-container {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .insight-item {
      flex: 1;
      min-width: 260px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: start;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      border-left: 4px solid #276749;
    }
    .insight-item p {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      color: #334155;
    }
    @media (max-width: 1024px) {
      .grid-container {
        grid-template-columns: repeat(12, 1fr);
      }
      .grid-container > .card {
        grid-column: span 6 !important;
      }
    }
    @media (max-width: 768px) {
      .grid-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .grid-container > .card {
        grid-column: span 12 !important;
      }
      .filters {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="topbar">
      <div>
        <span class="badge" id="businessBadge"></span>
        <span class="badge secondary" id="dateBadge"></span>
        <h1 style="color: #fff;">Dashboard Analitik Penjualan</h1>
        <p class="muted" id="rowInfo"></p>
      </div>
      <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
        <div style="display: flex; background: rgba(226, 232, 240, 0.6); padding: 2px; border-radius: 6px; border: 1px solid #cbd5e1; align-items: center;">
          <button id="toggleRevenue" style="height: 28px; padding: 0 10px; border-radius: 4px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; background: white; color: #276749;">Omzet (Rp)</button>
          <button id="toggleQuantity" style="height: 28px; padding: 0 10px; border-radius: 4px; font-size: 11px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; background: transparent; color: #64748b;">Kuantitas (Qty)</button>
        </div>
      </div>
    </div>
    
    <div class="filters" id="filters"></div>
    
    <div class="kpi-grid" id="kpiGrid"></div>
    
    <div class="insight-section">
      <h2 style="color: #065f46; background: #ecfdf5; padding: 6px 14px; border-radius: 10px; display: inline-block; border: 1px solid #d1fae5; font-size: 16px;">Analyst Findings</h2>
      <div class="insight-container" id="insightList"></div>
    </div>

    <div class="grid-container" style="margin-bottom: 12px;">
      <div class="card" style="grid-column: span 12;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div>
            <h2 style="margin: 0; font-size: 16px;">Revenue Trend & Transaction Momentum</h2>
            <p style="margin: 3px 0 0; color: #64748b; font-size: 12px;">Membaca arah omzet dan volume transaksi sepanjang periode analisis.</p>
          </div>
          <select id="trendGranularity" style="height: 32px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; padding: 0 10px; font-size: 12px; font-weight: 500; color: #0f172a; outline: none;">
            <option value="daily">Harian</option>
            <option value="weekly">Mingguan</option>
            <option value="monthly">Bulanan</option>
          </select>
        </div>
        <div style="height: 300px; min-height: 300px; margin-top: 12px;"><canvas id="trendChart"></canvas></div>
      </div>
    </div>

    <div id="deepDiveSection"></div>
    <div id="explorationSection"></div>
   <script>
    const payload = ${safePayload};
    let chartData = payload.charts;
    let activePareto = payload.pareto || { products: { items: [], top20Share: 0 } };
    const initialFilters = payload.activeFilters || {};
    let active = {
      period: initialFilters.dateFilter || 'all',
      category: initialFilters.categoryFilter || 'all',
      channel: initialFilters.channelFilter || 'all',
      branch: initialFilters.branchFilter || 'all',
      payment: initialFilters.paymentFilter || 'all',
      trend: payload.trendGranularity || 'daily',
      metricView: payload.settings?.metricView || 'revenue'
    };
    let chartInstances = [];
    
    const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value) || 0);
    const number = (value) => new Intl.NumberFormat('id-ID').format(Number(value) || 0);
    const shortCurrency = (value) => {
      const n = Number(value) || 0;
      if (Math.abs(n) >= 1000000000) return 'Rp' + (n / 1000000000).toFixed(1) + 'M';
      if (Math.abs(n) >= 1000000) return 'Rp' + (n / 1000000).toFixed(1) + 'Jt';
      if (Math.abs(n) >= 1000) return 'Rp' + (n / 1000).toFixed(0) + 'Rb';
      return 'Rp' + n;
    };
    const formatAxisTick = (value) => {
      if (active.metricView === 'quantity') {
        const n = Number(value) || 0;
        if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'Jt';
        if (Math.abs(n) >= 1000) return (n / 1000).toFixed(0) + 'Rb';
        return n;
      }
      return shortCurrency(value);
    };

    const computePareto = (itemsEnriched) => {
      const total = itemsEnriched.reduce((sum, item) => sum + (Number(item.sales) || 0), 0);
      let cumulative = 0;
      let countFor80 = 0;
      const enriched = itemsEnriched.map((item, index) => {
        cumulative += Number(item.sales) || 0;
        if (total > 0 && cumulative / total <= 0.8) countFor80 = index + 1;
        return {
          ...item,
          share: total ? (item.sales / total) * 100 : 0,
          cumulativeShare: total ? (cumulative / total) * 100 : 0,
        };
      });
      if (total > 0 && countFor80 < enriched.length) countFor80 += 1;
      return {
        total,
        countFor80,
        top20Count: Math.max(1, Math.ceil(itemsEnriched.length * 0.2)),
        top20Share: total ? (itemsEnriched.slice(0, Math.max(1, Math.ceil(itemsEnriched.length * 0.2))).reduce((sum, item) => sum + item.sales, 0) / total) * 100 : 0,
        items: enriched,
      };
    };

    const palette = ['#276749', '#A7B8AE'];
    const axisOptions = { grid: { color: '#e8ecef' }, ticks: { color: '#667085', callback: (value) => formatAxisTick(value) } };
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const datasetLabel = ctx.dataset.label || '';
              const isQty = active.metricView === 'quantity' || datasetLabel.includes('Kuantitas') || datasetLabel.includes('Transaksi');
              const isCurrency = !isQty && (datasetLabel.includes('Omzet') || datasetLabel.includes('Revenue') || datasetLabel.includes('Profit') || datasetLabel === '');
              return (isCurrency ? rupiah(ctx.raw) : number(ctx.raw));
            }
          }
        }
      }
    };
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

    const addCardToGrid = (targetId, title, desc, id, size = 4) => {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.insertAdjacentHTML('beforeend', \`
        <div class="card" style="grid-column: span \${size}; display: flex; flex-direction: column;">
          <h2>\${title}</h2>
          <p>\${desc}</p>
          <div id="\${id}Summary"></div>
          <div class="chart-scroll">
            <div class="chart-box" id="\${id}Box">
              <canvas id="\${id}"></canvas>
            </div>
          </div>
          <details class="detail">
            <summary><span>Detail lengkap</span><span></span></summary>
            <div class="detail-body" id="\${id}Detail"></div>
          </details>
        </div>
      \`);
    };

    const addSummary = (id, data, key = 'sales', label = 'item') => {
      const el = document.getElementById(id + 'Summary');
      if (!el) return;
      const total = data.reduce((sum, d) => sum + (Number(d[key]) || Number(d.sales) || 0), 0);
      const top = data[0] || {};
      const topValue = Number(top[key]) || Number(top.sales) || 0;
      const topShare = total ? ((topValue / total) * 100).toFixed(1) : '0.0';
      const topFive = data.slice(0, 5).reduce((sum, d) => sum + (Number(d[key]) || Number(d.sales) || 0), 0);
      const topFiveShare = total ? ((topFive / total) * 100).toFixed(1) : '0.0';
      el.innerHTML = '<div class="mini-summary"><div><span>Total ' + label + '</span><strong>' + number(data.length) + '</strong></div><div><span>Top item</span><strong>' + topShare + '%</strong></div><div><span>Top 5</span><strong>' + topFiveShare + '%</strong></div></div>';
    };

    const addDetail = (id, data, key = 'sales') => {
      const el = document.getElementById(id + 'Detail');
      if (!el) return;
      const total = data.reduce((sum, d) => sum + (Number(d[key]) || Number(d.sales) || 0), 0);
      el.innerHTML = data.map((d, i) => {
        const value = Number(d[key]) || Number(d.sales) || 0;
        const pct = total ? ((value / total) * 100).toFixed(1) : '0.0';
        const displayVal = active.metricView === 'quantity' ? number(value) : rupiah(value);
        return '<div class="detail-row"><span>' + (i + 1) + '. ' + d.name + '</span><strong>' + displayVal + '</strong><em>' + pct + '%</em></div>';
      }).join('');
    };

    const destroyCharts = () => { chartInstances.forEach(chart => chart.destroy()); chartInstances = []; };
    
    const makeBar = (id, data, horizontal, color, key = 'sales', label) => {
      const box = document.getElementById(id + 'Box');
      if (horizontal && box) box.style.height = Math.max(190, data.length * 28 + 52) + 'px';
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded. Skipping chart: ' + id);
        return null;
      }
      try {
        const isInteractive = ['kategori', 'channel', 'cabang', 'metode'].includes(label);
        const chart = new Chart(document.getElementById(id), {
          type: 'bar',
          data: { labels: data.map(d => d.name), datasets: [{ data: data.map(d => Number(d[key]) || Number(d.sales) || 0), backgroundColor: color, borderRadius: 6 }] },
          options: {
            ...baseOptions,
            indexAxis: horizontal ? 'y' : 'x',
            scales: horizontal ? { x: axisOptions, y: { grid: { display: false }, ticks: { color: '#344054' } } } : { y: axisOptions, x: { grid: { display: false }, ticks: { color: '#344054' } } },
            onClick: (e, activeElements) => {
              if (isInteractive && activeElements && activeElements.length > 0) {
                const elementIndex = activeElements[0].index;
                const labelValue = data[elementIndex].name;
                handleCrossFilter(label, labelValue);
              }
            },
            onHover: (event, activeElements) => {
              if (isInteractive) {
                event.chart.canvas.style.cursor = activeElements.length ? 'pointer' : 'default';
              }
            }
          }
        });
        chartInstances.push(chart);
        return chart;
      } catch (e) {
        console.error('Error rendering chart: ' + id, e);
        return null;
      }
    };

    const makeDoughnut = (id, data, label) => {
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded. Skipping chart: ' + id);
        return null;
      }
      try {
        const isInteractive = ['kategori', 'channel', 'cabang', 'metode'].includes(label);
        const chart = new Chart(document.getElementById(id), {
          type: 'doughnut',
          data: { labels: data.map(d => d.name), datasets: [{ data: data.map(d => d.value || d.sales), backgroundColor: palette, borderWidth: 0 }] },
          options: {
            ...baseOptions,
            cutout: '58%',
            plugins: { ...baseOptions.plugins, legend: { display: true, position: 'bottom', labels: { boxWidth: 10, color: '#344054' } } },
            onClick: (e, activeElements) => {
              if (isInteractive && activeElements && activeElements.length > 0) {
                const elementIndex = activeElements[0].index;
                const labelValue = data[elementIndex].name;
                handleCrossFilter(label, labelValue);
              }
            },
            onHover: (event, activeElements) => {
              if (isInteractive) {
                event.chart.canvas.style.cursor = activeElements.length ? 'pointer' : 'default';
              }
            }
          }
        });
        chartInstances.push(chart);
        return chart;
      } catch (e) {
        console.error('Error rendering chart: ' + id, e);
        return null;
      }
    };

    const makeRadar = (id, data, color, key = 'sales', label) => {
      const box = document.getElementById(id + 'Box');
      if (box) box.style.height = '260px';
      if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded. Skipping chart: ' + id);
        return null;
      }
      try {
        const isInteractive = ['kategori', 'channel', 'cabang', 'metode'].includes(label);
        const chart = new Chart(document.getElementById(id), {
          type: 'radar',
          data: {
            labels: data.slice(0, 8).map(d => d.name),
            datasets: [{
              label: active.metricView === 'quantity' ? 'Kuantitas' : 'Omzet',
              data: data.slice(0, 8).map(d => Number(d[key]) || Number(d.sales) || 0),
              backgroundColor: 'rgba(39, 103, 73, 0.22)',
              borderColor: color,
              borderWidth: 2,
              pointBackgroundColor: color
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => active.metricView === 'quantity' ? number(ctx.raw) : rupiah(ctx.raw) } } },
            scales: { r: { grid: { color: '#e8ecef' }, pointLabels: { color: '#344054', font: { size: 11 } }, ticks: { display: false } } },
            onClick: (e, activeElements) => {
              if (isInteractive && activeElements && activeElements.length > 0) {
                const elementIndex = activeElements[0].index;
                const labelValue = data[elementIndex].name;
                handleCrossFilter(label, labelValue);
              }
            },
            onHover: (event, activeElements) => {
              if (isInteractive) {
                event.chart.canvas.style.cursor = activeElements.length ? 'pointer' : 'default';
              }
            }
          }
        });
        chartInstances.push(chart);
        return chart;
      } catch (e) {
        console.error('Error rendering chart: ' + id, e);
        return null;
      }
    };

    const makeTreemapHtml = (id, data, key = 'sales', label) => {
      const box = document.getElementById(id + 'Box');
      if (!box) return;
      const total = data.reduce((sum, d) => sum + (Number(d[key]) || Number(d.sales) || 0), 0);
      const isInteractive = ['kategori', 'channel', 'cabang', 'metode'].includes(label);
      const cursorStyle = isInteractive ? 'pointer' : 'default';
      
      const tiles = data.slice(0, 14).map((d, idx) => {
        const value = Number(d[key]) || Number(d.sales) || 0;
        const basis = Math.max(22, total ? (value / total) * 100 : 22);
        const bg = idx % 2 === 0 ? '#276749' : '#A7B8AE';
        const text = idx % 2 === 0 ? '#ffffff' : '#10251B';
        const clickAttr = isInteractive ? ('onclick="handleCrossFilter(\\\'' + label + '\\\', \\\'' + d.name.replace(/'/g, "\\\\'") + '\\\')"') : '';
        const displayVal = active.metricView === 'quantity' ? number(value) : rupiah(value);
        return '<div ' + clickAttr + ' style="flex: 1 1 ' + basis.toFixed(1) + '%; min-width: 120px; min-height: 74px; border-radius: 8px; background: ' + bg + '; color: ' + text + '; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; cursor: ' + cursorStyle + ';" class="treemap-tile">' +
          '<strong style="font-size: 12px; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + escapeHtml(d.name) + '</strong>' +
          '<span style="font-size: 12px; font-weight: 800;">' + displayVal + '</span>' +
        '</div>';
      }).join('');
      box.style.height = '260px';
      box.innerHTML = '<div style="height: 100%; display: flex; flex-wrap: wrap; gap: 8px; align-content: stretch;">' + tiles + '</div>';
    };

    const clean = (value, fallback = '') => {
      const text = String(value ?? '').trim();
      return text || fallback;
    };
    const parseDate = (value) => {
      if (!value) return null;
      if (!isNaN(value) && Number(value) > 10000) {
        const date = new Date(Math.round((Number(value) - 25569) * 86400 * 1000));
        return isNaN(date.getTime()) ? null : date;
      }
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    };

    const getCalculatedMetrics = (row) => {
      const settings = payload.settings || {};
      const rawSales = Number(row.sales_amount) || 0;
      const rawRetur = Number(row.return_amount) || 0;
      const rawDiscount = Number(row.discount_amount) || 0;
      const rawCogs = Number(row.cogs) || 0;
      const rawTax = Number(row.tax) || 0;
      const rawComm = Number(row.staff_commission) || 0;
      const rawPlat = Number(row.platform_fee) || 0;
      
      let netRev = rawSales;
      if (settings.netRevenueFormula === 'net_of_returns') netRev = rawSales - rawRetur;
      if (settings.netRevenueFormula === 'net_of_discounts_returns') netRev = rawSales - rawRetur - rawDiscount;
      
      let profit = 0;
      if (settings.profitFormula === 'auto') {
        profit = Number(row.gross_profit) || (rawSales > 0 && rawCogs > 0 ? rawSales - rawCogs : 0);
      } else if (settings.profitFormula === 'gross_profit') {
        profit = netRev - rawCogs;
      } else if (settings.profitFormula === 'operating_profit') {
        profit = netRev - rawCogs - rawTax - rawComm - rawPlat;
      }
      
      return { netRev, profit, rawSales };
    };

    const groupSum = (rows, key, fallback = 'Tidak Diketahui') => {
      const map = {};
      rows.forEach(row => {
        const name = clean(row[key], fallback);
        const { netRev, profit } = getCalculatedMetrics(row);
        const qty = Number(row.quantity) || 1;
        map[name] = map[name] || { name, sales: 0, qty: 0, value: 0, transactions: 0, profit: 0 };
        map[name].sales += netRev;
        map[name].qty += qty;
        map[name].value += active.metricView === 'quantity' ? qty : netRev;
        map[name].transactions += 1;
        map[name].profit += profit;
      });
      return Object.values(map).sort((a, b) => active.metricView === 'quantity' ? b.qty - a.qty : b.sales - a.sales);
    };

    const uniqueOptions = (key) => [...new Set(payload.rows.map(row => clean(row[key])).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id'));
    const getAnchorDate = () => {
      if (!payload.rows || !payload.rows.length) return new Date();
      let maxTime = 0;
      payload.rows.forEach(row => {
        const d = parseDate(row.transaction_date);
        if (d && d.getTime() > maxTime) {
          maxTime = d.getTime();
        }
      });
      return maxTime > 0 ? new Date(maxTime) : new Date();
    };
    const anchorDate = getAnchorDate();

    const filterRows = () => {
      const now = anchorDate;
      return payload.rows.filter(row => {
        if (active.category !== 'all' && clean(row.category) !== active.category) return false;
        if (active.channel !== 'all' && clean(row.sales_channel) !== active.channel) return false;
        if (active.branch !== 'all' && clean(row.branch) !== active.branch) return false;
        if (active.payment !== 'all' && clean(row.payment_method) !== active.payment) return false;
        if (active.period === 'all') return true;
        const date = parseDate(row.transaction_date);
        if (!date) return true;
        const diff = (now - date) / (1000 * 60 * 60 * 24);
        if (active.period === '7days') return diff >= 0 && diff <= 7;
        if (active.period === '30days') return diff >= 0 && diff <= 30;
        if (active.period === 'mtd') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
        if (active.period === 'ytd') return date.getFullYear() === now.getFullYear();
        return true;
      });
    };
    const compute = () => {
      const rows = filterRows();
      const totalOmzet = rows.reduce((sum, row) => sum + (Number(row.sales_amount) || 0), 0);
      const produkTerjual = rows.reduce((sum, row) => sum + (Number(row.quantity) || 1), 0);
      const uniqueTrx = new Set(rows.map(row => row.transaction_id).filter(Boolean));
      const uniqueCust = new Set(rows.map(row => row.customer_id || row.customer_name).filter(Boolean));
      const totalTransaksi = uniqueTrx.size || rows.length;
      
      const totalRetur = payload.dimensions.returns ? rows.reduce((sum, row) => sum + (Number(row.return_amount) || 0), 0) : 0;
      const totalDiskon = payload.dimensions.discount ? rows.reduce((sum, row) => sum + (Number(row.discount_amount) || 0), 0) : 0;
      const totalCogs = rows.reduce((sum, row) => sum + (Number(row.cogs) || 0), 0);
      const totalTax = payload.dimensions.tax ? rows.reduce((sum, row) => sum + (Number(row.tax) || 0), 0) : 0;
      const totalOngkir = rows.reduce((sum, row) => sum + (Number(row.shipping_fee) || Number(row.shipping_cost) || 0), 0);
      const totalCommission = payload.dimensions.commission ? rows.reduce((sum, row) => sum + (Number(row.staff_commission) || 0), 0) : 0;
      const totalServiceCharge = payload.dimensions.serviceCharge ? rows.reduce((sum, row) => sum + (Number(row.service_charge) || 0), 0) : 0;
      const totalPlatformFee = payload.dimensions.platformFee ? rows.reduce((sum, row) => sum + (Number(row.platform_fee) || 0), 0) : 0;

      const settings = payload.settings || {};
      let netRevenue = totalOmzet;
      if (settings.netRevenueFormula === 'net_of_returns') netRevenue = totalOmzet - totalRetur;
      if (settings.netRevenueFormula === 'net_of_discounts_returns') netRevenue = totalOmzet - totalRetur - totalDiskon;

      let avgTransaksi = 0;
      if (settings.aovFormula === 'gross') {
        avgTransaksi = totalTransaksi > 0 ? totalOmzet / totalTransaksi : 0;
      } else {
        avgTransaksi = totalTransaksi > 0 ? netRevenue / totalTransaksi : 0;
      }

      const trendMap = {};
      const weekdayMap = {};
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

      const formatWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay() || 7;
        d.setDate(d.getDate() - day + 1);
        return d.toISOString().split('T')[0];
      };
      const formatMonth = (date) => date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      const predictLinearRegression = (points, periods) => {
        const n = points.length;
        if (n === 0) return Array(periods).fill(0);
        if (n === 1) return Array(periods).fill(points[0]);
        
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
          sumX += i;
          sumY += points[i];
          sumXY += i * points[i];
          sumXX += i * i;
        }
        
        const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
        const c = (sumY - m * sumX) / n;
        
        const predictions = [];
        for (let i = 0; i < periods; i++) {
          const val = m * (n + i) + c;
          predictions.push(Math.max(0, val));
        }
        return predictions;
      };

      rows.forEach(row => {
        const { netRev } = getCalculatedMetrics(row);
        const date = parseDate(row.transaction_date);
        const qty = Number(row.quantity) || 1;
        const val = active.metricView === 'quantity' ? qty : netRev;
        let dateKey = 'Tanpa Tanggal';
        let sortKey = 0;
        if (date) {
          if (active.trend === 'monthly') {
            dateKey = formatMonth(date);
            sortKey = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
          } else if (active.trend === 'weekly') {
            dateKey = formatWeek(date);
            sortKey = new Date(dateKey).getTime();
          } else {
            dateKey = date.toISOString().split('T')[0];
            sortKey = date.getTime();
          }
          const day = dayNames[date.getDay()];
          weekdayMap[day] = weekdayMap[day] || { name: day, sales: 0, sort: date.getDay() };
          weekdayMap[day].sales += val;
        }
        trendMap[dateKey] = trendMap[dateKey] || { date: dateKey, sales: 0, transactions: 0, sort: sortKey };
        trendMap[dateKey].sales += val;
        trendMap[dateKey].transactions += 1;
      });

      const trendSales = Object.values(trendMap).sort((a, b) => a.sort - b.sort);

      if (trendSales.length >= 2) {
        const fitCount = Math.min(7, trendSales.length);
        const pointsForFit = trendSales.slice(-fitCount);
        const salesPoints = pointsForFit.map(d => d.sales);
        const txPoints = pointsForFit.map(d => d.transactions);
        
        const periods = active.trend === 'monthly' ? 3 : active.trend === 'weekly' ? 4 : 7;
        const predictedSales = predictLinearRegression(salesPoints, periods);
        const predictedTx = predictLinearRegression(txPoints, periods);
        
        const lastIndex = trendSales.length - 1;
        trendSales[lastIndex].forecastSales = trendSales[lastIndex].sales;
        trendSales[lastIndex].forecastTransactions = trendSales[lastIndex].transactions;
        trendSales[lastIndex].isForecastStart = true;
        
        let lastDate = new Date(trendSales[lastIndex].sort);
        for (let i = 0; i < periods; i++) {
          let nextDate = new Date(lastDate);
          if (active.trend === 'monthly') {
            nextDate.setMonth(nextDate.getMonth() + (i + 1));
          } else if (active.trend === 'weekly') {
            nextDate.setDate(lastDate.getDate() + (i + 1) * 7);
          } else {
            nextDate.setDate(lastDate.getDate() + (i + 1));
          }
          
          const dateStr = active.trend === 'monthly' 
            ? formatMonth(nextDate) 
            : active.trend === 'weekly' 
              ? formatWeek(nextDate) 
              : nextDate.toISOString().split('T')[0];
          const sortKey = active.trend === 'monthly'
            ? new Date(nextDate.getFullYear(), nextDate.getMonth(), 1).getTime()
            : new Date(dateStr).getTime();
            
          trendSales.push({
            date: dateStr,
            sales: null,
            transactions: null,
            forecastSales: predictedSales[i],
            forecastTransactions: predictedTx[i],
            isForecast: true,
            sort: sortKey
          });
        }
      }

      const topProducts = payload.dimensions.product ? groupSum(rows, 'product_name') : [];
      const categorySales = payload.dimensions.category ? groupSum(rows, 'category', 'Lainnya') : [];
      const channelSales = payload.dimensions.channel ? groupSum(rows, 'sales_channel', 'Lainnya') : [];
      const branchSales = payload.dimensions.branch ? groupSum(rows, 'branch', 'Tanpa Cabang') : [];
      const paymentMethods = payload.dimensions.paymentMethod ? groupSum(rows, 'payment_method') : [];
      const citySales = payload.dimensions.city ? groupSum(rows, 'destination_city', 'Tanpa Kota') : [];
      const staffSales = payload.dimensions.staff ? groupSum(rows, 'staff_name', 'Tanpa Staff') : [];
      const brandSales = payload.dimensions.brand ? groupSum(rows, 'brand', 'Tanpa Merek') : [];
      const supplierSales = payload.dimensions.supplier ? groupSum(rows, 'supplier', 'Tanpa Supplier') : [];

      const serviceDuration = [];
      if (payload.dimensions.duration && payload.dimensions.product) {
        const durationMap = {};
        rows.forEach(row => {
          const name = clean(row.product_name, 'Tidak Diketahui');
          const mins = Number(row.duration_mins) || 0;
          if (mins > 0) {
            durationMap[name] = durationMap[name] || { name, totalMins: 0, count: 0 };
            durationMap[name].totalMins += mins;
            durationMap[name].count += 1;
          }
        });
        Object.values(durationMap).forEach(item => {
          serviceDuration.push({ name: item.name, sales: Math.round(item.totalMins / item.count) });
        });
        serviceDuration.sort((a, b) => b.sales - a.sales);
      }

      let totalProfit = 0;
      if (settings.profitFormula === 'auto') {
        if (payload.dimensions.profit) {
          totalProfit = rows.reduce((sum, row) => sum + (Number(row.gross_profit) || 0), 0);
        } else if (payload.dimensions.cogs) {
          totalProfit = totalOmzet - totalCogs;
        }
      } else if (settings.profitFormula === 'gross_profit') {
        totalProfit = netRevenue - totalCogs;
      } else if (settings.profitFormula === 'operating_profit') {
        totalProfit = netRevenue - totalCogs - totalTax - totalCommission - totalPlatformFee;
      }
      const profitMargin = netRevenue > 0 ? (totalProfit / netRevenue) * 100 : 0;
      
      const ratingData = payload.dimensions.rating ? rows.map(r => Number(r.rating)).filter(n => n > 0 && n <= 5) : [];
      const avgRating = ratingData.length ? ratingData.reduce((a, b) => a + b, 0) / ratingData.length : 0;

      const hourlySales = [];
      if (payload.dimensions.time) {
        const hourlyMap = {};
        for (let i = 0; i < 24; i++) {
          const hh = i.toString().padStart(2, '0');
          hourlyMap[\`\${hh}:00\`] = { name: \`\${hh}:00\`, sales: 0, transactions: 0 };
        }
        rows.forEach(row => {
          const { netRev } = getCalculatedMetrics(row);
          const timeStr = String(row.transaction_time || '').trim();
          if (timeStr) {
            const hourStr = timeStr.split(':')[0];
            if (!isNaN(hourStr)) {
              const hour = \`\${hourStr.padStart(2, '0')}:00\`;
              hourlyMap[hour] = hourlyMap[hour] || { name: hour, sales: 0, transactions: 0 };
              hourlyMap[hour].sales += netRev;
              hourlyMap[hour].transactions += 1;
            }
          }
        });
        hourlySales.push(...Object.values(hourlyMap));
      }

      const basketSize = [
        { name: '< 50Rb', count: 0, sort: 1 },
        { name: '50-100Rb', count: 0, sort: 2 },
        { name: '100-250Rb', count: 0, sort: 3 },
        { name: '250-500Rb', count: 0, sort: 4 },
        { name: '> 500Rb', count: 0, sort: 5 },
      ];
      const trxs = {};
      rows.forEach((row, idx) => {
        const id = row.transaction_id || \`row_\${idx}\`;
        if (id) {
          trxs[id] = (trxs[id] || 0) + (Number(row.sales_amount) || 0);
        }
      });
      Object.values(trxs).forEach(val => {
        if (val < 50000) basketSize[0].count++;
        else if (val < 100000) basketSize[1].count++;
        else if (val < 250000) basketSize[2].count++;
        else if (val < 500000) basketSize[3].count++;
        else basketSize[4].count++;
      });

      const productMatrix = [];
      if (payload.dimensions.product && (payload.dimensions.profit || payload.dimensions.cogs)) {
        const prodMap = {};
        rows.forEach(row => {
          const { netRev, profit } = getCalculatedMetrics(row);
          const name = clean(row.product_name, 'Tidak Diketahui');
          const qty = Number(row.quantity) || 1;
          prodMap[name] = prodMap[name] || { name, sales: 0, profit: 0, quantity: 0 };
          prodMap[name].sales += netRev;
          prodMap[name].profit += profit;
          prodMap[name].quantity += qty;
        });
        Object.values(prodMap).forEach(item => {
          if (item.sales > 0 && item.quantity > 0) {
            const margin = (item.profit / item.sales) * 100;
            productMatrix.push({
              name: item.name,
              x: item.quantity, 
              y: Math.min(Math.max(margin, -100), 100),
              z: item.sales,
            });
          }
        });
      }

      let crossCategoryBranch = [];
      if (payload.dimensions.category && payload.dimensions.branch) {
        const crossMap = {};
        const categoriesSet = new Set();
        rows.forEach(row => {
          const cat = clean(row.category, 'Tanpa Kategori');
          const branch = clean(row.branch, 'Tanpa Cabang');
          const { netRev } = getCalculatedMetrics(row);
          crossMap[branch] = crossMap[branch] || { name: branch };
          crossMap[branch][cat] = (crossMap[branch][cat] || 0) + netRev;
          categoriesSet.add(cat);
        });
        crossCategoryBranch = Object.values(crossMap).sort((a, b) => {
          const sumA = Object.keys(a).filter(k => k !== 'name').reduce((s, k) => s + a[k], 0);
          const sumB = Object.keys(b).filter(k => k !== 'name').reduce((s, k) => s + b[k], 0);
          return sumB - sumA;
        });
        crossCategoryBranch.categories = Array.from(categoriesSet);
      }

      let crossTimeCategory = [];
      if (payload.dimensions.time && payload.dimensions.category) {
        const timeCatMap = {};
        const categoriesSet = new Set();
        rows.forEach(row => {
          const timeStr = String(row.transaction_time || '').trim();
          const cat = clean(row.category, 'Lainnya');
          const { netRev } = getCalculatedMetrics(row);
          if (timeStr) {
            const hour = \`\${timeStr.split(':')[0].padStart(2, '0')}:00\`;
            timeCatMap[hour] = timeCatMap[hour] || { name: hour };
            timeCatMap[hour][cat] = (timeCatMap[hour][cat] || 0) + netRev;
            categoriesSet.add(cat);
          }
        });
        crossTimeCategory = Object.values(timeCatMap).sort((a, b) => a.name.localeCompare(b.name));
        crossTimeCategory.categories = Array.from(categoriesSet);
      }

      const discountEffectiveness = [];
      if (payload.dimensions.product) {
        rows.forEach(row => {
          const discount = Number(row.discount_amount) || 0;
          const qty = Number(row.quantity) || 1;
          const { netRev } = getCalculatedMetrics(row);
          if (discount > 0 && qty > 0 && netRev > 0) {
            discountEffectiveness.push({
              name: clean(row.product_name, 'Produk'),
              x: discount,
              y: qty,
              z: netRev
            });
          }
        });
      }

      const paretoProducts = computePareto(topProducts);

      const validDates = payload.rows.map(r => parseDate(r.transaction_date)).filter(Boolean).sort((a,b) => a-b);
      const growthCalc = (current, previous) => previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);

      const computeKpiFromRows = (rowList) => {
        const omzet = rowList.reduce((s, r) => s + (Number(r.sales_amount) || 0), 0);
        const diskon = payload.dimensions.discount ? rowList.reduce((s, r) => s + (Number(r.discount_amount) || 0), 0) : 0;
        const ongkir = rowList.reduce((s, r) => s + (Number(r.shipping_fee) || 0), 0);
        const retur = payload.dimensions.returns ? rowList.reduce((s, r) => s + (Number(r.return_amount) || 0), 0) : 0;
        const qty = rowList.reduce((s, r) => s + (Number(r.quantity) || 1), 0);
        const txSet = new Set(rowList.map(r => r.transaction_id).filter(Boolean));
        const txCount = txSet.size > 0 ? txSet.size : rowList.length;
        const customers = new Set(rowList.map(r => r.customer_id || r.customer_name).filter(Boolean));
        const ratings = payload.dimensions.rating ? rowList.map(r => Number(r.rating)).filter(n => n > 0 && n <= 5) : [];
        const avgRatingVal = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

        const totalCogsVal = rowList.reduce((s, r) => s + (Number(r.cogs) || 0), 0);
        const taxVal = payload.dimensions.tax ? rowList.reduce((s, r) => s + (Number(r.tax) || 0), 0) : 0;
        const platVal = payload.dimensions.platformFee ? rowList.reduce((s, r) => s + (Number(r.platform_fee) || 0), 0) : 0;
        const commVal = payload.dimensions.commission ? rowList.reduce((s, r) => s + (Number(r.staff_commission) || 0), 0) : 0;
        
        let netRev = omzet;
        if (settings.netRevenueFormula === 'net_of_returns') netRev = omzet - retur;
        if (settings.netRevenueFormula === 'net_of_discounts_returns') netRev = omzet - retur - diskon;

        let profitVal = 0;
        if (settings.profitFormula === 'auto') {
          if (payload.dimensions.profit) {
            profitVal = rowList.reduce((s, r) => s + (Number(r.gross_profit) || 0), 0);
          } else if (payload.dimensions.cogs) {
            profitVal = omzet - totalCogsVal;
          }
        } else if (settings.profitFormula === 'gross_profit') {
          profitVal = netRev - totalCogsVal;
        } else if (settings.profitFormula === 'operating_profit') {
          profitVal = netRev - totalCogsVal - taxVal - commVal - platVal;
        }

        const aov = txCount > 0 ? (settings.aovFormula === 'gross' ? omzet / txCount : netRev / txCount) : 0;
        return { omzet, diskon, ongkir, profit: profitVal, commission: commVal, tax: taxVal, serviceCharge: 0, platformFee: platVal, retur, qty, txCount, customers: customers.size, avgRating: avgRatingVal, aov };
      };

      let growth = { label: '' };
      if (payload.dimensions.date) {
        let prevRows = [];
        let currRowsOverride = null;
        let growthLabel = '';
        const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        
        const now = anchorDate;
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const applyNonDateFilters = (row) => {
          if (active.category !== 'all' && clean(row.category) !== active.category) return false;
          if (active.channel !== 'all' && clean(row.sales_channel) !== active.channel) return false;
          if (active.branch !== 'all' && clean(row.branch) !== active.branch) return false;
          if (active.payment !== 'all' && clean(row.payment_method) !== active.payment) return false;
          return true;
        };

        if (active.period === '7days') {
          prevRows = payload.rows.filter(row => {
            if (!applyNonDateFilters(row)) return false;
            const d = parseDate(row.transaction_date);
            if (!d) return false;
            const diffDays = (now - d) / (1000 * 60 * 60 * 24);
            return diffDays > 7 && diffDays <= 14;
          });
          growthLabel = 'vs 7hr sblm';
        } else if (active.period === '30days') {
          prevRows = payload.rows.filter(row => {
            if (!applyNonDateFilters(row)) return false;
            const d = parseDate(row.transaction_date);
            if (!d) return false;
            const diffDays = (now - d) / (1000 * 60 * 60 * 24);
            return diffDays > 30 && diffDays <= 60;
          });
          growthLabel = 'vs 30hr sblm';
        } else if (active.period === 'mtd') {
          const dayOfMonth = now.getDate();
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          prevRows = payload.rows.filter(row => {
            if (!applyNonDateFilters(row)) return false;
            const d = parseDate(row.transaction_date);
            return d && d.getFullYear() === prevYear && d.getMonth() === prevMonth && d.getDate() <= dayOfMonth;
          });
          growthLabel = \`vs \${monthNames[prevMonth]}\`;
        } else if (active.period === 'ytd') {
          const dayOfYear = Math.floor((now - new Date(currentYear, 0, 1)) / (1000 * 60 * 60 * 24));
          prevRows = payload.rows.filter(row => {
            if (!applyNonDateFilters(row)) return false;
            const d = parseDate(row.transaction_date);
            if (!d || d.getFullYear() !== currentYear - 1) return false;
            const prevDayOfYear = Math.floor((d - new Date(currentYear - 1, 0, 1)) / (1000 * 60 * 60 * 24));
            return prevDayOfYear <= dayOfYear;
          });
          growthLabel = \`vs \${currentYear - 1}\`;
        } else if (active.period === 'all' && validDates.length >= 2) {
          const firstDate = validDates[0];
          const lastDate = validDates[validDates.length - 1];
          const totalSpanDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

          if (totalSpanDays >= 56) {
            const lastMonth = lastDate.getMonth();
            const lastYear = lastDate.getFullYear();
            const pm = lastMonth === 0 ? 11 : lastMonth - 1;
            const py = lastMonth === 0 ? lastYear - 1 : lastYear;
            currRowsOverride = rows.filter(row => {
              const d = parseDate(row.transaction_date);
              return d && d.getMonth() === lastMonth && d.getFullYear() === lastYear;
            });
            prevRows = rows.filter(row => {
              const d = parseDate(row.transaction_date);
              return d && d.getMonth() === pm && d.getFullYear() === py;
            });
            growthLabel = \`vs \${monthNames[pm]}\`;
          } else {
            const midDate = new Date(firstDate.getTime() + (lastDate - firstDate) / 2);
            currRowsOverride = rows.filter(row => {
              const d = parseDate(row.transaction_date);
              return d && d >= midDate;
            });
            prevRows = rows.filter(row => {
              const d = parseDate(row.transaction_date);
              return d && d < midDate;
            });
            growthLabel = 'vs paruh sblm';
          }
        }

        const currSource = currRowsOverride || rows;
        if (currSource.length > 0) {
          const prev = computeKpiFromRows(prevRows);
          const curr = currRowsOverride ? computeKpiFromRows(currRowsOverride) : {
            omzet: totalOmzet, diskon: totalDiskon, ongkir: 0, profit: totalProfit,
            commission: 0, tax: totalTax, serviceCharge: 0, platformFee: totalPlatformFee,
            retur: totalRetur, qty: produkTerjual, txCount: totalTransaksi,
            customers: uniqueCust.size, avgRating, aov: avgTransaksi
          };

          growth = {
            omzet: growthCalc(curr.omzet, prev.omzet),
            transaksi: growthCalc(curr.txCount, prev.txCount),
            profit: growthCalc(curr.profit, prev.profit),
            aov: growthCalc(curr.aov, prev.aov),
            diskon: growthCalc(curr.diskon, prev.diskon),
            ongkir: growthCalc(curr.ongkir, prev.ongkir),
            commission: growthCalc(curr.commission, prev.commission),
            tax: growthCalc(curr.tax, prev.tax),
            serviceCharge: growthCalc(curr.serviceCharge, prev.serviceCharge),
            platformFee: growthCalc(curr.platformFee, prev.platformFee),
            retur: growthCalc(curr.retur, prev.retur),
            qty: growthCalc(curr.qty, prev.qty),
            customers: growthCalc(curr.customers, prev.customers),
            rating: growthCalc(curr.avgRating, prev.avgRating),
            label: growthLabel,
          };
        }
      }

      const insights = [];
      if (!rows.length) insights.push({ text: 'Tidak ada data yang cocok dengan filter saat ini.' });
      else if (topProducts.length) insights.push({ text: 'Produk teratas "' + topProducts[0].name + '" menyumbang ' + (netRevenue ? ((topProducts[0].sales / netRevenue) * 100).toFixed(1) : '0.0') + '% omzet.' });

      // New Business Analytics Groupings
      const promoCampaign = payload.dimensions.promoCode ? groupSum(rows, 'promo_code', 'Tanpa Promo') : [];
      const customerSegment = payload.dimensions.customerType ? groupSum(rows, 'customer_type', 'Umum') : [];
      const variantPopularity = payload.dimensions.variant ? groupSum(rows, 'variant', 'Tanpa Varian') : [];
      const orderFulfillment = payload.dimensions.paymentStatus ? groupSum(rows, 'payment_status', 'Selesai') : [];

      // New 2D/3D business charts calculations
      const orderTypeMix = payload.dimensions.orderType ? groupSum(rows, 'order_type', 'Lainnya') : [];

      let paymentProviderShare = [];
      if (payload.dimensions.paymentMethod && payload.dimensions.paymentProvider) {
        const crossMap = {};
        const provSet = new Set();
        rows.forEach(row => {
          const method = clean(row.payment_method, 'Tunai');
          const provider = clean(row.payment_provider, 'Lainnya');
          const { netRev } = getCalculatedMetrics(row);
          const val = active.metricView === 'quantity' ? (Number(row.quantity) || 1) : netRev;
          crossMap[method] = crossMap[method] || { name: method };
          crossMap[method][provider] = (crossMap[method][provider] || 0) + val;
          provSet.add(provider);
        });
        paymentProviderShare = Object.values(crossMap).sort((a, b) => {
          const sA = Object.keys(a).filter(k => k !== 'name').reduce((s, k) => s + (a[k] || 0), 0);
          const sB = Object.keys(b).filter(k => k !== 'name').reduce((s, k) => s + (b[k] || 0), 0);
          return sB - sA;
        });
        paymentProviderShare.categories = Array.from(provSet);
      }

      let courierEfficiency = [];
      if (payload.dimensions.shippingCourier) {
        const courierMap = {};
        rows.forEach(row => {
          const courier = clean(row.shipping_courier, '');
          if (courier) {
            const { netRev } = getCalculatedMetrics(row);
            const fee = Number(row.shipping_fee) || 0;
            courierMap[courier] = courierMap[courier] || { name: courier, fee: 0, sales: 0 };
            courierMap[courier].fee += fee;
            courierMap[courier].sales += netRev;
          }
        });
        courierEfficiency = Object.values(courierMap).sort((a, b) => b.sales - a.sales);
      }

      const tableRevenue = payload.dimensions.tableNumber ? groupSum(rows, 'table_number', '').filter(item => item.name !== '') : [];

      let promoRoi = [];
      if (payload.dimensions.promoCode) {
        const promoMap = {};
        rows.forEach(row => {
          const promo = clean(row.promo_code, '');
          if (promo) {
            const { netRev } = getCalculatedMetrics(row);
            const discount = Number(row.discount_amount) || 0;
            promoMap[promo] = promoMap[promo] || { name: promo, discount: 0, sales: 0 };
            promoMap[promo].discount += discount;
            promoMap[promo].sales += netRev;
          }
        });
        promoRoi = Object.values(promoMap).sort((a, b) => b.sales - a.sales);
      }

      let customerLoyaltyMix = [];
      if (payload.dimensions.customerType && payload.dimensions.category) {
        const crossMap = {};
        const catSet = new Set();
        rows.forEach(row => {
          const loyalty = clean(row.customer_type, 'Umum');
          const category = clean(row.category, 'Lainnya');
          const { netRev } = getCalculatedMetrics(row);
          const val = active.metricView === 'quantity' ? (Number(row.quantity) || 1) : netRev;
          crossMap[loyalty] = crossMap[loyalty] || { name: loyalty };
          crossMap[loyalty][category] = (crossMap[loyalty][category] || 0) + val;
          catSet.add(category);
        });
        customerLoyaltyMix = Object.values(crossMap).sort((a, b) => {
          const sA = Object.keys(a).filter(k => k !== 'name').reduce((s, k) => s + (a[k] || 0), 0);
          const sB = Object.keys(b).filter(k => k !== 'name').reduce((s, k) => s + (b[k] || 0), 0);
          return sB - sA;
        });
        customerLoyaltyMix.categories = Array.from(catSet);
      }

      let variantProfitability = [];
      if (payload.dimensions.variant) {
        const varMap = {};
        rows.forEach(row => {
          const variant = clean(row.variant, 'Tanpa Varian');
          const { netRev } = getCalculatedMetrics(row);
          const qty = Number(row.quantity) || 0;
          const cogs = Number(row.cogs) || 0;
          varMap[variant] = varMap[variant] || { name: variant, cogs: 0, sales: 0, qty: 0 };
          varMap[variant].cogs += cogs;
          varMap[variant].sales += netRev;
          varMap[variant].qty += qty;
        });
        variantProfitability = Object.values(varMap).map(item => {
          const margin = item.sales > 0 ? ((item.sales - item.cogs) / item.sales) * 100 : 0;
          return { ...item, margin: Math.round(margin * 10) / 10 };
        });
      }

      return {
        kpis: { 
          totalOmzet, totalTransaksi, produkTerjual, avgTransaksi, 
          jumlahPelanggan: uniqueCust.size, 
          avgItems: totalTransaksi ? produkTerjual / totalTransaksi : 0,
          totalProfit, profitMargin, avgRating,
          totalTax, totalServiceCharge, totalPlatformFee, totalDiskon,
          totalOngkir, totalCommission, totalRetur, netRevenue, growth
        },
        charts: {
          trendSales,
          topProducts, categorySales, channelSales, branchSales, paymentMethods,
          weekdaySales: Object.values(weekdayMap).sort((a, b) => a.sort - b.sort),
          citySales,
          staffSales,
          brandSales,
          supplierSales,
          serviceDuration,
          hourlySales,
          basketSize,
          productMatrix,
          crossCategoryBranch,
          crossTimeCategory,
          discountEffectiveness,
          promoCampaign, customerSegment, variantPopularity, orderFulfillment,
          orderTypeMix, paymentProviderShare, courierEfficiency, tableRevenue,
          promoRoi, customerLoyaltyMix, variantProfitability
        },
        insights,
        pareto: {
          products: paretoProducts
        },
        rowStats: { filteredRows: rows.length, totalRows: payload.rows.length },
      };
    };

    const getChartSize = (id, preferred = 4) => {
      let size = payload.chartSizes[id] || preferred;
      if (size === 'standard') size = 4;
      if (size === 'wide' || size === 'half') size = 6;
      if (size === 'full') size = 12;
      return parseInt(size, 10) || 4;
    };

    const selectHtml = (id, label, options) => '<label>' + label + '<select id="' + id + '"><option value="all">Semua</option>' + options.map(o => '<option value="' + o + '">' + o + '</option>').join('') + '</select></label>';
    
    const buildFilters = () => {
      document.getElementById('filters').innerHTML = [
        selectHtml('periodFilter', 'Periode', ['7days', '30days', 'mtd', 'mom', 'yoy', 'ytd']),
        payload.dimensions.category ? selectHtml('categoryFilter', 'Kategori', uniqueOptions('category')) : '',
        payload.dimensions.channel ? selectHtml('channelFilter', 'Channel', uniqueOptions('sales_channel')) : '',
        payload.dimensions.branch ? selectHtml('branchFilter', 'Cabang', uniqueOptions('branch')) : '',
        payload.dimensions.paymentMethod ? selectHtml('paymentFilter', 'Pembayaran', uniqueOptions('payment_method')) : '',
      ].join('');
      const bind = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = active[key];
        el.addEventListener('change', () => { active[key] = el.value; render(); });
      };
      bind('periodFilter', 'period');
      bind('categoryFilter', 'category');
      bind('channelFilter', 'channel');
      bind('branchFilter', 'branch');
      bind('paymentFilter', 'payment');

      const trendEl = document.getElementById('trendGranularity');
      if (trendEl) {
        trendEl.value = active.trend;
        trendEl.addEventListener('change', () => { active.trend = trendEl.value; render(); });
      }
    };

    const getRecommendedExportChartView = (id, data, composition = false) => {
      const count = data?.length || 0;
      if (count <= 1) return 'bar';
      if (['channelSales', 'paymentMethods'].includes(id)) return count <= 7 ? 'pie' : 'treemap';
      if (['categorySales', 'brandSales', 'supplierSales', 'citySales'].includes(id)) return count <= 6 ? 'pie' : 'treemap';
      if (['staffSales', 'branchSales', 'serviceDuration'].includes(id)) return count >= 3 && count <= 8 ? 'radar' : 'bar';
      if (id === 'topProducts') return count > 14 ? 'treemap' : 'bar';
      if (composition) return count <= 6 ? 'pie' : 'treemap';
      return 'bar';
    };

    const getExportChartView = (id, data, composition = false) => {
      const saved = payload.chartViews && payload.chartViews[id];
      if (saved && saved !== 'auto') return saved;
      return getRecommendedExportChartView(id, data, composition);
    };

    const renderBreakdown = (title, desc, id, data, color, label, key = 'sales', composition = false, size = 4) => {
      if (!data || !data.length) return;
      addCardToGrid('explorationGrid', title, desc, id, getChartSize(id, size));
      addSummary(id, data, key, label);
      const view = getExportChartView(id, data, composition);
      if (view === 'pie' && data.length >= 2) makeDoughnut(id, data);
      else if (view === 'radar') makeRadar(id, data, color, key);
      else if (view === 'treemap') makeTreemapHtml(id, data, key);
      else makeBar(id, data, true, color, key);
      addDetail(id, data, key);
    };

    const renderDataTableCard = () => {
      const id = 'dataTable';
      const size = getChartSize(id, 12);
      const data = chartData.topProducts;
      if (!data || !data.length) return;
      
      const cardHtml = \`
        <div class="card" style="grid-column: span \${size}; display: flex; flex-direction: column;">
          <h2>Tabel Detail Kinerja Produk</h2>
          <p>Detail performa produk secara menyeluruh.</p>
          <div style="flex-grow: 1; overflow: auto; max-height: 420px; border: 1px solid #f1f5f9; border-radius: 8px; margin-top: 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
              <thead>
                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; position: sticky; top: 0;">
                  <th style="padding: 10px; font-weight: 700; color: #475569;">Item</th>
                  <th style="padding: 10px; font-weight: 700; color: #475569; text-align: right;">Omzet</th>
                  <th style="padding: 10px; font-weight: 700; color: #475569; text-align: right;">Transaksi</th>
                  <th style="padding: 10px; font-weight: 700; color: #475569; text-align: right;">Qty Terjual</th>
                  <th style="padding: 10px; font-weight: 700; color: #475569; text-align: right;">Profit</th>
                </tr>
              </thead>
              <tbody>
                \${data.map((item, idx) => \`
                  <tr style="border-bottom: 1px solid #f1f5f9; background: \${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
                    <td style="padding: 10px; font-weight: 600; color: #0f172a;">\${item.name}</td>
                    <td style="padding: 10px; text-align: right; font-weight: 700; color: #1e293b;">\${rupiah(item.sales)}</td>
                    <td style="padding: 10px; text-align: right; color: #475569;">\${number(item.transactions)}</td>
                    <td style="padding: 10px; text-align: right; color: #475569;">\${number(item.quantity || item.qty || 1)}</td>
                    <td style="padding: 10px; text-align: right; font-weight: 700; color: #047857;">\${rupiah(item.profit || 0)}</td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      \`;
      document.getElementById('explorationGrid').insertAdjacentHTML('beforeend', cardHtml);
    };

    const renderWeekdayCard = () => {
      const id = 'weekdaySales';
      const size = getChartSize(id, 4);
      addCardToGrid('explorationGrid', 'Pola Hari', 'Hari mana yang paling menghasilkan.', id, size);
      if (typeof Chart === 'undefined') return;
      try {
        const chart = new Chart(document.getElementById(id), {
          type: 'bar',
          data: {
            labels: chartData.weekdaySales.map(d => d.name),
            datasets: [{
              data: chartData.weekdaySales.map(d => d.sales),
              backgroundColor: '#276749',
              borderRadius: 6
            }]
          },
          options: {
            ...baseOptions,
            scales: {
              y: axisOptions,
              x: { grid: { display: false }, ticks: { color: '#344054' } }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) {
        console.error(e);
      }
    };

    const renderParetoCard = () => {
      const id = 'pareto';
      const size = getChartSize(id, 12);
      const data = activePareto.products.items.slice(0, 30);
      
      addCardToGrid('explorationGrid', 'Pareto Produk (80/20 Rule)', 'Top 20% produk menyumbang ' + activePareto.products.top20Share.toFixed(1) + '% omzet.', id, size);
      
      if (typeof Chart === 'undefined') return;
      try {
        const chart = new Chart(document.getElementById(id), {
          type: 'bar',
          data: {
            labels: data.map(d => d.name),
            datasets: [
              {
                type: 'line',
                label: 'Akumulasi %',
                data: data.map(d => d.cumulativeShare),
                borderColor: '#A7B8AE',
                borderWidth: 2,
                yAxisID: 'yPercentage',
                pointRadius: 2,
                fill: false
              },
              {
                type: 'bar',
                label: 'Omzet',
                data: data.map(d => d.sales),
                backgroundColor: '#276749',
                borderRadius: 4,
                yAxisID: 'ySales'
              }
            ]
          },
          options: {
            ...baseOptions,
            plugins: {
              legend: { display: true, position: 'top', labels: { boxWidth: 10, color: '#344054' } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    if (ctx.dataset.type === 'line') return ctx.dataset.label + ': ' + ctx.raw.toFixed(1) + '%';
                    return ctx.dataset.label + ': ' + rupiah(ctx.raw);
                  }
                }
              }
            },
            scales: {
              ySales: {
                type: 'linear',
                position: 'left',
                grid: { color: '#e8ecef' },
                ticks: { color: '#667085', callback: (value) => shortCurrency(value) }
              },
              yPercentage: {
                type: 'linear',
                position: 'right',
                min: 0,
                max: 100,
                grid: { display: false },
                ticks: { color: '#667085', callback: (value) => value + '%' }
              },
              x: { grid: { display: false }, ticks: { color: '#344054', maxRotation: 45, minRotation: 45 } }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) {
        console.error(e);
      }
    };

    const renderHourlyCard = () => {
      const id = 'hourlySales';
      const size = getChartSize(id, 12);
      addCardToGrid('explorationGrid', 'Analisis Jam Sibuk', 'Distribusi transaksi berdasarkan jam.', id, size);
      
      if (typeof Chart === 'undefined') return;
      try {
        const chart = new Chart(document.getElementById(id), {
          type: 'bar',
          data: {
            labels: chartData.hourlySales.map(d => d.name),
            datasets: [
              {
                type: 'line',
                label: 'Transaksi',
                data: chartData.hourlySales.map(d => d.transactions),
                borderColor: '#A7B8AE',
                borderWidth: 2,
                yAxisID: 'yTransactions',
                pointRadius: 3,
                fill: false
              },
              {
                type: 'bar',
                label: 'Omzet',
                data: chartData.hourlySales.map(d => d.sales),
                backgroundColor: '#276749',
                borderRadius: 4,
                yAxisID: 'ySales'
              }
            ]
          },
          options: {
            ...baseOptions,
            plugins: {
              legend: { display: true, position: 'top', labels: { boxWidth: 10, color: '#344054' } },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    if (ctx.dataset.type === 'line') return ctx.dataset.label + ': ' + ctx.raw + ' order';
                    return ctx.dataset.label + ': ' + rupiah(ctx.raw);
                  }
                }
              }
            },
            scales: {
              ySales: {
                type: 'linear',
                position: 'left',
                grid: { color: '#e8ecef' },
                ticks: { color: '#667085', callback: (value) => shortCurrency(value) }
              },
              yTransactions: {
                type: 'linear',
                position: 'right',
                grid: { display: false },
                ticks: { color: '#667085', stepSize: 1 }
              },
              x: { grid: { display: false }, ticks: { color: '#344054' } }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) {
        console.error(e);
      }
    };

    const renderBasketSizeCard = () => {
      const id = 'basketSize';
      const size = getChartSize(id, 4);
      addCardToGrid('explorationGrid', 'Ukuran Keranjang', 'Distribusi nominal transaksi pelanggan.', id, size);
      
      if (typeof Chart === 'undefined') return;
      try {
        const chart = new Chart(document.getElementById(id), {
          type: 'bar',
          data: {
            labels: chartData.basketSize.map(d => d.name),
            datasets: [{
              data: chartData.basketSize.map(d => d.count),
              backgroundColor: '#276749',
              borderRadius: 4
            }]
          },
          options: {
            ...baseOptions,
            scales: {
              y: { grid: { color: '#e8ecef' }, ticks: { color: '#667085', stepSize: 1 } },
              x: { grid: { display: false }, ticks: { color: '#344054' } }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) {
        console.error(e);
      }
    };

    const renderProductMatrixCard = () => {
      const id = 'productMatrix';
      const size = getChartSize(id, 12);
      addCardToGrid('explorationGrid', 'Product Portfolio: Volume vs Margin', 'Memetakan produk yang laku, profitable, atau perlu evaluasi.', id, size);
      
      if (typeof Chart === 'undefined') return;
      try {
        const chart = new Chart(document.getElementById(id), {
          type: 'scatter',
          data: {
            datasets: [{
              label: 'Produk',
              data: chartData.productMatrix.map(d => ({ x: d.x, y: d.y, name: d.name, z: d.z })),
              backgroundColor: 'rgba(39, 103, 73, 0.7)',
              borderColor: '#276749',
              pointRadius: 6
            }]
          },
          options: {
            ...baseOptions,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const d = ctx.raw;
                    return [
                      d.name,
                      'Terjual: ' + d.x + ' qty',
                      'Margin: ' + d.y.toFixed(1) + '%',
                      'Omzet: ' + rupiah(d.z)
                    ];
                  }
                }
              }
            },
            scales: {
              x: {
                type: 'linear',
                position: 'bottom',
                title: { display: true, text: 'Jumlah Terjual (Qty)', color: '#667085', font: { size: 11 } },
                grid: { color: '#e8ecef' },
                ticks: { color: '#667085' }
              },
              y: {
                type: 'linear',
                title: { display: true, text: 'Profit Margin (%)', color: '#667085', font: { size: 11 } },
                grid: { color: '#e8ecef' },
                ticks: { color: '#667085', callback: (value) => value + '%' }
              }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) {
        console.error(e);
      }
    };

    const renderCrossCategoryBranchCard = () => {
      const id = 'crossCategoryBranch';
      const size = getChartSize(id, 6);
      const data = chartData.crossCategoryBranch;
      const categories = data.categories || [];
      
      addCardToGrid('deepDiveGrid', 'Penjualan Kategori per Cabang', 'Komposisi penjualan tiap kategori di masing-masing cabang.', id, size);
      
      if (typeof Chart === 'undefined') return;
      try {
        const datasets = categories.map((cat, idx) => ({
          label: cat,
          data: data.map(d => d[cat] || 0),
          backgroundColor: palette[idx % palette.length],
          borderRadius: 4
        }));
        
        const chart = new Chart(document.getElementById(id), {
          type: 'bar',
          data: {
            labels: data.map(d => d.name),
            datasets: datasets
          },
          options: {
            ...baseOptions,
            indexAxis: 'y',
            plugins: {
              legend: { display: true, position: 'top', labels: { boxWidth: 10, color: '#344054', font: { size: 11 } } }
            },
            scales: {
              x: {
                stacked: true,
                grid: { color: '#e8ecef' },
                ticks: { color: '#667085', callback: (value) => shortCurrency(value) }
              },
              y: {
                stacked: true,
                grid: { display: false },
                ticks: { color: '#344054' }
              }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) {
        console.error(e);
      }
    };

    const renderCrossTimeCategoryCard = () => {
      const id = 'crossTimeCategory';
      const size = getChartSize(id, 6);
      const data = chartData.crossTimeCategory;
      const categories = data.categories || [];
      
      addCardToGrid('deepDiveGrid', 'Kepadatan Kategori per Jam', 'Waktu terbaik untuk mempromosikan kategori tertentu.', id, size);
      
      if (typeof Chart === 'undefined') return;
      try {
        const datasets = categories.map((cat, idx) => ({
          label: cat,
          data: data.map(d => d[cat] || 0),
          backgroundColor: palette[idx % palette.length] + '44',
          borderColor: palette[idx % palette.length],
          borderWidth: 1.5,
          fill: true,
          tension: 0.3
        }));
        
        const chart = new Chart(document.getElementById(id), {
          type: 'line',
          data: {
            labels: data.map(d => d.name),
            datasets: datasets
          },
          options: {
            ...baseOptions,
            plugins: {
              legend: { display: true, position: 'top', labels: { boxWidth: 10, color: '#344054', font: { size: 11 } } }
            },
            scales: {
              x: {
                stacked: true,
                grid: { display: false },
                ticks: { color: '#344054' }
              },
              y: {
                stacked: true,
                grid: { color: '#e8ecef' },
                ticks: { color: '#667085', callback: (value) => shortCurrency(value) }
              }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) {
        console.error(e);
      }
    };

    const renderDiscountCard = () => {
      const id = 'discount';
      const size = getChartSize(id, 6);
      const data = chartData.discountEffectiveness;
      
      addCardToGrid('deepDiveGrid', 'Efektivitas Diskon', 'Korelasi antara nominal diskon dan volume pembelian.', id, size);
      
      if (typeof Chart === 'undefined') return;
      try {
        const chart = new Chart(document.getElementById(id), {
          type: 'scatter',
          data: {
            datasets: [{
              label: 'Produk',
              data: data.map(d => ({ x: d.x, y: d.y, z: d.z, name: d.name })),
              backgroundColor: 'rgba(139, 92, 246, 0.7)',
              borderColor: '#276749',
              pointRadius: 5
            }]
          },
          options: {
            ...baseOptions,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const d = ctx.raw;
                    return [
                      d.name,
                      'Nominal Diskon: ' + rupiah(d.x),
                      'Volume: ' + d.y + ' qty',
                      'Total Omzet: ' + rupiah(d.z)
                    ];
                  }
                }
              }
            },
            scales: {
              x: {
                type: 'linear',
                position: 'bottom',
                title: { display: true, text: 'Diskon (Rp)', color: '#667085', font: { size: 11 } },
                grid: { color: '#e8ecef' },
                ticks: { color: '#667085', callback: (value) => shortCurrency(value) }
              },
              y: {
                type: 'linear',
                title: { display: true, text: 'Volume (Qty)', color: '#667085', font: { size: 11 } },
                grid: { color: '#e8ecef' },
                ticks: { color: '#667085' }
              }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) {
        console.error(e);
      }
    };

    // Helper: Stacked bar chart for cross-dimension data (paymentProviderShare, customerLoyaltyMix)
    const renderStackedBarCard = (title, desc, id, data) => {
      if (!data || !data.length || !data.categories) return;
      const size = getChartSize(id, 6);
      addCardToGrid('explorationGrid', title, desc, id, size);
      const box = document.getElementById(id + 'Box');
      if (box) box.style.height = '220px';
      if (typeof Chart === 'undefined') return;
      try {
        const categories = data.categories;
        const colors = ['#276749', '#A7B8AE', '#059669', '#34d399', '#6ee7b7', '#d1fae5', '#047857', '#065f46'];
        const datasets = categories.map((cat, idx) => ({
          label: cat,
          data: data.map(row => row[cat] || 0),
          backgroundColor: colors[idx % colors.length],
          borderRadius: idx === categories.length - 1 ? 4 : 0,
        }));
        const chart = new Chart(document.getElementById(id), {
          type: 'bar',
          data: { labels: data.map(d => d.name), datasets },
          options: {
            ...baseOptions,
            plugins: { ...baseOptions.plugins, legend: { display: true, position: 'bottom', labels: { boxWidth: 10, color: '#344054' } } },
            scales: {
              x: { stacked: true, grid: { display: false }, ticks: { color: '#344054' } },
              y: { stacked: true, ...axisOptions }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) { console.error(e); }
    };

    // Helper: Composed chart with bar + line (courierEfficiency, promoRoi)
    const renderComposedCard = (title, desc, id, data, series) => {
      if (!data || !data.length) return;
      const size = getChartSize(id, 6);
      addCardToGrid('explorationGrid', title, desc, id, size);
      const box = document.getElementById(id + 'Box');
      if (box) box.style.height = '220px';
      if (typeof Chart === 'undefined') return;
      try {
        const datasets = series.map(s => ({
          type: s.type,
          label: s.label,
          data: data.map(d => d[s.key] || 0),
          backgroundColor: s.type === 'bar' ? s.color : 'transparent',
          borderColor: s.type === 'line' ? s.color : 'transparent',
          borderWidth: s.type === 'line' ? 2 : 0,
          yAxisID: s.yAxisID,
          fill: false,
          pointRadius: s.type === 'line' ? 3 : 0,
          borderRadius: s.type === 'bar' ? 4 : 0,
        }));
        const chart = new Chart(document.getElementById(id), {
          type: 'bar',
          data: { labels: data.map(d => d.name), datasets },
          options: {
            ...baseOptions,
            plugins: { ...baseOptions.plugins, legend: { display: true, position: 'top', labels: { boxWidth: 10, color: '#344054' } } },
            scales: {
              left: { ...axisOptions, position: 'left' },
              right: { ...axisOptions, position: 'right', grid: { drawOnChartArea: false } },
              x: { grid: { display: false }, ticks: { color: '#344054' } }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) { console.error(e); }
    };

    // Helper: Bubble chart for variantProfitability (margin vs qty, bubble size = sales)
    const renderBubbleCard = (title, desc, id, data) => {
      if (!data || !data.length) return;
      const size = getChartSize(id, 6);
      addCardToGrid('explorationGrid', title, desc, id, size);
      const box = document.getElementById(id + 'Box');
      if (box) box.style.height = '220px';
      if (typeof Chart === 'undefined') return;
      try {
        const bubbleData = data.map((d) => ({ x: d.margin || 0, y: d.qty || 0, r: Math.max(4, Math.min(30, Math.sqrt((d.sales || 0) / 10000))) }));
        const chart = new Chart(document.getElementById(id), {
          type: 'bubble',
          data: {
            datasets: [{
              label: 'Varian',
              data: bubbleData,
              backgroundColor: 'rgba(39, 103, 73, 0.5)',
              borderColor: '#276749',
              borderWidth: 1
            }]
          },
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const d = data[ctx.dataIndex];
                    return (d.name || '') + ' | Margin: ' + (d.margin || 0) + '% | Qty: ' + number(d.qty || 0) + ' | Omzet: ' + rupiah(d.sales || 0);
                  }
                }
              }
            },
            scales: {
              x: { ...axisOptions, title: { display: true, text: 'Margin %', color: '#667085' } },
              y: { ...axisOptions, title: { display: true, text: 'Kuantitas', color: '#667085' } }
            }
          }
        });
        chartInstances.push(chart);
      } catch (e) { console.error(e); }
    };

    const renderCard = (id) => {
      if (payload.hiddenCharts.includes(id)) return;
      const keyVal = active.metricView === 'quantity' ? 'qty' : 'sales';
      
      switch (id) {
        case 'pareto':
          if (payload.dimensions.product && activePareto.products.items.length) {
            renderParetoCard();
          }
          break;
        case 'topProducts':
          if (payload.dimensions.product) {
            renderBreakdown('Product Revenue Drivers', 'Kontributor omzet terbesar berdasarkan data produk yang tersedia.', 'topProducts', chartData.topProducts, '#276749', 'produk', keyVal, false, 4);
          }
          break;
        case 'dataTable':
          if (payload.dimensions.product) {
            renderDataTableCard();
          }
          break;
        case 'staffSales':
          if (payload.dimensions.staff) {
            renderBreakdown('Staff Revenue Contribution', 'Kontribusi omzet per staff untuk membaca kapasitas dan ketergantungan operasional.', 'staffSales', chartData.staffSales, '#276749', 'staff', keyVal, false, 6);
          }
          break;
        case 'brandSales':
          if (payload.dimensions.brand) {
            renderBreakdown('Brand Revenue Contribution', 'Kontribusi omzet per brand atau merek.', 'brandSales', chartData.brandSales, '#276749', 'brand', keyVal, false, 4);
          }
          break;
        case 'supplierSales':
          if (payload.dimensions.supplier) {
            renderBreakdown('Supplier Revenue Contribution', 'Kontribusi omzet dari pemasok untuk evaluasi portofolio supplier.', 'supplierSales', chartData.supplierSales, '#276749', 'supplier', keyVal, false, 4);
          }
          break;
        case 'categorySales':
          if (payload.dimensions.category) {
            renderBreakdown('Category Revenue Mix', 'Komposisi omzet antar kategori untuk membaca portofolio penjualan.', 'categorySales', chartData.categorySales, '#276749', 'kategori', keyVal, false, 4);
          }
          break;
        case 'channelSales':
          if (payload.dimensions.channel) {
            renderBreakdown('Channel Revenue Mix', 'Porsi omzet dari setiap sumber penjualan dan potensi ketergantungan channel.', 'channelSales', chartData.channelSales, '#276749', 'channel', 'value', true, 4);
          }
          break;
        case 'branchSales':
          if (payload.dimensions.branch) {
            renderBreakdown('Branch / Outlet Performance', 'Perbandingan kontribusi omzet antar lokasi atau cabang.', 'branchSales', chartData.branchSales, '#276749', 'cabang', keyVal, false, 4);
          }
          break;
        case 'paymentMethods':
          if (payload.dimensions.paymentMethod) {
            renderBreakdown('Payment Method Mix', 'Preferensi metode pembayaran dan komposisi transaksi.', 'paymentMethods', chartData.paymentMethods, '#276749', 'metode', 'value', true, 4);
          }
          break;
        case 'serviceDuration':
          if (payload.dimensions.duration) {
            renderBreakdown('Durasi Layanan', 'Rata-rata menit per layanan.', 'serviceDuration', chartData.serviceDuration, '#276749', 'layanan', keyVal, false, 4);
          }
          break;
        case 'weekdaySales':
          if (payload.dimensions.date && chartData.weekdaySales.length) {
            renderWeekdayCard();
          }
          break;
        case 'citySales':
          if (payload.dimensions.city) {
            renderBreakdown('Kota Pengiriman', 'Wilayah pelanggan terbaik.', 'citySales', chartData.citySales, '#276749', 'kota', keyVal, false, 4);
          }
          break;
        case 'hourlySales':
          if (payload.dimensions.time && chartData.hourlySales.length) {
            renderHourlyCard();
          }
          break;
        case 'basketSize':
          if (chartData.basketSize.length) {
            renderBasketSizeCard();
          }
          break;
        case 'productMatrix':
          if (chartData.productMatrix.length) {
            renderProductMatrixCard();
          }
          break;
        case 'promoCampaign':
          if (chartData.promoCampaign.length) {
            renderBreakdown('Promo Campaign Performance', 'Efektivitas promo terhadap omzet.', 'promoCampaign', chartData.promoCampaign, '#276749', 'promo', keyVal, false, 4);
          }
          break;
        case 'customerSegment':
          if (chartData.customerSegment.length) {
            renderBreakdown('Customer Segment', 'Distribusi segmen pelanggan.', 'customerSegment', chartData.customerSegment, '#276749', 'segmen', 'value', true, 4);
          }
          break;
        case 'variantPopularity':
          if (chartData.variantPopularity.length) {
            renderBreakdown('Variant Popularity', 'Popularitas varian produk.', 'variantPopularity', chartData.variantPopularity, '#276749', 'varian', keyVal, false, 4);
          }
          break;
        case 'orderFulfillment':
          if (chartData.orderFulfillment.length) {
            renderBreakdown('Order Fulfillment', 'Status pemenuhan pesanan.', 'orderFulfillment', chartData.orderFulfillment, '#276749', 'status', 'value', true, 4);
          }
          break;
        case 'orderTypeMix':
          if (chartData.orderTypeMix.length) {
            renderBreakdown('Order Type Mix', 'Komposisi tipe pesanan.', 'orderTypeMix', chartData.orderTypeMix, '#276749', 'tipe', 'value', true, 4);
          }
          break;
        case 'paymentProviderShare':
          if (chartData.paymentProviderShare && chartData.paymentProviderShare.length) {
            renderStackedBarCard('Payment Provider Share', 'Komposisi penyedia pembayaran per metode.', 'paymentProviderShare', chartData.paymentProviderShare);
          }
          break;
        case 'courierEfficiency':
          if (chartData.courierEfficiency.length) {
            renderComposedCard('Courier Efficiency', 'Perbandingan omzet vs ongkir per kurir.', 'courierEfficiency', chartData.courierEfficiency, [
              { type: 'bar', key: 'sales', label: 'Omzet', color: '#276749', yAxisID: 'left' },
              { type: 'line', key: 'fee', label: 'Ongkir', color: '#A7B8AE', yAxisID: 'right' }
            ]);
          }
          break;
        case 'tableRevenue':
          if (chartData.tableRevenue.length) {
            renderBreakdown('Table Revenue', 'Omzet per nomor meja.', 'tableRevenue', chartData.tableRevenue, '#276749', 'meja', keyVal, false, 6);
          }
          break;
        case 'promoRoi':
          if (chartData.promoRoi.length) {
            renderComposedCard('Promo ROI', 'Perbandingan omzet bersih vs diskon per promo.', 'promoRoi', chartData.promoRoi, [
              { type: 'bar', key: 'sales', label: 'Omzet Bersih', color: '#276749', yAxisID: 'left' },
              { type: 'line', key: 'discount', label: 'Diskon', color: '#e11d48', yAxisID: 'right' }
            ]);
          }
          break;
        case 'customerLoyaltyMix':
          if (chartData.customerLoyaltyMix && chartData.customerLoyaltyMix.length) {
            renderStackedBarCard('Customer Loyalty Mix', 'Komposisi kategori per segmen loyalitas.', 'customerLoyaltyMix', chartData.customerLoyaltyMix);
          }
          break;
        case 'variantProfitability':
          if (chartData.variantProfitability.length) {
            renderBubbleCard('Variant Profitability', 'Profitabilitas varian: Margin % vs Qty vs Omzet.', 'variantProfitability', chartData.variantProfitability);
          }
          break;
      }
    };

    const renderKpiCard = (title, value, helper, tone, growthVal, growthLabel) => {
      let growthBadge = '';
      if (growthVal !== null && growthVal !== undefined) {
        const isPositive = growthVal > 0;
        const isNegative = growthVal < 0;
        const colorClass = isPositive ? 'background: #DCF4E7; color: #276749;' : isNegative ? 'background: #FEE2E2; color: #991B1B;' : 'background: #F1F5F9; color: #64748B;';
        const arrow = isPositive ? '↑' : isNegative ? '↓' : '->';
        growthBadge = \`
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 4px;">
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 999px; \${colorClass}">
              \${arrow} \${Math.abs(growthVal).toFixed(1)}%
            </span>
            \${growthLabel ? \`<span style="font-size: 10px; font-weight: 600; color: #94a3b8; margin-left: 8px;">\${growthLabel}</span>\` : ''}
          </div>
        \`;
      }
      
      const toneColors = {
        emerald: 'background: #F1FAF5; color: #276749; border-color: #BFEAD1;',
        blue: 'background: #F1FAF5; color: #276749; border-color: #BFEAD1;',
        amber: 'background: #F1FAF5; color: #276749; border-color: #BFEAD1;',
        violet: 'background: #F1FAF5; color: #276749; border-color: #BFEAD1;',
        cyan: 'background: #F1FAF5; color: #276749; border-color: #BFEAD1;',
        rose: 'background: #F1FAF5; color: #276749; border-color: #BFEAD1;',
        orange: 'background: #F1FAF5; color: #276749; border-color: #BFEAD1;',
        slate: 'background: #F8FAF6; color: #475569; border-color: #E2E8F0;'
      };
      
      const colorStyle = toneColors[tone] || toneColors.slate;
      
      return \`
        <div class="kpi">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px; width: 100%;">
            <div style="min-width: 0;">
              <span class="title">\${title}</span>
              <span class="helper" title="\${helper}">\${helper}</span>
            </div>
            <div style="width: 26px; height: 26px; border-radius: 6px; border: 1px solid; display: flex; align-items: center; justify-content: center; shrink-0; \${colorStyle}">
              <span style="font-size: 14px; font-weight: 700;">\u2022</span>
            </div>
          </div>
          <div style="margin-top: 4px; display: flex; flex-direction: column; align-items: start; width: 100%;">
            <strong class="value">\${value}</strong>
            \${growthBadge}
          </div>
        </div>
      \`;
    };

    const render = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      destroyCharts();
      const state = compute();
      chartData = state.charts;
      activePareto = state.pareto;
      document.getElementById('businessBadge').textContent = payload.businessType;
      document.getElementById('dateBadge').textContent = payload.dateRange ? payload.dateRange.start + ' - ' + payload.dateRange.end : 'Periode tidak tersedia';
      document.getElementById('rowInfo').textContent = 'Menganalisis ' + number(state.rowStats.filteredRows) + ' dari ' + number(state.rowStats.totalRows) + ' baris data.';
      
      const kpisHtml = [];
      const growth = state.kpis.growth || {};
      const growthLabel = growth.label || '';
      
      kpisHtml.push(renderKpiCard('Omzet', rupiah(state.kpis.totalOmzet), 'Total nilai penjualan', 'emerald', growth.omzet, growthLabel));
      
      if (payload.dimensions.returns) {
        kpisHtml.push(renderKpiCard('Net Revenue', rupiah(state.kpis.netRevenue), 'Setelah retur/diskon', 'emerald', growth.retur, growthLabel));
      }
      
      kpisHtml.push(renderKpiCard('Transaksi', number(state.kpis.totalTransaksi), 'Nota/order unik', 'blue', growth.transaksi, growthLabel));
      
      if (payload.dimensions.profit) {
        kpisHtml.push(renderKpiCard('Laba Kotor', rupiah(state.kpis.totalProfit), 'Margin ' + state.kpis.profitMargin.toFixed(1) + '%', 'emerald', growth.profit, growthLabel));
      }
      if (state.kpis.totalDiskon > 0) {
        kpisHtml.push(renderKpiCard('Diskon', rupiah(state.kpis.totalDiskon), 'Potongan harga', 'rose', growth.diskon, growthLabel));
      }
      if (state.kpis.totalOngkir > 0) {
        kpisHtml.push(renderKpiCard('Ongkir', rupiah(state.kpis.totalOngkir), 'Biaya pengiriman', 'orange', growth.ongkir, growthLabel));
      }
      if (payload.dimensions.commission && state.kpis.totalCommission > 0) {
        kpisHtml.push(renderKpiCard('Komisi Staff', rupiah(state.kpis.totalCommission), 'Insentif staff', 'blue', growth.commission, growthLabel));
      }
      if (payload.dimensions.tax && state.kpis.totalTax > 0) {
        kpisHtml.push(renderKpiCard('Pajak / PPN', rupiah(state.kpis.totalTax), 'Pajak dikenakan', 'slate', growth.tax, growthLabel));
      }
      if (payload.dimensions.serviceCharge && state.kpis.totalServiceCharge > 0) {
        kpisHtml.push(renderKpiCard('Service Charge', rupiah(state.kpis.totalServiceCharge), 'Biaya layanan', 'slate', growth.serviceCharge, growthLabel));
      }
      if (payload.dimensions.platformFee && state.kpis.totalPlatformFee > 0) {
        kpisHtml.push(renderKpiCard('Fee Platform', rupiah(state.kpis.totalPlatformFee), 'Biaya aplikasi', 'slate', growth.platformFee, growthLabel));
      }
      if (payload.dimensions.rating) {
        kpisHtml.push(renderKpiCard('Rating', state.kpis.avgRating.toFixed(1), 'Rata-rata ulasan', 'amber', growth.rating, growthLabel));
      }
      
      kpisHtml.push(
        renderKpiCard('Rata-rata Order', rupiah(state.kpis.avgTransaksi), 'AOV', 'amber', growth.aov, growthLabel),
        payload.dimensions.product ? renderKpiCard('Unit Terjual', number(state.kpis.produkTerjual), state.kpis.avgItems.toFixed(1) + ' item/transaksi', 'violet', growth.qty, growthLabel) : '',
        payload.dimensions.customer ? renderKpiCard('Pelanggan', number(state.kpis.jumlahPelanggan), 'Pelanggan unik', 'cyan', growth.customers, growthLabel) : '',
        renderKpiCard('Data Terpakai', state.rowStats.filteredRows + '/' + state.rowStats.totalRows, 'Baris setelah filter', 'slate', null, '')
      );
      
      document.getElementById('kpiGrid').innerHTML = kpisHtml.filter(Boolean).join('');
      
      document.getElementById('insightList').innerHTML = state.insights.map(i => \`
        <div class="insight-item">
          <p> <strong>Info:</strong> \${i.text}</p>
        </div>
      \`).join('');
      
      if (typeof Chart !== 'undefined') {
        try {
          const trendDatasets = [];
          
          if (active.metricView === 'quantity') {
            trendDatasets.push({
              label: 'Kuantitas',
              data: chartData.trendSales.map(d => d.sales),
              borderColor: '#276749',
              backgroundColor: 'rgba(39, 103, 73, 0.12)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              yAxisID: 'y'
            });
            trendDatasets.push({
              label: 'Prediksi Kuantitas',
              data: chartData.trendSales.map(d => d.forecastSales !== undefined && d.forecastSales !== null ? d.forecastSales : null),
              borderColor: '#276749',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'y'
            });
          } else {
            trendDatasets.push({
              label: 'Omzet',
              data: chartData.trendSales.map(d => d.sales),
              borderColor: '#276749',
              backgroundColor: 'rgba(39, 103, 73, 0.12)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              yAxisID: 'y'
            });
            trendDatasets.push({
              label: 'Prediksi Omzet',
              data: chartData.trendSales.map(d => d.forecastSales !== undefined && d.forecastSales !== null ? d.forecastSales : null),
              borderColor: '#276749',
              borderWidth: 2,
              borderDash: [5, 5],
              fill: false,
              tension: 0.4,
              spanGaps: true,
              yAxisID: 'y'
            });
          }

          trendDatasets.push({
            label: 'Transaksi',
            data: chartData.trendSales.map(d => d.transactions),
            borderColor: '#4299e1',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          });

          trendDatasets.push({
            label: 'Prediksi Transaksi',
            data: chartData.trendSales.map(d => d.forecastTransactions !== undefined && d.forecastTransactions !== null ? d.forecastTransactions : null),
            borderColor: '#4299e1',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            spanGaps: true,
            yAxisID: 'y1'
          });

          const trendChart = new Chart(document.getElementById('trendChart'), {
            type: 'line',
            data: {
              labels: chartData.trendSales.map(d => d.date),
              datasets: trendDatasets
            },
            options: {
              ...baseOptions,
              scales: {
                y: {
                  ...axisOptions,
                  position: 'left',
                  title: { display: true, text: active.metricView === 'quantity' ? 'Kuantitas' : 'Omzet' }
                },
                y1: {
                  grid: { drawOnChartArea: false },
                  position: 'right',
                  ticks: { color: '#667085', callback: (value) => number(value) },
                  title: { display: true, text: 'Transaksi' }
                },
                x: { grid: { display: false }, ticks: { color: '#667085' } }
              }
            }
          });
          chartInstances.push(trendChart);
        } catch (e) {
          console.error("Gagal menggambar grafik Tren Omzet:", e);
        }
      }

      const hasVisibleDeepDive = (payload.dimensions.category && payload.dimensions.branch && !payload.hiddenCharts.includes('crossCategoryBranch')) ||
                                 (payload.dimensions.time && payload.dimensions.category && !payload.hiddenCharts.includes('crossTimeCategory')) ||
                                 (payload.dimensions.discount && !payload.hiddenCharts.includes('discount'));
      
      const deepEl = document.getElementById('deepDiveSection');
      if (hasVisibleDeepDive && deepEl) {
        deepEl.innerHTML = '\\n          <h2 style="font-size: 18px; font-weight: 800; margin: 24px 4px 8px; color: #0f172a;">Analisis Lintas-Dimensi (Deep Dive)</h2>\\n          <div class="grid-container" id="deepDiveGrid"></div>\\n        ';
        if (payload.dimensions.category && payload.dimensions.branch && !payload.hiddenCharts.includes('crossCategoryBranch')) {
          renderCrossCategoryBranchCard();
        }
        if (payload.dimensions.time && payload.dimensions.category && !payload.hiddenCharts.includes('crossTimeCategory')) {
          renderCrossTimeCategoryCard();
        }
        if (payload.dimensions.discount && !payload.hiddenCharts.includes('discount')) {
          renderDiscountCard();
        }
      } else if (deepEl) {
        deepEl.innerHTML = '';
      }

      const hasVisibleExploration = payload.chartOrder.some(id => !payload.hiddenCharts.includes(id));
      const expEl = document.getElementById('explorationSection');
      if (hasVisibleExploration && expEl) {
        expEl.innerHTML = '\\n          <h2 style="font-size: 18px; font-weight: 800; margin: 28px 4px 8px; color: #0f172a;">Eksplorasi Detil</h2>\\n          <div class="grid-container" id="explorationGrid"></div>\\n        ';
        payload.chartOrder.forEach(id => {
          renderCard(id);
        });
      } else if (expEl) {
        expEl.innerHTML = '';
      }
      window.scrollTo(0, scrollY);
    };

    const handleCrossFilter = (dimension, value) => {
      const cleanVal = String(value || '').trim();
      if (dimension === 'kategori') active.category = active.category === cleanVal ? 'all' : cleanVal;
      if (dimension === 'channel') active.channel = active.channel === cleanVal ? 'all' : cleanVal;
      if (dimension === 'cabang') active.branch = active.branch === cleanVal ? 'all' : cleanVal;
      if (dimension === 'metode') active.payment = active.payment === cleanVal ? 'all' : cleanVal;
      
      const catEl = document.getElementById('categoryFilter');
      if (catEl) catEl.value = active.category;
      const chEl = document.getElementById('channelFilter');
      if (chEl) chEl.value = active.channel;
      const brEl = document.getElementById('branchFilter');
      if (brEl) brEl.value = active.branch;
      const payEl = document.getElementById('paymentFilter');
      if (payEl) payEl.value = active.payment;
      
      render();
    };
    window.handleCrossFilter = handleCrossFilter;

    const setupMetricToggle = () => {
      const revBtn = document.getElementById('toggleRevenue');
      const qtyBtn = document.getElementById('toggleQuantity');
      if (!revBtn || !qtyBtn) return;
      
      const updateMetricToggleUI = () => {
        if (active.metricView === 'quantity') {
          revBtn.style.background = 'transparent';
          revBtn.style.color = '#64748b';
          revBtn.style.boxShadow = 'none';
          
          qtyBtn.style.background = '#fff';
          qtyBtn.style.color = '#276749';
          qtyBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
        } else {
          revBtn.style.background = '#fff';
          revBtn.style.color = '#276749';
          revBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
          
          qtyBtn.style.background = 'transparent';
          qtyBtn.style.color = '#64748b';
          qtyBtn.style.boxShadow = 'none';
        }
      };

      revBtn.addEventListener('click', () => {
        active.metricView = 'revenue';
        updateMetricToggleUI();
        render();
      });
      qtyBtn.addEventListener('click', () => {
        active.metricView = 'quantity';
        updateMetricToggleUI();
        render();
      });
      
      updateMetricToggleUI();
    };

    buildFilters();
    setupMetricToggle();
    render();
  </script>
</body>
</html>`;
}
