const fs = require('fs');

try {
  let appCode = fs.readFileSync('src/App.tsx', 'utf8');

  const targetLine = '  // Helper: Get layout config based on active dimensions';
  const inject = `
  // Auto-populate dashboard with top 10 custom charts if it's new
  React.useEffect(() => {
    if (customChartTemplates.length > 0 && chartOrder.length < 5) {
      const customIds = customChartTemplates.slice(0, 10).map(t => 'library:' + t.id);
      setChartOrder(prev => {
        const newOrder = [...new Set([...prev, ...customIds])];
        if (newOrder.length !== prev.length) return newOrder;
        return prev;
      });
    }
  }, [customChartTemplates, chartOrder.length]);
`;

  appCode = appCode.replace(targetLine, inject + '\n' + targetLine);
  fs.writeFileSync('src/App.tsx', appCode);
  console.log('Injected auto-populate logic.');
} catch (e) {
  console.error(e);
}
