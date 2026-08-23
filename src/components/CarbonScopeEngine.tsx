import React from 'react';
import { CadPart, CarbonBreakdown, CostBreakdownDetails, MaterialSpec, SourcingRegion } from '../types';
import { generateParetoFrontier } from '../utils/costEngine';
import { 
  Leaf, 
  Flame, 
  Factory, 
  Truck, 
  ShieldCheck, 
  AlertCircle, 
  TrendingDown, 
  Sparkles, 
  ArrowRight, 
  Scale
} from 'lucide-react';

interface CarbonScopeEngineProps {
  carbon: CarbonBreakdown;
  costDetails: CostBreakdownDetails;
  part: CadPart;
  material: MaterialSpec;
  region: SourcingRegion;
  batchSize: number;
}

export const CarbonScopeEngine: React.FC<CarbonScopeEngineProps> = ({
  carbon,
  costDetails,
  part,
  material,
  region,
  batchSize,
}) => {
  const paretoPoints = generateParetoFrontier(part, material, region, batchSize);

  return (
    <div id="scope-3-carbon-engine" className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-2xl text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase tracking-wider">
              ESG & Enterprise Compliance
            </span>
            <span className="text-xs text-slate-400">GHG Protocol Scope 3</span>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-400" />
            Scope 3 Carbon Engine & Embodied Footprint
          </h3>
        </div>

        {/* Big Carbon Metric Display */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Scope 3 Carbon</div>
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              {carbon.totalScope3Co2eKgPerUnit.toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">kg CO₂e / unit</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Batch Total</div>
            <div className="text-sm font-bold text-slate-200">
              {carbon.totalBatchCo2eTons.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">tons CO₂e</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Part Emission Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4">
        {/* Embodied Raw Material Extraction */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Factory className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono text-slate-400">
              {((carbon.materialExtractionCo2e / carbon.totalScope3Co2eKgPerUnit) * 100).toFixed(0)}% of total
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-300">Embodied Raw Material</div>
          <div className="text-lg font-bold text-white mt-1">
            {carbon.materialExtractionCo2e.toFixed(2)} <span className="text-xs font-normal text-slate-400">kg CO₂e</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Cradle-to-gate ore smelting & ingot extrusion footprint for {material.name}.
          </p>
        </div>

        {/* Factory Process & Localized Grid Intensity */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Flame className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono text-slate-400">
              {((carbon.manufacturingProcessCo2e / carbon.totalScope3Co2eKgPerUnit) * 100).toFixed(0)}% of total
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-300">Manufacturing Energy Grid</div>
          <div className="text-lg font-bold text-white mt-1">
            {carbon.manufacturingProcessCo2e.toFixed(2)} <span className="text-xs font-normal text-slate-400">kg CO₂e</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Derived from {region.name} electrical grid emission intensity ({region.gridCarbonIntensityKgCo2ePerKwh} kg/kWh).
          </p>
        </div>

        {/* International Freight Logistics */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Truck className="w-4 h-4" />
            </div>
            <span className="text-xs font-mono text-slate-400">
              {((carbon.freightLogisticsCo2e / carbon.totalScope3Co2eKgPerUnit) * 100).toFixed(0)}% of total
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-300">Outbound Freight & Logistics</div>
          <div className="text-lg font-bold text-white mt-1">
            {carbon.freightLogisticsCo2e.toFixed(2)} <span className="text-xs font-normal text-slate-400">kg CO₂e</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Multi-modal transport emissions over {region.freightTransitDays} days shipping transit.
          </p>
        </div>
      </div>

      {/* Cost-to-Carbon Pareto Frontier Comparison Cards */}
      <div className="mt-5 p-4 bg-slate-950 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-cyan-400" />
            Cost-to-Carbon Pareto Trade-Off Matrix
          </span>
          <span className="text-[11px] text-slate-400">Optimal Frontier Scenarios</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {paretoPoints.map((pt, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border transition-all ${
                pt.type === 'current'
                  ? 'bg-slate-900 border-cyan-400 ring-1 ring-cyan-400 shadow-md'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {pt.label}
              </div>
              <div className="text-sm font-extrabold text-white">
                ${pt.unitCost.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">/ unit</span>
              </div>
              <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                <Leaf className="w-3 h-3" />
                {pt.carbonKg.toFixed(1)} kg CO₂e
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
