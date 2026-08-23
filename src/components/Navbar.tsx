import React from 'react';
import { CadPart, CostBreakdownDetails } from '../types';
import { 
  Boxes, 
  TrendingDown, 
  Building2, 
  FileSpreadsheet
} from 'lucide-react';

interface NavbarProps {
  cadParts: CadPart[];
  selectedPart: CadPart;
  onSelectPart: (part: CadPart) => void;
  costDetails: CostBreakdownDetails;
  onOpenDfm: () => void;
  onOpenSuppliers: () => void;
  onOpenNegotiation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cadParts,
  selectedPart,
  onSelectPart,
  costDetails,
  onOpenDfm,
  onOpenSuppliers,
  onOpenNegotiation,
}) => {
  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 text-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 shadow-lg shadow-cyan-500/20 font-black text-sm flex items-center justify-center">
            <Boxes className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                SmartCost Engine
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono">
                  3D CAD
                </span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Parametric Cost Engineering, DFM Teardown & Cross-Border Sourcing
            </p>
          </div>
        </div>

        {/* CAD Part Selector Dropdown */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">Active Assembly:</span>
          <select
            id="navbar-part-selector"
            value={selectedPart.id}
            onChange={(e) => {
              const found = cadParts.find((p) => p.id === e.target.value);
              if (found) onSelectPart(found);
            }}
            className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer pr-2"
          >
            {cadParts.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Executive Action Hub Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="nav-dfm-btn"
            onClick={onOpenDfm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all hover:border-slate-700"
            title="Inspect 3D DFM Remediation points"
          >
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>DFM Audit</span>
          </button>

          <button
            id="nav-suppliers-btn"
            onClick={onOpenSuppliers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all hover:border-slate-700"
            title="Match 250,000+ Vetted Suppliers"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Vendors (250k+)</span>
          </button>

          <button
            id="nav-negotiation-btn"
            onClick={onOpenNegotiation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all"
            title="Executive Should-Cost Target Sheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Target Sheet (${costDetails.pillars.totalShouldCost.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </header>
  );
};
