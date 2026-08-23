import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { ViewMode, CadPart, MaterialSpec, SourcingRegion, DfmPoint } from './types';
import { CAD_PARTS } from './data/cadPresets';
import { MATERIALS } from './data/materials';
import { REGIONS } from './data/regions';
import { calculateShouldCost } from './utils/costEngine';

import { Navbar } from './components/Navbar';
import { CadCanvas } from './components/CadCanvas';
import { CostMatrix8Pillars } from './components/CostMatrix8Pillars';
import { RegionalMapToggle } from './components/RegionalMapToggle';
import { CarbonScopeEngine } from './components/CarbonScopeEngine';
import { AiTerminal } from './components/AiTerminal';
import { DfmRemediationModal } from './components/DfmRemediationModal';
import { NegotiationSheetModal } from './components/NegotiationSheetModal';
import { SupplierDirectoryModal } from './components/SupplierDirectoryModal';

export default function App() {
  // Application State
  const [selectedPart, setSelectedPart] = useState<CadPart>(CAD_PARTS[0]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialSpec>(
    MATERIALS.find((m) => m.id === 'ss-316') || MATERIALS[0]
  );
  const [selectedRegion, setSelectedRegion] = useState<SourcingRegion>(REGIONS[0]); // India Hub
  const [batchSize, setBatchSize] = useState<number>(20000);
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap'); // Start with Heatmap mode to showcase AI cost risk highlights
  const [remediatedPointIds, setRemediatedPointIds] = useState<string[]>([]);
  
  // Modals
  const [isDfmOpen, setIsDfmOpen] = useState(false);
  const [isSuppliersOpen, setIsSuppliersOpen] = useState(false);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [selectedDfmPoint, setSelectedDfmPoint] = useState<DfmPoint | null>(null);

  // Synchronous Reactive Should-Cost Calculations
  const costDetails = useMemo(() => {
    return calculateShouldCost(
      selectedPart,
      selectedMaterial,
      selectedRegion,
      batchSize,
      remediatedPointIds
    );
  }, [selectedPart, selectedMaterial, selectedRegion, batchSize, remediatedPointIds]);

  // Handle DFM Point Remediation Toggle
  const handleToggleRemediation = (pointId: string) => {
    setRemediatedPointIds((prev) => {
      const exists = prev.includes(pointId);
      const next = exists ? prev.filter((id) => id !== pointId) : [...prev, pointId];
      
      // Celebrate when all DFM points are remediated
      if (!exists && next.length === selectedPart.dfmPoints.length) {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#10b981', '#f59e0b'],
        });
      }
      return next;
    });
  };

  const handleOpenDfmDetails = (point: DfmPoint) => {
    setSelectedDfmPoint(point);
    setIsDfmOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* Executive Navbar */}
      <Navbar
        cadParts={CAD_PARTS}
        selectedPart={selectedPart}
        onSelectPart={(p) => {
          setSelectedPart(p);
          setRemediatedPointIds([]);
        }}
        costDetails={costDetails}
        onOpenDfm={() => setIsDfmOpen(true)}
        onOpenSuppliers={() => setIsSuppliersOpen(true)}
        onOpenNegotiation={() => setIsNegotiationOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Split View: 3D CAD Mesh Canvas (Left) & AI Sourcing Assistant Terminal (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* 3D CAD Mesh Canvas (7 cols) */}
          <div className="lg:col-span-7 flex flex-col min-h-[500px] lg:min-h-[600px]">
            <CadCanvas
              part={selectedPart}
              material={selectedMaterial}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              remediatedPointIds={remediatedPointIds}
              onToggleRemediation={handleToggleRemediation}
              onOpenDfmDetails={handleOpenDfmDetails}
            />
          </div>

          {/* The AI Sourcing Assistant Terminal (5 cols) */}
          <div className="lg:col-span-5 flex flex-col min-h-[500px] lg:min-h-[600px]">
            <AiTerminal
              part={selectedPart}
              material={selectedMaterial}
              region={selectedRegion}
              batchSize={batchSize}
              costDetails={costDetails}
            />
          </div>
        </div>

        {/* Real-Time 8-Pillar Should-Cost Matrix */}
        <CostMatrix8Pillars
          costDetails={costDetails}
          materials={MATERIALS}
          selectedMaterial={selectedMaterial}
          onMaterialChange={setSelectedMaterial}
          batchSize={batchSize}
          onBatchSizeChange={setBatchSize}
          selectedRegion={selectedRegion}
          part={selectedPart}
          remediatedPointIds={remediatedPointIds}
          onOpenDfmModal={() => setIsDfmOpen(true)}
          onOpenNegotiationSheet={() => setIsNegotiationOpen(true)}
        />

        {/* Cross-Border Regional Mapping & Geopolitical Hubs Toggle */}
        <RegionalMapToggle
          regions={REGIONS}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          part={selectedPart}
          material={selectedMaterial}
          batchSize={batchSize}
          remediatedPointIds={remediatedPointIds}
        />

        {/* Scope 3 Carbon Engine Metric */}
        <CarbonScopeEngine
          carbon={costDetails.carbonEmissions}
          costDetails={costDetails}
          part={selectedPart}
          material={selectedMaterial}
          region={selectedRegion}
          batchSize={batchSize}
        />
      </main>

      {/* Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-400">SmartCost Engine Simulation</span>
          </div>
          <div className="text-slate-500">
            Multimodal CAD Analysis • 8-Pillar Cost Build • ESG Scope 3 GHG Protocol
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DfmRemediationModal
        isOpen={isDfmOpen}
        onClose={() => {
          setIsDfmOpen(false);
          setSelectedDfmPoint(null);
        }}
        part={selectedPart}
        remediatedPointIds={remediatedPointIds}
        onToggleRemediation={handleToggleRemediation}
        selectedPoint={selectedDfmPoint}
      />

      <NegotiationSheetModal
        isOpen={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
        part={selectedPart}
        material={selectedMaterial}
        region={selectedRegion}
        batchSize={batchSize}
        costDetails={costDetails}
      />

      <SupplierDirectoryModal
        isOpen={isSuppliersOpen}
        onClose={() => setIsSuppliersOpen(false)}
        selectedRegion={selectedRegion}
      />
    </div>
  );
}
