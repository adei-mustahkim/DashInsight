  // - - â‚¬- - â‚¬- - â‚¬ DynamicCrossCard - - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬
  // Komponen untuk grafik multi-dimensi (data pivot dengan beberapa series).
  // Mendukung 5 varian tampilan: stackedBar, groupedBar, multiLine, multiArea, multiRadar.
  const DynamicCrossCard = ({
    id,
    title,
    subtitle,
    data,           // array of pivot rows, e.g. [{name, Cat1, Cat2, ...}]
    categories,     // string[]  -  series keys (e.g. ['Makanan', 'Minuman'])
    preferred = 6,
    defaultView = 'stackedBar',
    viewType = 'auto',
    onViewTypeChange,
    onHide,
    draggable,
    onDragStart,
    onDragOver,
    onDrop,
  }) => {
    if (!data || data.length === 0 || !categories || categories.length === 0) return null;

    // resolve 'auto' -â€  sensible default based on data characteristics
    const resolvedView = viewType === 'auto' ? defaultView : viewType;
    const rotated = isChartRotated(id);
    const canRotate = resolvedView === 'stackedBar' || resolvedView === 'groupedBar';

    const setView = (next) => { if (onViewTypeChange) onViewTypeChange(id, next); };
    const categoryTotals = categories.map(cat => ({
      name: cat,
      total: data.reduce((sum, row) => sum + (Number(row[cat]) || 0), 0),
    })).sort((a, b) => b.total - a.total);
    const primaryCategories = categoryTotals.slice(0, 8).map(item => item.name);
    const omittedCategories = categoryTotals.slice(8).map(item => item.name);
    const chartCategories = omittedCategories.length ? [...primaryCategories, 'Lainnya'] : primaryCategories;
    const chartData = omittedCategories.length
      ? data.map(row => ({
        ...row,
        Lainnya: omittedCategories.reduce((sum, cat) => sum + (Number(row[cat]) || 0), 0),
      }))
      : data;

    const CROSS_VIEWS = [
      { key: 'stackedBar', label: 'Stacked', Icon: BarChart3, title: 'Stacked Bar  -  total + proporsi' },
      { key: 'groupedBar', label: 'Grouped', Icon: LayoutGrid, title: 'Grouped Bar  -  perbandingan head-to-head' },
      { key: 'multiLine', label: 'Line', Icon: Activity, title: 'Multi-Line  -  tren tiap kategori' },
      { key: 'multiArea', label: 'Area', Icon: TrendingUp, title: 'Multi-Area  -  volume berlapis' },
      { key: 'multiRadar', label: 'Radar', Icon: RadarIcon, title: 'Multi-Radar  -  keseimbangan antar dimensi' },
    ];

    const H = 300;

    return (
      <ChartCard
        id={id}
        onHide={onHide}
        onResize={handleResizeChart}
        preferredSize={preferred}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        draggable={draggable}
        title={title}
        subtitle={subtitle}
        style={getAdaptiveCardStyle(id, preferred)}
        action={
          <div className="flex bg-gray-100 p-0.5 rounded-md border border-gray-200 gap-0.5">
            {CROSS_VIEWS.map(({ key, label, Icon, title: tip }) => (
              <button
                type="button"
                key={key}
                onClick={() => setView(key)}
                title={tip}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-sm text-[10px] font-semibold transition-all
                  ${resolvedView === key
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
            {canRotate && (
              <button
                type="button"
                onClick={() => handleRotateChart(id)}
                className={`flex items-center gap-1 px-1.5 py-1 rounded-sm text-[10px] font-semibold transition-all ${rotated ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                title={rotated ? 'Putar ke horizontal' : 'Putar ke vertikal'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Putar</span>
              </button>
            )}
          </div>
        }
      >
        {omittedCategories.length > 0 && (
          <p className="mb-2 text-[11px] font-medium text-gray-500">
            Menampilkan {primaryCategories.length} series terbesar; {omittedCategories.length} lainnya digabung sebagai "Lainnya".
          </p>
        )}
        {/* - - â‚¬- - â‚¬ Stacked Bar (horizontal) - - â‚¬- - â‚¬ */}
        {resolvedView === 'stackedBar' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <BarChart data={chartData} layout={rotated ? undefined : 'vertical'} margin={rotated ? { left: 0, right: 20, top: 4, bottom: 62 } : { left: 10, right: 20, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={!rotated} vertical={rotated} stroke="#E8ECEF" />
              {rotated ? (
                <>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} angle={-35} textAnchor="end" height={62} interval={0} />
                  <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={62} axisLine={false} tickLine={false} />
                </>
              ) : (
                <>
                  <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                </>
              )}
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {chartCategories.map((cat, idx) => (
                <Bar key={cat} dataKey={cat} stackId="s" fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={idx === chartCategories.length - 1 ? (rotated ? [4, 4, 0, 0] : [0, 4, 4, 0]) : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* - - â‚¬- - â‚¬ Grouped Bar (horizontal) - - â‚¬- - â‚¬ */}
        {resolvedView === 'groupedBar' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <BarChart data={chartData} layout={rotated ? undefined : 'vertical'} margin={rotated ? { left: 0, right: 20, top: 4, bottom: 62 } : { left: 10, right: 20, top: 4, bottom: 4 }} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" horizontal={!rotated} vertical={rotated} stroke="#E8ECEF" />
              {rotated ? (
                <>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} angle={-35} textAnchor="end" height={62} interval={0} />
                  <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={62} axisLine={false} tickLine={false} />
                </>
              ) : (
                <>
                  <XAxis type="number" tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#344054' }} axisLine={false} tickLine={false} />
                </>
              )}
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {chartCategories.map((cat, idx) => (
                <Bar key={cat} dataKey={cat} fill={CHART_COLORS[idx % CHART_COLORS.length]} radius={rotated ? [4, 4, 0, 0] : [0, 4, 4, 0]} barSize={12} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* - - â‚¬- - â‚¬ Multi-Line - - â‚¬- - â‚¬ */}
        {resolvedView === 'multiLine' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={62} axisLine={false} tickLine={false} />
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {chartCategories.map((cat, idx) => (
                <Line key={cat} type="monotone" dataKey={cat} stroke={CHART_COLORS[idx % CHART_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* - - â‚¬- - â‚¬ Multi-Area (stacked) - - â‚¬- - â‚¬ */}
        {resolvedView === 'multiArea' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 4 }}>
              <defs>
                {chartCategories.map((cat, idx) => (
                  <linearGradient key={cat} id={`grad-${id}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.55} />
                    <stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8ECEF" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#667085' }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tickFormatter={shortCurrency} tick={{ fontSize: 11, fill: '#667085' }} width={62} axisLine={false} tickLine={false} />
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
              {chartCategories.map((cat, idx) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stackId="a"
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  fill={`url(#grad-${id}-${idx})`}
                  strokeWidth={1.5}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* - - â‚¬- - â‚¬ Multi-Radar - - â‚¬- - â‚¬ */}
        {resolvedView === 'multiRadar' && (
          <ResponsiveContainer width="100%" height={H} minWidth={1} minHeight={1}>
            <RadarChart cx="50%" cy="50%" outerRadius="38%" data={chartData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: '#667085' }} />
              <PolarRadiusAxis tick={false} axisLine={false} tickFormatter={shortCurrency} />
              {chartCategories.map((cat, idx) => (
                <Radar
                  key={cat}
                  name={cat}
                  dataKey={cat}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                  fillOpacity={0.22}
                  strokeWidth={1.5}
                />
              ))}
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              <RechartsTooltip formatter={(val) => formatRupiah(val)} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    );
  };
  // - - â‚¬- - â‚¬- - â‚¬ end DynamicCrossCard - - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬- - â‚¬
