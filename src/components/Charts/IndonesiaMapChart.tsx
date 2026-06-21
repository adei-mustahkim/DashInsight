import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { getCityCoords } from '../../constants/cityCoords';
import { formatRupiah, shortCurrency } from '../../utils/formatting';

// Map Coordinate Boundaries
const SUMATERA_COORDS: [number, number][] = [
  [95.2, 5.6], [96.1, 5.2], [97.5, 4.3], [98.5, 3.2], [99.8, 1.8],
  [101.4, 0.5], [102.5, -0.6], [103.8, -1.8], [105.0, -3.2], [105.8, -4.5],
  [106.0, -5.8], [105.2, -5.9], [104.5, -5.3], [103.5, -4.7], [102.0, -3.8],
  [100.8, -2.5], [99.5, -1.2], [98.2, 0.2], [97.2, 1.3], [96.0, 2.5],
  [95.0, 3.8], [95.2, 5.6]
];

const BANGKA_COORDS: [number, number][] = [
  [105.4, -1.6], [106.1, -1.6], [106.8, -2.3], [106.5, -3.1], [105.5, -2.7], [105.4, -1.6]
];

const BELITUNG_COORDS: [number, number][] = [
  [107.3, -2.5], [108.0, -2.5], [108.2, -3.0], [107.5, -3.2], [107.3, -2.5]
];

const NIAS_COORDS: [number, number][] = [
  [97.0, 1.5], [97.6, 1.4], [97.9, 0.8], [97.3, 0.5], [97.0, 1.5]
];

const MENTAWAI_COORDS: [number, number][] = [
  [98.8, -1.2], [99.3, -1.0], [99.7, -1.6], [99.0, -1.8], [98.8, -1.2]
];

const JAWA_COORDS: [number, number][] = [
  [105.1, -6.1], [106.0, -5.9], [107.0, -6.2], [108.0, -6.4], [109.0, -6.8],
  [110.0, -6.5], [111.0, -6.6], [112.5, -6.8], [113.8, -7.2], [114.5, -8.3],
  [114.3, -8.7], [113.0, -8.3], [112.0, -8.3], [111.0, -8.2], [110.0, -8.0],
  [109.0, -7.7], [108.0, -7.7], [107.0, -7.5], [106.0, -7.2], [105.1, -6.8],
  [105.1, -6.1]
];

const MADURA_COORDS: [number, number][] = [
  [112.7, -6.9], [113.5, -6.9], [114.0, -7.1], [113.8, -7.3], [112.7, -7.2], [112.7, -6.9]
];

const KALIMANTAN_COORDS: [number, number][] = [
  [108.9, 2.0], [109.8, 3.0], [111.2, 4.0], [113.8, 4.6], [115.5, 4.2],
  [117.5, 4.3], [118.0, 3.2], [117.8, 2.1], [117.2, 1.0], [116.5, -1.2],
  [116.6, -2.8], [116.2, -3.9], [115.4, -4.2], [114.6, -3.5], [113.0, -3.2],
  [111.4, -3.0], [110.0, -2.7], [109.1, -1.8], [109.0, -0.5], [108.9, 1.0],
  [108.9, 2.0]
];

const SULAWESI_COORDS: [number, number][] = [
  [119.5, -5.6], [120.3, -5.6], [120.2, -4.0], [119.9, -3.0],
  [120.5, -2.0], [121.2, -3.0], [122.3, -4.5], [123.0, -5.3], [122.8, -4.0],
  [122.0, -3.0], [121.2, -2.0],
  [122.4, -1.8], [123.5, -1.0], [124.0, -0.8], [123.0, -0.8], [121.5, -1.1],
  [120.8, -1.0], [120.0, -0.5], [119.8, -0.8], [119.5, 0.5],
  [120.5, 1.0], [122.0, 1.0], [123.5, 0.6], [124.8, 1.7], [125.1, 1.4],
  [124.5, 0.7], [123.0, 0.4], [121.8, 0.4], [120.5, -0.1],
  [119.7, -1.5], [119.1, -3.0], [118.9, -4.5], [119.5, -5.6]
];

const PAPUA_COORDS: [number, number][] = [
  [130.9, -1.2], [132.0, -0.8], [134.0, -0.8], [134.3, -1.5], [135.0, -3.1],
  [136.8, -2.2], [138.5, -2.2], [140.0, -2.5], [141.0, -2.6], [141.0, -9.0],
  [139.0, -8.2], [137.4, -6.8], [136.0, -4.8], [135.0, -4.5], [134.0, -4.0],
  [133.5, -3.6], [132.2, -2.9], [130.8, -2.0], [130.9, -1.2]
];

const BALI_COORDS: [number, number][] = [
  [114.4, -8.1], [115.0, -8.1], [115.7, -8.4], [115.5, -8.8], [114.5, -8.8], [114.4, -8.1]
];

const LOMBOK_COORDS: [number, number][] = [
  [116.0, -8.3], [116.7, -8.3], [116.8, -8.9], [116.1, -8.9], [116.0, -8.3]
];

const SUMBAWA_COORDS: [number, number][] = [
  [116.9, -8.3], [118.2, -8.2], [119.2, -8.4], [118.8, -9.0], [117.0, -9.0], [116.9, -8.3]
];

const FLORES_COORDS: [number, number][] = [
  [119.8, -8.5], [121.0, -8.6], [122.5, -8.3], [123.0, -8.5], [121.5, -8.9], [120.0, -8.8], [119.8, -8.5]
];

const SUMBA_COORDS: [number, number][] = [
  [118.9, -9.6], [120.2, -9.6], [120.8, -10.2], [119.8, -10.2], [118.9, -9.6]
];

const TIMOR_COORDS: [number, number][] = [
  [123.5, -10.2], [124.0, -9.8], [125.0, -9.0], [125.1, -9.3], [124.2, -10.3], [123.5, -10.2]
];

const HALMAHERA_COORDS: [number, number][] = [
  [127.3, 1.8], [128.0, 2.0], [127.8, 1.0], [128.8, 1.2], [128.4, 0.8], [128.0, 0.8],
  [128.8, -0.2], [128.0, -0.6], [127.6, -0.2], [127.4, 0.6], [127.3, 1.8]
];

const SERAM_COORDS: [number, number][] = [
  [128.0, -3.0], [130.5, -3.0], [130.8, -3.5], [128.0, -3.6], [128.0, -3.0]
];

const BURU_COORDS: [number, number][] = [
  [126.0, -3.2], [127.2, -3.2], [127.2, -3.8], [126.0, -3.8], [126.0, -3.2]
];

const islandPolygons = [
  { name: 'Sumatera', coords: SUMATERA_COORDS, fill: '#E6F4ED' },
  { name: 'Bangka', coords: BANGKA_COORDS, fill: '#E6F4ED' },
  { name: 'Belitung', coords: BELITUNG_COORDS, fill: '#E6F4ED' },
  { name: 'Nias', coords: NIAS_COORDS, fill: '#E6F4ED' },
  { name: 'Mentawai', coords: MENTAWAI_COORDS, fill: '#E6F4ED' },
  { name: 'Jawa', coords: JAWA_COORDS, fill: '#E6F4ED' },
  { name: 'Madura', coords: MADURA_COORDS, fill: '#E6F4ED' },
  { name: 'Kalimantan', coords: KALIMANTAN_COORDS, fill: '#E6F4ED' },
  { name: 'Sulawesi', coords: SULAWESI_COORDS, fill: '#E6F4ED' },
  { name: 'Papua', coords: PAPUA_COORDS, fill: '#E6F4ED' },
  { name: 'Bali', coords: BALI_COORDS, fill: '#E6F4ED' },
  { name: 'Lombok', coords: LOMBOK_COORDS, fill: '#E6F4ED' },
  { name: 'Sumbawa', coords: SUMBAWA_COORDS, fill: '#E6F4ED' },
  { name: 'Flores', coords: FLORES_COORDS, fill: '#E6F4ED' },
  { name: 'Sumba', coords: SUMBA_COORDS, fill: '#E6F4ED' },
  { name: 'Timor', coords: TIMOR_COORDS, fill: '#E6F4ED' },
  { name: 'Halmahera', coords: HALMAHERA_COORDS, fill: '#E6F4ED' },
  { name: 'Seram', coords: SERAM_COORDS, fill: '#E6F4ED' },
  { name: 'Buru', coords: BURU_COORDS, fill: '#E6F4ED' }
];

