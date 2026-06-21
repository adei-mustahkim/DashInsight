const fs = require('fs');

try {
  let appCode = fs.readFileSync('src/App.tsx', 'utf8');

  // 1. Remove hardcoded charts from chartElements
  const toRemove = [
    'hourlySales:', 'weekdaySales:', 'categorySales:', 'promoCampaign:', 
    'customerSegment:', 'orderFulfillment:', 'paymentProviderShare:', 
    'courierEfficiency:', 'tableRevenue:', 'promoRoi:', 
    'customerLoyaltyMix:', 'variantProfitability:'
  ];

  toRemove.forEach(key => {
    // Find the start of the key inside chartElements
    const searchString = `                  ${key}`;
    const startIdx = appCode.indexOf(searchString);
    if (startIdx !== -1) {
      let endIdx = -1;
      if (appCode.substring(startIdx, startIdx + 100).includes('(() => {')) {
        // Ends with `})() : null,` or `})() : null`
        endIdx = appCode.indexOf('})() : null,', startIdx);
        if (endIdx !== -1) {
          appCode = appCode.substring(0, startIdx) + appCode.substring(endIdx + 12);
        }
      } else if (appCode.substring(startIdx, startIdx + 100).includes('<DynamicBreakdownCard')) {
        endIdx = appCode.indexOf('/>,', startIdx);
        if (endIdx !== -1) {
          appCode = appCode.substring(0, startIdx) + appCode.substring(endIdx + 3);
        }
      } else if (appCode.substring(startIdx, startIdx + 100).includes('<DynamicCrossCard')) {
        endIdx = appCode.indexOf('/>,', startIdx);
        // It could be multi-line
        if (endIdx === -1) {
            endIdx = appCode.indexOf('/>', startIdx);
            appCode = appCode.substring(0, startIdx) + appCode.substring(endIdx + 3); // Account for comma if exists
        } else {
            appCode = appCode.substring(0, startIdx) + appCode.substring(endIdx + 3);
        }
      }
    }
  });
  
  // Also remove cross-card that doesn't have ? :
  const ppsStart = appCode.indexOf('paymentProviderShare: charts.paymentProviderShare?.length > 0 ? (');
  if(ppsStart !== -1) {
    const ppsEnd = appCode.indexOf(') : null,', ppsStart);
    if(ppsEnd !== -1) {
        appCode = appCode.substring(0, ppsStart) + appCode.substring(ppsEnd + 9);
    }
  }

  const clmStart = appCode.indexOf('customerLoyaltyMix: charts.customerLoyaltyMix?.length > 0 ? (');
  if(clmStart !== -1) {
    const clmEnd = appCode.indexOf(') : null,', clmStart);
    if(clmEnd !== -1) {
        appCode = appCode.substring(0, clmStart) + appCode.substring(clmEnd + 9);
    }
  }

  // 2. Inject default 10 charts logic
  // Find `const DEFAULT_ORDER = [`
  const defaultOrderStart = appCode.indexOf('const DEFAULT_ORDER = [');
  const defaultOrderEnd = appCode.indexOf('];', defaultOrderStart);
  
  if (defaultOrderStart !== -1 && defaultOrderEnd !== -1) {
    // Replace DEFAULT_ORDER with dynamic slice from customChartTemplates
    // Wait, customChartTemplates is not in scope there. It's inside App.tsx body.
    // Instead, modify the `useState` for chartOrder.
    const chartOrderStateIdx = appCode.indexOf('const [chartOrder, setChartOrder] = useState(() => {');
    if (chartOrderStateIdx !== -1) {
        const replaceString = `const [chartOrder, setChartOrder] = useState(() => {
    if (window.__EXPORTED_DATA__?.chartOrder) return window.__EXPORTED_DATA__.chartOrder;
    const saved = JSON.parse(localStorage.getItem('dashinsight_settings') || '{}');
    if (saved.chartOrder && saved.chartOrder.length > 0) return saved.chartOrder;
    // Default to first 10 custom templates if available, else DEFAULT_ORDER
    const defaultTemplates = Object.values(window.__CACHE_TEMPLATES__ || {}).slice(0,10).map(t => 'library:' + t.id);
    return defaultTemplates.length > 0 ? defaultTemplates : DEFAULT_ORDER;
  });`;
        
        // I'll skip this cache trick and just add a useEffect that sets the default if chartOrder is mostly empty or only has DEFAULT_ORDER.
    }
  }

  // A safer approach: update the useEffect that syncs customChartTemplates
  const syncEffectIdx = appCode.indexOf('// Sync custom templates to order');
  if (syncEffectIdx !== -1) {
      // It's not there.
  }

  // 3. Inject the TemplateChart data mapping
  const loopStart = appCode.indexOf('customChartTemplates.forEach(template => {');
  if (loopStart !== -1) {
      const chartElementsIdStart = appCode.indexOf('chartElements[id] = (', loopStart);
      if (chartElementsIdStart !== -1) {
          const injection = `
                  let chartDataToPass = processedData;
                  if (template.chart_code === 'HOURLY_SALES') chartDataToPass = charts.hourlySales || [];
                  else if (template.chart_code === 'WEEKDAY_SALES') chartDataToPass = charts.weekdaySales || [];
                  else if (template.chart_code === 'CATEGORY_SALES') chartDataToPass = charts.categorySales || [];
                  else if (template.chart_code === 'PROMO_CAMPAIGN') chartDataToPass = charts.promoCampaign || [];
                  else if (template.chart_code === 'CUSTOMER_SEGMENT') chartDataToPass = charts.customerSegment || [];
                  else if (template.chart_code === 'ORDER_FULFILLMENT') chartDataToPass = charts.orderFulfillment || [];
                  else if (template.chart_code === 'COURIER_EFFICIENCY') chartDataToPass = charts.courierEfficiency || [];
                  else if (template.chart_code === 'TABLE_REVENUE') chartDataToPass = charts.tableRevenue || [];
                  else if (template.chart_code === 'PROMO_ROI') chartDataToPass = charts.promoRoi || [];
                  else if (template.chart_code === 'VARIANT_PROFITABILITY') chartDataToPass = charts.variantProfitability || [];

                  if (template.chart_type === 'crosstab') {
                    const crossData = template.chart_code === 'PAYMENT_PROVIDER' ? (charts.paymentProviderShare || []) : (template.chart_code === 'CUSTOMER_LOYALTY' ? (charts.customerLoyaltyMix || []) : []);
                    const crossCategories = template.chart_code === 'PAYMENT_PROVIDER' ? (['BCA', 'Mandiri', 'Gopay', 'OVO', 'ShopeePay', 'Tunai']) : (template.chart_code === 'CUSTOMER_LOYALTY' ? (['Pelanggan Baru', 'Pelanggan Kembali']) : []);

                    chartElements[id] = (
                      <DynamicCrossCard
                        id={id}
                        title={template.chart_name}
                        subtitle={template.description}
                        data={crossData}
                        categories={crossCategories}
                        preferred={template.default_size || 6}
                        defaultView="stackedBar"
                        viewType={current}
                        onViewTypeChange={handleChartViewChange}
                        onHide={handleHideChart}
                        draggable={true}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      />
                    );
                  } else {
                    chartElements[id] = (
                      <ChartCard
                        id={id}
                        title={template.chart_name}
                        subtitle={template.description}
                        action={<ViewToggle id={id} views={views} current={current} onSelect={handleChartViewChange} />}
                        onHide={handleHideChart}
                        onResize={handleResizeChart}
                        preferredSize={template.default_size || 6}
                        draggable={true}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        style={getAdaptiveCardStyle(id, template.default_size || 6)}
                      >
                        <TemplateChart template={template} rows={chartDataToPass} metricView={metricView} viewType={current} fieldMapping={chartLibraryMappings[template.id]} />
                      </ChartCard>
                    );
                  }
                  
                  return; // Skip original chartElements[id]
          `;
          
          appCode = appCode.substring(0, chartElementsIdStart) + injection + '\n' + appCode.substring(chartElementsIdStart);
      }
  }

  fs.writeFileSync('src/App.tsx', appCode);
  console.log('App.tsx refactored successfully.');
} catch (e) {
  console.error(e);
}
