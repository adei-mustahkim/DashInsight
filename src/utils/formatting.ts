export const formatRupiah = (value: unknown): string => {
  const number = Number(value);
  if (Number.isNaN(number)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

export const formatNumber = (value: unknown): string => {
  const number = Number(value);
  if (Number.isNaN(number)) return '0';
  return new Intl.NumberFormat('id-ID').format(number);
};

export const shortCurrency = (value: unknown): string => {
  const number = Number(value) || 0;
  if (Math.abs(number) >= 1000000000) return `Rp${(number / 1000000000).toFixed(1)}M`;
  if (Math.abs(number) >= 1000000) return `Rp${(number / 1000000).toFixed(1)}Jt`;
  if (Math.abs(number) >= 1000) return `Rp${(number / 1000).toFixed(0)}Rb`;
  return `Rp${number}`;
};
