export const DASHBOARD_LAYOUT_PREFIX = 'umkm_dashboard_layout_';

export const buildDatasetKey = (rows: Array<Record<string, unknown>>, sourceName = 'Dataset'): string => {
  const first = rows?.[0] || {};
  const last = rows?.[rows.length - 1] || {};
  const signature = [
    sourceName,
    rows?.length || 0,
    first.transaction_date || first.transaction_id || first.product_name || '',
    last.transaction_date || last.transaction_id || last.product_name || '',
  ].join('|');

  let hash = 0;
  for (let i = 0; i < signature.length; i += 1) {
    hash = ((hash << 5) - hash) + signature.charCodeAt(i);
    hash |= 0;
  }

  return `dataset_${Math.abs(hash)}`;
};
