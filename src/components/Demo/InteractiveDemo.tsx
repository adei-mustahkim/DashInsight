// @ts-nocheck
import { useState, useMemo } from 'react';
import { Store, Coffee, Briefcase, Globe, Circle } from 'lucide-react';
import UMKMInsight from '../../App';
import { retailDemoData, fnbDemoData, jasaDemoData, marketplaceDemoData } from '../../constants/demoDatasets';

export default function InteractiveDemo() {
  const [businessType, setBusinessType] = useState<'Retail' | 'F&B' | 'Jasa' | 'Marketplace'>('Retail');

  const demoData = useMemo(() => {
    switch (businessType) {
      case 'Retail': return retailDemoData;
      case 'F&B': return fnbDemoData;
      case 'Jasa': return jasaDemoData;
      case 'Marketplace': return marketplaceDemoData;
      default: return retailDemoData;
    }
  }, [businessType]);

  const getBusinessIcon = (type: string, active: boolean) => {
    const className = `h-4 w-4 ${active ? 'text-white' : 'text-[#276749]'}`;
    switch (type) {
      case 'Retail': return <Store className={className} />;
      case 'F&B': return <Coffee className={className} />;
      case 'Jasa': return <Briefcase className={className} />;
      case 'Marketplace': return <Globe className={className} />;
    }
  };

  const getBusinessDescription = (type: string) => {
    switch (type) {
      case 'Retail': return 'Menampilkan analisis varian produk terlaris, status stok barang, klasifikasi loyalitas member, dan margin laba per ritel.';
      case 'F&B': return 'Menampilkan analisis turnover meja (table traffic), tipe pesanan (dine-in vs delivery), ROI kode promo, dan performa jam sibuk.';
      case 'Jasa': return 'Menampilkan durasi layanan per staf (therapist/stylist), komisi staf, tren booking vs walk-in, dan adopsi pembayaran digital.';
      case 'Marketplace': return 'Menampilkan kontribusi penjualan per wilayah kota, performa pengiriman kurir logistik, rasio diskon voucher, dan omzet online shop.';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-5 border-y border-[#D5E2DB] py-5 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-sm font-bold text-[#276749]">
            <Circle className="h-2.5 w-2.5 fill-[#2F8A60] text-[#2F8A60]" />
            Mode demo aktif · {businessType}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#607269]">
            {getBusinessDescription(businessType)}
          </p>
        </div>
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1 md:pb-0" role="tablist" aria-label="Pilih demo berdasarkan jenis bisnis">
          {(['Retail', 'F&B', 'Jasa', 'Marketplace'] as const).map(type => {
            const isActive = businessType === type;
            return (
              <button
                key={type}
                onClick={() => setBusinessType(type)}
                role="tab"
                aria-selected={isActive}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-bold transition-colors ${isActive ? 'bg-[#276749] text-white' : 'bg-[#EAF3EE] text-[#30463C] hover:bg-[#D9E9E0]'}`}
              >
                {getBusinessIcon(type, isActive)}
                <span>{type}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="landing-demo-frame relative flex min-h-[680px] flex-col overflow-hidden bg-white lg:min-h-[780px]">
        <div className="flex h-10 shrink-0 items-center gap-1.5 bg-[#12251C] px-4" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F07167]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E9C46A]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#62B38A]" />
          <span className="ml-auto text-[11px] font-semibold text-white/60">app.dashinsight.id/demo</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <UMKMInsight isDemo={true} demoData={demoData} demoBusinessType={businessType} />
        </div>
      </div>
    </div>
  );
}

