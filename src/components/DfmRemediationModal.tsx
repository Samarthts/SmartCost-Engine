import React from 'react';
import { CadPart, DfmPoint } from '../types';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingDown, 
  Sparkles, 
  Clock, 
  Leaf, 
  DollarSign, 
  Hammer,
  ArrowRight
} from 'lucide-react';

interface DfmRemediationModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: CadPart;
  remediatedPointIds: string[];
  onToggleRemediation: (pointId: string) => void;
  selectedPoint?: DfmPoint | null;
}

export const DfmRemediationModal: React.FC<DfmRemediationModalProps> = ({
  isOpen,
  onClose,
  part,
  remediatedPointIds,
  onToggleRemediation,
  selectedPoint,
}) => {
  if (!isOpen) return null;

  const totalPossibleSavings = part.dfmPoints.reduce((acc, p) => acc + p.costImpactPerUnit, 0);
  const currentSavings = part.dfmPoints
    .filter((p) => remediatedPointIds.includes(p.id))
    .reduce((acc, p) => acc + p.costImpactPerUnit, 0);

  const totalCycleSaved = part.dfmPoints
    .filter((p) => remediatedPointIds.includes(p.id))
    .reduce((acc, p) => acc + p.cycleTimeSavedSec, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Design-For-Manufacturing (DFM) Remediation Engine
              </h3>
              <p className="text-xs text-slate-400">
                Identified {part.dfmPoints.length} over-engineered geometric features on 3D CAD mesh
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Savings Summary Banner */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/70 border-b border-slate-800 text-center">
          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Cost Reduction / Unit</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
              -${currentSavings.toFixed(2)}
              <span className="text-[10px] text-slate-400 font-normal ml-1">of -${totalPossibleSavings.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Cycle Time Saved</div>
            <div className="text-lg font-extrabold text-cyan-400 mt-0.5">
              -{totalCycleSaved}s
              <span className="text-[10px] text-slate-400 font-normal ml-1">per part</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Remediation Status</div>
            <div className="text-lg font-extrabold text-amber-400 mt-0.5">
              {remediatedPointIds.length} / {part.dfmPoints.length}
              <span className="text-[10px] text-slate-400 font-normal ml-1">Optimized</span>
            </div>
          </div>
        </div>

        {/* DFM Remediation Points List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-950/40">
          {part.dfmPoints.map((point) => {
            const isApplied = remediatedPointIds.includes(point.id);

            return (
              <div
                key={point.id}
                className={`p-4 rounded-xl border transition-all ${
                  isApplied
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isApplied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-400'}`}>
                      {isApplied ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{point.title}</h4>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Type: {point.type} • Severity: {point.severity}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggleRemediation(point.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
                      isApplied
                        ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Applied (Undo)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Apply Remediation</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 my-2.5 p-2.5 bg-slate-950 rounded-lg text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-rose-400">Current Over-Engineered Spec:</span>
                    <div className="text-slate-300 mt-0.5">{point.currentSpec}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-emerald-400">AI Recommended Engineering Remedy:</span>
                    <div className="text-emerald-300 font-medium mt-0.5">{point.remedySpec}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {point.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Cycle Savings: <strong>-{point.cycleTimeSavedSec}s</strong>
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                    Carbon Saved: <strong>-{point.co2eSavedKg} kg CO₂e</strong>
                  </span>
                  <span className="text-emerald-400 font-extrabold text-sm">
                    Save ${point.costImpactPerUnit.toFixed(2)} / unit
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Remediations immediately update the 3D Heatmap and 8-Pillar Should-Cost matrix.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
