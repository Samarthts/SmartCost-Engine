import React, { useState } from 'react';
import { CadPart, CostBreakdownDetails, CostPillars, MaterialSpec, SourcingRegion } from '../types';
import { 
  DollarSign, 
  Layers, 
  Hammer, 
  Clock, 
  Trash2, 
  Zap, 
  Sparkles, 
  Truck, 
  ShieldAlert, 
  TrendingDown, 
  Sliders, 
  ChevronRight, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface CostMatrix8PillarsProps {
  costDetails: CostBreakdownDetails;
  materials: MaterialSpec[];
  selectedMaterial: MaterialSpec;
  onMaterialChange: (material: MaterialSpec) => void;
  batchSize: number;
  onBatchSizeChange: (size: number) => void;
  selectedRegion: SourcingRegion;
  part: CadPart;
  remediatedPointIds: string[];
  onOpenDfmModal: () => void;
  onOpenNegotiationSheet: () => void;
}

export const CostMatrix8Pillars: React.FC<CostMatrix8PillarsProps> = ({
  costDetails,
  materials,
  selectedMaterial,
  onMaterialChange,
  batchSize,
  onBatchSizeChange,
  selectedRegion,
  part,
  remediatedPointIds,
  onOpenDfmModal,
  onOpenNegotiationSheet,
}) => {
  const [activePillarDetails, setActivePillarDetails] = useState<string | null>(null);
  const { pillars } = costDetails;

  const pillarItems = [
    {
      id: 'raw-material',
      name: '1. Raw Base Material',
      value: pillars.rawMaterialCost,
      icon: Layers,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      description: `Billet mass vs net volume (${costDetails.grossWeightKg}kg gross ➔ ${costDetails.netWeightKg}kg net). Includes $${costDetails.scrapCreditUsd} scrap credit.`,
      metricLabel: 'Commodity Spot',
      metricVal: `$${selectedMaterial.costPerKgUsd}/kg`,
      pct: (pillars.rawMaterialCost / pillars.totalShouldCost) * 100,
    },
    {
      id: 'setup-tooling',
      name: '2. Setup & Custom Tooling',
      value: pillars.setupToolingAmortized,
      icon: Hammer,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      description: `Amortized NRE ($${costDetails.toolingTotalUsd.toLocaleString()}) over ${batchSize.toLocaleString()} target batch run.`,
      metricLabel: 'Amortization Run',
      metricVal: `${batchSize.toLocaleString()} units`,
      pct: (pillars.setupToolingAmortized / pillars.totalShouldCost) * 100,
    },
    {
      id: 'cycle-labor',
      name: '3. Cycle Time & Labor',
      value: pillars.cycleTimeMachiningLabor,
      icon: Clock,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      description: `${costDetails.cycleTimeMinutes} min machine cycle @ $${costDetails.hourlyMachineLaborRate}/hr (${selectedRegion.name} labor index).`,
      metricLabel: 'Cycle Time',
      metricVal: `${costDetails.cycleTimeMinutes} mins`,
      pct: (pillars.cycleTimeMachiningLabor / pillars.totalShouldCost) * 100,
    },
    {
      id: 'scrap-nesting',
      name: '4. Scrap & Nesting Loss',
      value: pillars.scrapNestingOverhead,
      icon: Trash2,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      description: `Process defect loss & setup swarf recovery allowance.`,
      metricLabel: 'Defect Allowance',
      metricVal: '2.4% yield loss',
      pct: (pillars.scrapNestingOverhead / pillars.totalShouldCost) * 100,
    },
    {
      id: 'energy-overhead',
      name: '5. Energy & Factory Overhead',
      value: pillars.energyFactoryOverhead,
      icon: Zap,
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      description: `Spindle power draw @ $${selectedRegion.electricityRateUsdPerKwh}/kWh + plant SG&A / depreciation.`,
      metricLabel: 'Grid Rate',
      metricVal: `$${selectedRegion.electricityRateUsdPerKwh}/kWh`,
      pct: (pillars.energyFactoryOverhead / pillars.totalShouldCost) * 100,
    },
    {
      id: 'secondary-finishing',
      name: '6. Secondary Finishing',
      value: pillars.secondaryFinishingOperations,
      icon: Sparkles,
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10 border-pink-500/30 text-pink-400',
      description: `Surface passivation, hardcoat anodizing, and micro-deburring operations.`,
      metricLabel: 'Surface Spec',
      metricVal: 'MIL-A-8625',
      pct: (pillars.secondaryFinishingOperations / pillars.totalShouldCost) * 100,
    },
    {
      id: 'packaging-logistics',
      name: '7. Packaging & Logistics',
      value: pillars.outboundPackagingLogistics,
      icon: Truck,
      color: 'from-sky-500 to-blue-500',
      bgColor: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
      description: `VCI corrosion barrier packing + international port-to-door freight ($${selectedRegion.freightCostUsdPerKg}/kg).`,
      metricLabel: 'Transit Lead',
      metricVal: `${selectedRegion.freightTransitDays} days`,
      pct: (pillars.outboundPackagingLogistics / pillars.totalShouldCost) * 100,
    },
    {
      id: 'customs-tariffs',
      name: '8. Customs & Tariffs (HS 8708)',
      value: pillars.crossBorderTariffsDuties,
      icon: ShieldAlert,
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-500/10 border-red-500/30 text-red-400',
      description: `${selectedRegion.customsTariffDutyPercent}% cross-border customs duty rate on imported landed value.`,
      metricLabel: 'Customs Duty',
      metricVal: `${selectedRegion.customsTariffDutyPercent}%`,
      pct: (pillars.crossBorderTariffsDuties / pillars.totalShouldCost) * 100,
    },
  ];

  // Quick preset batch volumes
  const batchPresets = [1000, 5000, 10000, 20000, 50000];

  return (
    <div id="cost-matrix-8-pillars" className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-2xl text-white">
      {/* Header & Main Landed Cost Display */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 uppercase tracking-wider">
              Parametric Should-Cost Engine
            </span>
            <span className="text-xs text-slate-400">8-Pillar Breakdown</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            Real-Time Should-Cost Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Landed unit target for <span className="text-slate-200 font-semibold">{part.name.split(' (')[0]}</span> sourced from <span className="text-cyan-300 font-semibold">{selectedRegion.name}</span>
          </p>
        </div>

        {/* Big Executive Target Price Callout */}
        <div className="flex items-center gap-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shadow-inner">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Calculated Should-Cost</div>
            <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
              ${pillars.totalShouldCost.toFixed(2)}
              <span className="text-xs font-normal text-slate-400 ml-1">/ unit</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Total Run: ${(pillars.totalShouldCost * batchSize).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>

          <div className="h-12 w-px bg-slate-800" />

          <button
            id="open-negotiation-sheet-btn"
            onClick={onOpenNegotiationSheet}
            className="flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
          >
            <span className="flex items-center gap-1">
              Target Sheet
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] font-medium text-slate-900/80">Executive PDF</span>
          </button>
        </div>
      </div>

      {/* Control Sliders: Material & Volume Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
        {/* Raw Base Material Selector */}
        <div>
          <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Raw Base Material Alloy
            </span>
            <span className="text-[11px] text-cyan-400 font-mono">
              ${selectedMaterial.costPerKgUsd}/kg • {selectedMaterial.densityGPerCm3} g/cm³
            </span>
          </label>
          <select
            id="material-selector"
            value={selectedMaterial.id}
            onChange={(e) => {
              const found = materials.find((m) => m.id === e.target.value);
              if (found) onMaterialChange(found);
            }}
            className="w-full bg-slate-900 text-slate-100 text-xs rounded-xl border border-slate-700 p-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium"
          >
            {materials.map((mat) => (
              <option key={mat.id} value={mat.id}>
                {mat.name} (${mat.costPerKgUsd}/kg) — {mat.primaryProcess}
              </option>
            ))}
          </select>
        </div>

        {/* Production Volume Run Slider & Chips */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Production Volume Run (Batch Size)
            </span>
            <span className="text-xs font-bold text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
              {batchSize.toLocaleString()} units
            </span>
          </div>
          <input
            id="batch-size-slider"
            type="range"
            min="1000"
            max="50000"
            step="1000"
            value={batchSize}
            onChange={(e) => onBatchSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex items-center justify-between gap-1 mt-2">
            {batchPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => onBatchSizeChange(preset)}
                className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-all ${
                  batchSize === preset
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {preset >= 1000 ? `${preset / 1000}k` : preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Stacked Cost Distribution Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Cost Pillar Distribution</span>
          <span>100% Landed Cost Build</span>
        </div>
        <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800 shadow-inner">
          {pillarItems.map((item) => (
            <div
              key={item.id}
              style={{ width: `${Math.max(item.pct, 2)}%` }}
              className={`h-full bg-gradient-to-r ${item.color} transition-all duration-300 relative group cursor-pointer`}
              title={`${item.name}: $${item.value.toFixed(2)} (${item.pct.toFixed(1)}%)`}
            />
          ))}
        </div>
      </div>

      {/* 8-Pillar Itemized Computational Meters (Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {pillarItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activePillarDetails === item.id;

          return (
            <div
              key={item.id}
              id={`pillar-${item.id}`}
              onClick={() => setActivePillarDetails(isSelected ? null : item.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer bg-slate-950/70 hover:bg-slate-950 ${
                isSelected
                  ? 'border-cyan-400 ring-1 ring-cyan-400 shadow-xl'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg border ${item.bgColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {item.pct.toFixed(1)}%
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-300 truncate">
                {item.name}
              </div>

              <div className="text-lg font-extrabold text-white mt-1">
                ${item.value.toFixed(2)}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                <span>{item.metricLabel}</span>
                <span className="font-mono text-cyan-300 font-semibold">{item.metricVal}</span>
              </div>

              {isSelected && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-relaxed bg-slate-900 p-2 rounded-lg">
                  {item.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DFM Remediation Cost Savings Banner */}
      <div className="mt-5 p-3.5 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-cyan-950/50 rounded-xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <span>DFM Geometry Optimization Impact</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {remediatedPointIds.length} of {part.dfmPoints.length} Applied
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Remediating high-cost internal fillets, non-uniform boss walls, and blind tolerances reduces unit landed cost.
            </p>
          </div>
        </div>

        <button
          id="open-dfm-modal-btn"
          onClick={onOpenDfmModal}
          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all whitespace-nowrap"
        >
          Inspect & Apply DFM Fixes
        </button>
      </div>
    </div>
  );
};
