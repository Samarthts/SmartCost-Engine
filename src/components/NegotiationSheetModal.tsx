import React, { useState } from 'react';
import { CadPart, CostBreakdownDetails, MaterialSpec, SourcingRegion } from '../types';
import { 
  X, 
  Printer, 
  FileText, 
  FileDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface NegotiationSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: CadPart;
  material: MaterialSpec;
  region: SourcingRegion;
  batchSize: number;
  costDetails: CostBreakdownDetails;
}

export const NegotiationSheetModal: React.FC<NegotiationSheetModalProps> = ({
  isOpen,
  onClose,
  part,
  material,
  region,
  batchSize,
  costDetails,
}) => {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    try {
      setDownloadStatus('idle');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
      const accentColor: [number, number, number] = [6, 182, 212]; // Cyan 500
      const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50

      // Top Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 28, 'F');

      // Accent line
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 28, 210, 1.5, 'F');

      // Document Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('SMARTCOST ENGINE • 3D SHOULD-COST', 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text('Executive Should-Cost Benchmark & Supplier RFQ Negotiation Sheet', 14, 18);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 23);

      // Target Price Badge on Top Right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('TARGET LANDED PRICE', 196, 11, { align: 'right' });

      doc.setFontSize(16);
      doc.setTextColor(52, 211, 153); // Emerald 400
      doc.text(`$${costDetails.pillars.totalShouldCost.toFixed(2)} / unit`, 196, 18, { align: 'right' });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text(`Lot Total: $${(costDetails.pillars.totalShouldCost * batchSize).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 196, 23, { align: 'right' });

      // Executive Summary Card
      const yPos = 36;
      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(14, yPos, 182, 32, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, yPos, 182, 32, 2, 2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(part.name, 18, yPos + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);

      // Column 1
      doc.text(`Part ID: ${part.id}`, 18, yPos + 14);
      doc.text(`Material: ${material.name}`, 18, yPos + 20);
      doc.text(`Density: ${material.densityGPerCm3} g/cm³ | Raw Rate: $${material.costPerKgUsd}/kg`, 18, yPos + 26);

      // Column 2
      doc.text(`Batch Volume: ${batchSize.toLocaleString()} units`, 85, yPos + 14);
      doc.text(`Sourcing Hub: ${region.name}`, 85, yPos + 20);
      doc.text(`Labor Rate: $${region.laborRateUsdPerHour}/hr | Freight: ${region.freightTransitDays} days`, 85, yPos + 26);

      // Column 3
      doc.text(`Gross Mass: ${costDetails.grossWeightKg} kg (Net: ${costDetails.netWeightKg} kg)`, 145, yPos + 14);
      doc.text(`Machining Cycle: ${costDetails.cycleTimeMinutes} mins`, 145, yPos + 20);
      doc.text(`Scope 3 Carbon: ${costDetails.carbonEmissions?.totalScope3Co2eKgPerUnit?.toFixed(2) ?? '0.00'} kg CO₂e/unit`, 145, yPos + 26);

      // 8-Pillar Breakdown Table
      const tableStartY = 74;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('PARAMETRIC 8-PILLAR COST BREAKDOWN', 14, tableStartY);

      const tableRows = [
        [
          '1. Raw Base Material',
          `${costDetails.grossWeightKg}kg billet @ $${material.costPerKgUsd}/kg (net scrap offset)`,
          `$${costDetails.pillars.rawMaterialCost.toFixed(2)}`,
          `${((costDetails.pillars.rawMaterialCost / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%`
        ],
        [
          '2. Setup & Tooling Amortization',
          `Amortized over ${batchSize.toLocaleString()} units ($${costDetails.toolingTotalUsd.toLocaleString()} NRE)`,
          `$${costDetails.pillars.setupToolingAmortized.toFixed(2)}`,
          `${((costDetails.pillars.setupToolingAmortized / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%`
        ],
        [
          '3. Cycle Time & Machining Labor',
          `${costDetails.cycleTimeMinutes} mins @ $${costDetails.hourlyMachineLaborRate}/hr machine rate`,
          `$${costDetails.pillars.cycleTimeMachiningLabor.toFixed(2)}`,
          `${((costDetails.pillars.cycleTimeMachiningLabor / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%`
        ],
        [
          '4. Scrap & Nesting Loss',
          '2.4% process yield loss & initial setup swarf allowance',
          `$${costDetails.pillars.scrapNestingOverhead.toFixed(2)}`,
          `${((costDetails.pillars.scrapNestingOverhead / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%`
        ],
        [
          '5. Energy & Factory Overhead',
          `$${region.electricityRateUsdPerKwh}/kWh grid power + plant SG&A allocation`,
          `$${costDetails.pillars.energyFactoryOverhead.toFixed(2)}`,
          `${((costDetails.pillars.energyFactoryOverhead / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%`
        ],
        [
          '6. Secondary Finishing Operations',
          'Passivation, Anodizing, or Electropolishing micro-deburr',
          `$${costDetails.pillars.secondaryFinishingOperations.toFixed(2)}`,
          `${((costDetails.pillars.secondaryFinishingOperations / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%`
        ],
        [
          '7. Outbound Packaging & Logistics',
          `$${region.freightCostUsdPerKg}/kg freight (${region.freightTransitDays} days transit)`,
          `$${costDetails.pillars.outboundPackagingLogistics.toFixed(2)}`,
          `${((costDetails.pillars.outboundPackagingLogistics / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%`
        ],
        [
          '8. Cross-Border Customs Tariff',
          `${region.customsTariffDutyPercent}% duty tariff applied to landed invoice value`,
          `$${costDetails.pillars.crossBorderTariffsDuties.toFixed(2)}`,
          `${((costDetails.pillars.crossBorderTariffsDuties / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%`
        ],
      ];

      let renderedTableEndY = 175;

      // Safe autoTable invocation with manual fallback
      try {
        const tableOptions = {
          startY: tableStartY + 3,
          head: [['Pillar Element', 'Parametric Driver / Baseline', 'Unit Cost ($)', '% of Total']],
          body: tableRows,
          foot: [['TOTAL AUDITED SHOULD-COST TARGET', `Batch Lot: $${(costDetails.pillars.totalShouldCost * batchSize).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, `$${costDetails.pillars.totalShouldCost.toFixed(2)}`, '100.0%']],
          theme: 'grid' as const,
          headStyles: {
            fillColor: [30, 41, 59] as [number, number, number],
            textColor: [241, 245, 249] as [number, number, number],
            fontSize: 8,
            fontStyle: 'bold' as const,
            halign: 'left' as const,
          },
          columnStyles: {
            0: { cellWidth: 52, fontStyle: 'bold' as const },
            1: { cellWidth: 78 },
            2: { cellWidth: 26, halign: 'right' as const, fontStyle: 'bold' as const },
            3: { cellWidth: 26, halign: 'right' as const },
          },
          footStyles: {
            fillColor: [15, 23, 42] as [number, number, number],
            textColor: [52, 211, 153] as [number, number, number],
            fontStyle: 'bold' as const,
            fontSize: 8.5,
          },
          styles: {
            fontSize: 7.5,
            cellPadding: 2,
            textColor: [51, 65, 85] as [number, number, number],
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] as [number, number, number],
          },
          margin: { left: 14, right: 14 },
        };

        if (typeof autoTable === 'function') {
          autoTable(doc, tableOptions);
        } else if (typeof (autoTable as any)?.default === 'function') {
          (autoTable as any).default(doc, tableOptions);
        } else if (typeof (doc as any).autoTable === 'function') {
          (doc as any).autoTable(tableOptions);
        } else {
          throw new Error('autoTable plugin not available, using vector renderer');
        }

        if ((doc as any).lastAutoTable && (doc as any).lastAutoTable.finalY) {
          renderedTableEndY = (doc as any).lastAutoTable.finalY;
        }
      } catch (tableErr) {
        console.warn('Fallback vector table renderer used:', tableErr);
        // Manual vector table drawing if autoTable plugin fails
        let currentY = tableStartY + 4;
        doc.setFillColor(30, 41, 59);
        doc.rect(14, currentY, 182, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text('Pillar Element', 16, currentY + 4.5);
        doc.text('Parametric Driver / Baseline', 70, currentY + 4.5);
        doc.text('Unit Cost ($)', 155, currentY + 4.5, { align: 'right' });
        doc.text('% Total', 194, currentY + 4.5, { align: 'right' });
        currentY += 7;

        tableRows.forEach((row, rIdx) => {
          doc.setFillColor(rIdx % 2 === 0 ? 255 : 248, rIdx % 2 === 0 ? 255 : 250, rIdx % 2 === 0 ? 255 : 252);
          doc.rect(14, currentY, 182, 6.5, 'F');
          doc.setDrawColor(226, 232, 240);
          doc.line(14, currentY + 6.5, 196, currentY + 6.5);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7);
          doc.setTextColor(15, 23, 42);
          doc.text(row[0], 16, currentY + 4.5);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(71, 85, 105);
          doc.text(row[1], 70, currentY + 4.5, { maxWidth: 75 });

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
          doc.text(row[2], 155, currentY + 4.5, { align: 'right' });

          doc.setFont('helvetica', 'normal');
          doc.text(row[3], 194, currentY + 4.5, { align: 'right' });

          currentY += 6.5;
        });

        // Foot summary row
        doc.setFillColor(15, 23, 42);
        doc.rect(14, currentY, 182, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(52, 211, 153);
        doc.text('TOTAL AUDITED SHOULD-COST TARGET', 16, currentY + 5.2);
        doc.text(`$${costDetails.pillars.totalShouldCost.toFixed(2)}`, 155, currentY + 5.2, { align: 'right' });
        doc.text('100.0%', 194, currentY + 5.2, { align: 'right' });

        renderedTableEndY = currentY + 8;
      }

      // Sourcing Directives & Strategy Section
      const finalY = renderedTableEndY + 7;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('SUPPLIER NEGOTIATION LEVERAGE DIRECTIVES', 14, finalY);

      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.roundedRect(14, finalY + 3, 182, 38, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, finalY + 3, 182, 38, 2, 2, 'D');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      const bullets = [
        `• Scrap Swarf Buyback: Benchmark requires vendor to credit back $1.65/kg of aluminum swarf or $2.40/kg stainless turning scrap from the ${(costDetails.grossWeightKg - costDetails.netWeightKg).toFixed(2)}kg removed mass.`,
        `• Tooling & Fixture Ownership: Contractually stipulate that the $${costDetails.toolingTotalUsd.toLocaleString()} NRE tooling transfers to buyer property with clear CAD tool drawing rights.`,
        `• Cycle Time Cap: Benchmark caps high-speed 5-axis CNC machining at ${costDetails.cycleTimeMinutes} minutes based on modern carbide insert feeds and optimal toolpath routing.`,
        `• Scope 3 Carbon & Tariff Optimization: Sourcing from ${region.name} yields ${costDetails.carbonEmissions?.totalScope3Co2eKgPerUnit?.toFixed(2) ?? '0.00'} kg CO₂e/unit and ${region.customsTariffDutyPercent}% import tariff compliance.`,
      ];

      bullets.forEach((bullet, index) => {
        doc.text(bullet, 18, finalY + 9.5 + (index * 7.5), { maxWidth: 174 });
      });

      // Footer Compliance Note
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        'Confidential Procurement Benchmark Document • Prepared with SmartCost Engine • Not for unauthorized external distribution',
        105,
        288,
        { align: 'center' }
      );

      // Multi-layer reliable download for sandboxed iframe environments
      const pdfBlob = doc.output('blob');
      const filename = `Negotiation-Target-${part.id}.pdf`;

      // Method: Blob URL Object download
      const blobUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      // Set success notification
      setDownloadStatus('success');
      setStatusMessage(`Downloaded ${filename}`);
      setTimeout(() => setDownloadStatus('idle'), 4000);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      setDownloadStatus('error');
      setStatusMessage('Error downloading PDF. Please check browser permissions.');
      setTimeout(() => setDownloadStatus('idle'), 4500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Executive Should-Cost & Supplier RFQ Negotiation Sheet
              </h3>
              <p className="text-xs text-slate-400">
                Audited bottom-up should-cost calculation sheet ready for supplier quote negotiation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sheet</span>
            </button>

            <button
              id="export-pdf-target-sheet-btn"
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 rounded-lg text-xs font-black transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF Target Sheet</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Download toast message if active */}
        {downloadStatus === 'success' && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2 text-emerald-400 text-xs font-medium animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {downloadStatus === 'error' && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 flex items-center gap-2 text-rose-400 text-xs font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Sheet Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Top Target Price Banner */}
          <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                Official Should-Cost Benchmark
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">{part.name}</h2>
              <div className="text-xs text-slate-400 mt-1 space-x-3">
                <span>Material: <strong className="text-slate-200">{material.name}</strong></span>
                <span>•</span>
                <span>Batch: <strong className="text-slate-200">{batchSize.toLocaleString()} units</strong></span>
                <span>•</span>
                <span>Target Hub: <strong className="text-slate-200">{region.name}</strong></span>
              </div>
            </div>

            <div className="bg-slate-950 px-5 py-3 rounded-xl border border-slate-800 text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Audited Landed Target Price</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ${costDetails.pillars.totalShouldCost.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ml-1">/ unit</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Total Lot: <strong className="text-slate-200 font-mono">${(costDetails.pillars.totalShouldCost * batchSize).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
              </div>
            </div>
          </div>

          {/* 8-Pillars Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
              Parametric 8-Pillar Cost Build
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Pillar Element</th>
                  <th className="p-2.5">Parametric Driver Baseline</th>
                  <th className="p-2.5 text-right">Unit Cost ($)</th>
                  <th className="p-2.5 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                <tr>
                  <td className="p-2.5 font-medium text-slate-100">1. Raw Base Material</td>
                  <td className="p-2.5 text-slate-400">{costDetails.grossWeightKg}kg billet @ ${material.costPerKgUsd}/kg (net of scrap offset)</td>
                  <td className="p-2.5 text-right font-mono text-cyan-300 font-semibold">${costDetails.pillars.rawMaterialCost.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-400">{((costDetails.pillars.rawMaterialCost / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-100">2. Setup & Custom Tooling</td>
                  <td className="p-2.5 text-slate-400">Amortized over {batchSize.toLocaleString()} units (${costDetails.toolingTotalUsd.toLocaleString()} NRE)</td>
                  <td className="p-2.5 text-right font-mono text-cyan-300 font-semibold">${costDetails.pillars.setupToolingAmortized.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-400">{((costDetails.pillars.setupToolingAmortized / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-100">3. Cycle Time & Machining Labor</td>
                  <td className="p-2.5 text-slate-400">{costDetails.cycleTimeMinutes} mins @ ${costDetails.hourlyMachineLaborRate}/hr blended machine rate</td>
                  <td className="p-2.5 text-right font-mono text-cyan-300 font-semibold">${costDetails.pillars.cycleTimeMachiningLabor.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-400">{((costDetails.pillars.cycleTimeMachiningLabor / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-100">4. Scrap & Nesting Loss</td>
                  <td className="p-2.5 text-slate-400">2.4% process yield loss & initial setup swarf allowance</td>
                  <td className="p-2.5 text-right font-mono text-cyan-300 font-semibold">${costDetails.pillars.scrapNestingOverhead.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-400">{((costDetails.pillars.scrapNestingOverhead / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-100">5. Energy & Factory Overhead</td>
                  <td className="p-2.5 text-slate-400">${region.electricityRateUsdPerKwh}/kWh grid power + plant SG&A allocation</td>
                  <td className="p-2.5 text-right font-mono text-cyan-300 font-semibold">${costDetails.pillars.energyFactoryOverhead.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-400">{((costDetails.pillars.energyFactoryOverhead / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-100">6. Secondary Finishing Operations</td>
                  <td className="p-2.5 text-slate-400">Passivation, Anodizing, or Electropolishing micro-deburr</td>
                  <td className="p-2.5 text-right font-mono text-cyan-300 font-semibold">${costDetails.pillars.secondaryFinishingOperations.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-400">{((costDetails.pillars.secondaryFinishingOperations / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-100">7. Outbound Packaging & Logistics</td>
                  <td className="p-2.5 text-slate-400">${region.freightCostUsdPerKg}/kg freight ({region.freightTransitDays} days transit)</td>
                  <td className="p-2.5 text-right font-mono text-cyan-300 font-semibold">${costDetails.pillars.outboundPackagingLogistics.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-400">{((costDetails.pillars.outboundPackagingLogistics / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium text-slate-100">8. Cross-Border Customs Tariff</td>
                  <td className="p-2.5 text-slate-400">{region.customsTariffDutyPercent}% duty tariff applied to landed invoice value</td>
                  <td className="p-2.5 text-right font-mono text-cyan-300 font-semibold">${costDetails.pillars.crossBorderTariffsDuties.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-400">{((costDetails.pillars.crossBorderTariffsDuties / costDetails.pillars.totalShouldCost) * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-950 font-bold border-t border-slate-800 text-slate-200">
                <tr>
                  <td className="p-2.5 text-cyan-400" colSpan={2}>TOTAL AUDITED SHOULD-COST TARGET</td>
                  <td className="p-2.5 text-right font-mono text-emerald-400 text-sm font-black">${costDetails.pillars.totalShouldCost.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-emerald-400">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Sourcing Directives & Negotiation Leverage */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Supplier Negotiation Directives</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                <strong className="text-slate-200 block mb-1">1. Scrap Swarf Buyback Offset</strong>
                Require vendor to credit back $1.65/kg of aluminum swarf or $2.40/kg stainless turning scrap from the {(costDetails.grossWeightKg - costDetails.netWeightKg).toFixed(2)}kg removed mass.
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                <strong className="text-slate-200 block mb-1">2. Fixture Ownership Rights</strong>
                Contractually stipulate that the ${costDetails.toolingTotalUsd.toLocaleString()} custom tooling NRE transfers to buyer property with clear CAD tool drawing rights.
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                <strong className="text-slate-200 block mb-1">3. Cycle Time Ceiling</strong>
                Cap machining labor cost at {costDetails.cycleTimeMinutes} minutes based on modern carbide insert feeds and optimal toolpath routing.
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80">
                <strong className="text-slate-200 block mb-1">4. Scope 3 Carbon Compliance</strong>
                Ensure supplier provides Green Energy Certificate to verify {costDetails.carbonEmissions?.manufacturingProcessCo2e?.toFixed(2) ?? '0.00'} kg CO₂e grid emission calculation.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Certified Sourcing & Procurement Asset</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg cursor-pointer"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