export const IndonesiaMapChart = ({ items, valueKey = 'sales' }: { items: any[]; valueKey?: string }) => {
  const [tooltip, setTooltip] = useState<{ name: string; value: number; x: number; y: number } | null>(null);
  const [hoveredIsland, setHoveredIsland] = useState<string | null>(null);

  const GEO_BOUNDS = { minLng: 95, maxLng: 141, minLat: -11, maxLat: 6 };
  const W = 1000, H = 450;

  const project = (lng: number, lat: number) => ({
    x: ((lng - GEO_BOUNDS.minLng) / (GEO_BOUNDS.maxLng - GEO_BOUNDS.minLng)) * W,
    y: ((GEO_BOUNDS.maxLat - lat) / (GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat)) * H,
  });

  const buildSvgPath = (coords: number[][]) => {
    return coords.map((c, idx) => {
      const pt = project(c[0], c[1]);
      return `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ') + ' Z';
  };

  const mapped = items
    .map(item => {
      const coords = getCityCoords(item.name);
      if (!coords) return null;
      const pt = project(coords.lng, coords.lat);
      return { ...item, x: pt.x, y: pt.y, coords };
    })
    .filter(Boolean) as any[];

  const unknown = items.filter(item => !getCityCoords(item.name));
  const maxVal = Math.max(...mapped.map(d => Number(d[valueKey]) || 0), 1);
  const bubbleR = (val: number) => 6 + ((val / maxVal) ** 0.6) * 22;
  const bubbleColor = (val: number) => {
    const t = val / maxVal;
    return `rgba(39,103,73,${0.35 + t * 0.65})`;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-[#E0F2F1] to-[#B2EBF2] border border-[#80CBC4] shadow-md" style={{ paddingBottom: `${(H / W) * 100}%` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full select-none"
          style={{ fontFamily: 'inherit' }}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="seaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0F7FA" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#B2EBF2" stopOpacity="0.9" />
            </linearGradient>
            <filter id="islandShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0.5" dy="1.5" stdDeviation="1.5" floodColor="#004D40" floodOpacity="0.15" />
            </filter>
          </defs>

          <rect width={W} height={H} fill="url(#seaGradient)" />

          {[0.2, 0.4, 0.6, 0.8].map(t => (
            <line key={`h${t}`} x1={0} y1={t * H} x2={W} y2={t * H} stroke="#4DB6AC" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.25} />
          ))}
          {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map(t => (
            <line key={`v${t}`} x1={t * W} y1={0} x2={t * W} y2={H} stroke="#4DB6AC" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.25} />
          ))}

          {islandPolygons.map((island, idx) => {
            const isHovered = hoveredIsland === island.name;
            return (
              <g key={idx}>
                <path
                  d={buildSvgPath(island.coords)}
                  fill={isHovered ? '#C8E6C9' : '#F1F8E9'}
                  stroke={isHovered ? '#1B5E20' : '#33691E'}
                  strokeWidth={isHovered ? 2.0 : 1.2}
                  filter="url(#islandShadow)"
                  style={{ transition: 'all 0.2s ease', cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIsland(island.name)}
                  onMouseLeave={() => setHoveredIsland(null)}
                />
              </g>
            );
          })}

          {[
            { label: 'SUMATERA', lng: 101.8, lat: -1.0 },
            { label: 'JAWA', lng: 109.8, lat: -7.4 },
            { label: 'KALIMANTAN', lng: 113.8, lat: 1.0 },
            { label: 'SULAWESI', lng: 121.2, lat: -1.6 },
            { label: 'PAPUA', lng: 137.5, lat: -4.5 },
            { label: 'BALI & NTT', lng: 120.0, lat: -8.6 },
            { label: 'MALUKU', lng: 128.5, lat: -2.8 },
          ].map(({ label, lng, lat }) => {
            const coords = project(lng, lat);
            return (
              <text key={label} x={coords.x} y={coords.y} textAnchor="middle" fontSize={10} fill="#37474F" fontWeight="800" letterSpacing="1.5" opacity={0.65} style={{ pointerEvents: 'none' }}>
                {label}
              </text>
            );
          })}

          {[...mapped]
            .sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0))
            .map((d, i) => {
              const r = bubbleR(d[valueKey] || 0);
              const col = bubbleColor(d[valueKey] || 0);
              return (
                <g key={`${d.name}-${i}`}
                  onMouseEnter={() => setTooltip({ name: d.name, value: d[valueKey] || 0, x: d.x, y: d.y })}
                  style={{ cursor: 'pointer' }}
                >
                  <circle cx={d.x} cy={d.y} r={r + 3} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={0.6} />
                  <circle cx={d.x} cy={d.y} r={r + 1.5} fill="none" stroke="#004D40" strokeWidth={0.8} opacity={0.4} />
                  <circle cx={d.x} cy={d.y} r={r} fill={col} stroke="#004D40" strokeWidth={1.5} />
                  <circle cx={d.x - r * 0.25} cy={d.y - r * 0.25} r={r * 0.3} fill="#FFFFFF" opacity={0.4} />
                  {r >= 13 && (
                    <text x={d.x} y={d.y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={Math.min(r * 0.42, 10)} fill="#FFFFFF" fontWeight="800" style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                      {d.name.length > 11 ? d.name.slice(0, 10) + '...' : d.name}
                    </text>
                  )}
                </g>
              );
            })}

          {tooltip && (() => {
            const { x, y, name, value } = tooltip;
            const boxW = 140;
            const boxH = 50;
            const tx = x > W * 0.75 ? x - boxW - 10 : x + 12;
            const ty = y > H * 0.8 ? y - boxH - 10 : y + 8;
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={tx + 2} y={ty + 2} width={boxW} height={boxH} rx={6} fill="rgba(0,0,0,0.12)" />
                <rect x={tx} y={ty} width={boxW} height={boxH} rx={6} fill="#FFFFFF" stroke="#004D40" strokeWidth={2} />
                <rect x={tx} y={ty} width={boxW} height={5} rx={6} fill="#004D40" />
                <text x={tx + 10} y={ty + 22} fontSize={11} fontWeight="800" fill="#263238">{name}</text>
                <text x={tx + 10} y={ty + 38} fontSize={11} fontWeight="700" fill="#00796B">{formatRupiah(value)}</text>
              </g>
            );
          })()}
        </svg>
      </div>

      {unknown.length > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-start gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <span className="font-bold">Tidak ada di peta:</span>{' '}
            <span className="font-medium text-amber-700">{unknown.map(u => u.name).join(', ')}</span>
            <div className="text-amber-600/80 mt-0.5"> Gunakan visualisasi Bar, Pie, atau Treemap untuk melihat detail item ini.</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-150 px-3 py-2 shadow-sm">
        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Kota dengan Kontribusi Terbesar</div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {mapped.slice(0, 8).map((d, idx) => (
            <div key={d.name} className="flex items-center gap-1.5 bg-gray-50/70 border border-gray-100 px-2 py-0.5 rounded-md hover:bg-gray-100/50 transition-colors">
              <span className="text-[10px] font-bold text-gray-400">#{idx + 1}</span>
              <div
                className="rounded-full shrink-0 border border-[#004D40]/30"
                style={{
                  width: Math.max(Math.min(bubbleR(d[valueKey] || 0) * 0.5, 11), 5),
                  height: Math.max(Math.min(bubbleR(d[valueKey] || 0) * 0.5, 11), 5),
                  background: bubbleColor(d[valueKey] || 0)
                }}
              />
              <span className="text-[11px] text-gray-700 font-semibold">{d.name}</span>
              <span className="text-[10px] text-gray-500 font-medium">{shortCurrency(d[valueKey] || 0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
