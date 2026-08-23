import React from 'react';
import { SourcingRegion, CadPart, MaterialSpec } from '../types';
import { calculateShouldCost } from '../utils/costEngine';
import { 
  Globe2, 
  MapPin, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Zap, 
  Ship, 
  TrendingUp, 
  Building2, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface RegionalMapToggleProps {
  regions: SourcingRegion[];
  selectedRegion: SourcingRegion;
  onSelectRegion: (region: SourcingRegion) => void;
  part: CadPart;
  material: MaterialSpec;
  batchSize: number;
  remediatedPointIds: string[];
}

export const RegionalMapToggle: React.FC<RegionalMapToggleProps> = ({
  regions,
  selectedRegion,
  onSelectRegion,
  part,
  material,
  batchSize,
  remediatedPointIds,
}) => {
  return (
    <div id="regional-mapping-toggle" className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-2xl text-white">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40 uppercase tracking-wider">
              Geopolitical Sourcing Logic
            </span>
            <span className="text-xs text-slate-400">Cross-Border Hubs</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-cyan-400" />
            Cross-Border Regional Mapping & Sourcing Corridors
          </h3>
        </div>
        <div className="text-xs text-slate-400">
          Selected Hub: <span className="text-cyan-300 font-bold">{selectedRegion.name} ({selectedRegion.country})</span>
        </div>
      </div>

      {/* Sourcing Hub Cards Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 my-4">
        {regions.map((reg) => {
          const isSelected = reg.id === selectedRegion.id;
          const cost = calculateShouldCost(part, material, reg, batchSize, remediatedPointIds);

          return (
            <div
              key={reg.id}
              id={`region-card-${reg.id}`}
              onClick={() => onSelectRegion(reg)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-950 border-cyan-400 ring-2 ring-cyan-500/40 shadow-xl'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {reg.name}
                  </span>
                  {isSelected && (
                    <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>

                <div className="text-[10px] text-slate-400 font-mono line-clamp-1 mb-2">
                  {reg.subHub}
                </div>

                <div className="text-xl font-extrabold text-white my-1">
                  ${cost.pillars.totalShouldCost.toFixed(2)}
                  <span className="text-[10px] font-normal text-slate-400 ml-1">/ unit</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300 mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Labor:</span>
                  <span className="font-mono text-slate-200 font-semibold">${reg.laborRateUsdPerHour}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Freight:</span>
                  <span className="font-mono text-slate-200">{reg.freightTransitDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tariff:</span>
                  <span className={`font-mono font-semibold ${reg.customsTariffDutyPercent === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {reg.customsTariffDutyPercent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Side-by-Side Comparison Focus (India vs Mexico as requested in Prompt 1) */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hub A: India */}
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Hub A: India (Bengaluru / Jaipur Corridor)
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                ${calculateShouldCost(part, material, regions.find(r => r.id === 'india-hub') || selectedRegion, batchSize, remediatedPointIds).pillars.totalShouldCost.toFixed(2)}/unit
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Deep precision tooling and automotive casting cluster with maximum labor arbitrage ($4.20/hr). Optimal for planned high-volume runs where unit production cost outweighs ocean transit lead time (26 days).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-center pt-2 border-t border-slate-800">
            <div className="p-1.5 bg-slate-950 rounded-lg">
              <div className="text-slate-400">Labor Index</div>
              <div className="font-mono text-cyan-400 font-bold">$4.20 / hr</div>
            </div>
            <div className="p-1.5 bg-slate-950 rounded-lg">
              <div className="text-slate-400">Grid Carbon</div>
              <div className="font-mono text-amber-400 font-bold">0.71 kg/kWh</div>
            </div>
            <div className="p-1.5 bg-slate-950 rounded-lg">
              <div className="text-slate-400">Customs Duty</div>
              <div className="font-mono text-slate-200 font-bold">2.5% MFN</div>
            </div>
          </div>
        </div>

        {/* Hub B: Mexico */}
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Ship className="w-3.5 h-3.5" />
                Hub B: Mexico (Monterrey Nearshore Corridor)
              </span>
              <span className="text-[11px] font-mono font-bold text-cyan-400">
                ${calculateShouldCost(part, material, regions.find(r => r.id === 'mexico-hub') || selectedRegion, batchSize, remediatedPointIds).pillars.totalShouldCost.toFixed(2)}/unit
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Direct USMCA border access (0% duty) and 3-5 day cross-border ground logistics. Ideal for agile lean supply chains with low buffer inventory tolerance and lower grid carbon footprint (0.42 kg/kWh).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-center pt-2 border-t border-slate-800">
            <div className="p-1.5 bg-slate-950 rounded-lg">
              <div className="text-slate-400">Labor Index</div>
              <div className="font-mono text-cyan-400 font-bold">$7.80 / hr</div>
            </div>
            <div className="p-1.5 bg-slate-950 rounded-lg">
              <div className="text-slate-400">Grid Carbon</div>
              <div className="font-mono text-emerald-400 font-bold">0.42 kg/kWh</div>
            </div>
            <div className="p-1.5 bg-slate-950 rounded-lg">
              <div className="text-slate-400">USMCA Tariff</div>
              <div className="font-mono text-emerald-400 font-bold">0.0% Free</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
