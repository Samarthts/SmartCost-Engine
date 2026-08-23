import { CadPart, CostBreakdownDetails, CostPillars, MaterialSpec, SourcingRegion } from '../types';

export function calculateShouldCost(
  part: CadPart,
  material: MaterialSpec,
  region: SourcingRegion,
  batchSize: number,
  remediatedPointIds: string[] = []
): CostBreakdownDetails {
  // 1. Calculate Mass and Geometry
  // Bounding box volume in cm3 = (x * y * z) in mm3 / 1000
  const boundingBoxVolumeCm3 = (part.boundingBox.x * part.boundingBox.y * part.boundingBox.z) / 1000;
  
  // Calculate DFM savings deductions
  let totalDfmCostReduction = 0;
  let totalDfmCycleTimeSaved = 0;
  let totalDfmCo2eSaved = 0;

  part.dfmPoints.forEach((point) => {
    if (remediatedPointIds.includes(point.id)) {
      totalDfmCostReduction += point.costImpactPerUnit;
      totalDfmCycleTimeSaved += point.cycleTimeSavedSec;
      totalDfmCo2eSaved += point.co2eSavedKg;
    }
  });

  // Effective part volume after core-outs / remediation
  const netVolumeCm3 = Math.max(part.netVolumeCm3 - (remediatedPointIds.some(id => id.includes('wall')) ? 45 : 0), 50);
  
  const grossWeightKg = (boundingBoxVolumeCm3 * material.densityGPerCm3) / 1000;
  const netWeightKg = (netVolumeCm3 * material.densityGPerCm3) / 1000;
  const scrapWeightKg = Math.max(grossWeightKg - netWeightKg, 0);

  // 2. Pillar 1: Raw Material Cost (factoring in scrap recovery credit)
  const isPolymer = material.category === 'polymer';
  // Polymers use runner/sprue regrind with minimal scrap; metals start from square billets
  const effectiveRawInputKg = isPolymer ? netWeightKg * 1.08 : grossWeightKg;
  const rawGrossCost = effectiveRawInputKg * material.costPerKgUsd;
  const scrapCreditUsd = isPolymer ? 0 : scrapWeightKg * material.scrapRecoveryValueUsdPerKg;
  const rawMaterialCost = Math.max(rawGrossCost - scrapCreditUsd, 0.5);

  // 3. Pillar 2: Setup & Tooling Amortization
  // Polymer injection requires hardened steel mold ($18k-$32k) amortized over run; CNC requires soft jaws & fixtures ($1.8k-$4.5k)
  let baseToolingCost = isPolymer
    ? 24500
    : material.category === 'alloy'
    ? 6800
    : 3200;

  // DFM non-standard tooling penalty deduction
  if (remediatedPointIds.some(id => id.includes('tool') || id.includes('fillet'))) {
    baseToolingCost *= 0.82;
  }

  const setupToolingAmortized = Math.max(baseToolingCost / Math.max(batchSize, 100), 0.15);

  // 4. Pillar 3: Cycle Time & Labor Cost
  // Base cycle time in seconds
  let cycleTimeSec: number;
  if (isPolymer) {
    // Injection cycle 25-50s
    cycleTimeSec = 38;
  } else {
    // CNC cycle based on net volume, material machinability, and complexity
    const baseMachiningSec = (netVolumeCm3 * 1.6 * (part.complexityScore / 5)) / (material.machinabilityRating / 100);
    cycleTimeSec = baseMachiningSec * material.toolWearCoefficient;
  }

  // Deduct DFM cycle time savings
  cycleTimeSec = Math.max(cycleTimeSec - totalDfmCycleTimeSaved, 15);
  const cycleTimeMinutes = cycleTimeSec / 60;
  const cycleHours = cycleTimeSec / 3600;

  // Machine operator + shop labor rate
  const machineOperatorLaborRate = region.laborRateUsdPerHour * 1.35;
  const cycleTimeMachiningLabor = cycleHours * machineOperatorLaborRate;

  // 5. Pillar 4: Scrap & Nesting Overhead (%)
  // Process yield defect rate (1.2% to 4.5% depending on material complexity)
  const scrapDefectRate = material.category === 'alloy' ? 0.042 : isPolymer ? 0.015 : 0.024;
  const scrapNestingOverhead = (rawMaterialCost + cycleTimeMachiningLabor) * scrapDefectRate;

  // 6. Pillar 5: Energy & Factory Overhead
  // Machine spindle power (18 kW for heavy CNC, 28 kW for injection hydraulic/all-electric)
  const machinePowerKw = isPolymer ? 22 : 16;
  const energyKwhUsedPerPart = (machinePowerKw * cycleTimeSec) / 3600;
  const directElectricityCost = energyKwhUsedPerPart * region.electricityRateUsdPerKwh;
  // Factory SG&A + capital depreciation rate
  const factoryDepreciationOverhead = (cycleTimeMachiningLabor + rawMaterialCost) * 0.14;
  const energyFactoryOverhead = directElectricityCost + factoryDepreciationOverhead;

  // 7. Pillar 6: Secondary Finishing Operations
  // Anodizing / Passivation / Deburring / Thermal deburring
  let secondaryFinishingCost = 0;
  if (material.id.includes('al')) {
    secondaryFinishingCost = 2.40; // Hardcoat Anodize Type III
  } else if (material.id.includes('ss')) {
    secondaryFinishingCost = 1.95; // Passivation & Electropolish
  } else if (material.id.includes('titanium')) {
    secondaryFinishingCost = 5.20; // Stress relief anneal + micro-glass bead peen
  } else if (isPolymer) {
    secondaryFinishingCost = 0.65; // Degating + ultrasonic cleaning
  } else {
    secondaryFinishingCost = 1.20;
  }

  // If EDM is avoided via fillet remediation
  if (remediatedPointIds.some(id => id.includes('fillet'))) {
    secondaryFinishingCost *= 0.65;
  }

  // 8. Pillar 7: Outbound Packaging & Logistics
  // Packaging dunnage & VCI bag ($0.45) + Freight (net weight + box weight) * freight rate per kg
  const grossShippedWeightKg = netWeightKg * 1.15;
  const packagingBaseCost = 0.55;
  const freightShippingCost = grossShippedWeightKg * region.freightCostUsdPerKg;
  const outboundPackagingLogistics = packagingBaseCost + freightShippingCost;

  // Subtotal before customs
  const subtotalBeforeDuty =
    rawMaterialCost +
    setupToolingAmortized +
    cycleTimeMachiningLabor +
    scrapNestingOverhead +
    energyFactoryOverhead +
    secondaryFinishingCost +
    outboundPackagingLogistics;

  // 9. Pillar 8: Cross-Border Tariffs & Customs Duties
  const tariffMultiplier = region.customsTariffDutyPercent / 100;
  const crossBorderTariffsDuties = subtotalBeforeDuty * tariffMultiplier;

  // Total Landed Should-Cost
  const totalShouldCost = Math.max(subtotalBeforeDuty + crossBorderTariffsDuties, 1.0);

  // 10. Scope 3 Carbon Calculations (kg CO2e)
  // Material embodied footprint
  const materialExtractionCo2e = Math.max((netWeightKg * material.carbonFactorKgCo2ePerKg) - totalDfmCo2eSaved, 0.2);
  // Factory grid emission (KWh used * grid carbon intensity)
  const manufacturingProcessCo2e = energyKwhUsedPerPart * region.gridCarbonIntensityKgCo2ePerKwh;
  // Freight transport carbon (ton-km factor: ocean = 0.015 kg/ton-km, road = 0.08 kg/ton-km)
  const estimatedTransitKm = region.freightTransitDays > 10 ? 14000 : 1800;
  const freightTransportEmissionFactor = region.freightTransitDays > 10 ? 0.018 : 0.075; // kg CO2e per ton-km
  const freightLogisticsCo2e = (grossShippedWeightKg / 1000) * estimatedTransitKm * freightTransportEmissionFactor;

  const totalScope3Co2eKgPerUnit = materialExtractionCo2e + manufacturingProcessCo2e + freightLogisticsCo2e;
  const totalBatchCo2eTons = (totalScope3Co2eKgPerUnit * batchSize) / 1000;

  // EU CBAM / US Clean Competition Act penalty risk ($85 / ton above baseline)
  const cbamRiskTariffUsd = (totalScope3Co2eKgPerUnit / 1000) * 85;

  const pillars: CostPillars = {
    rawMaterialCost: Number(rawMaterialCost.toFixed(2)),
    setupToolingAmortized: Number(setupToolingAmortized.toFixed(2)),
    cycleTimeMachiningLabor: Number(cycleTimeMachiningLabor.toFixed(2)),
    scrapNestingOverhead: Number(scrapNestingOverhead.toFixed(2)),
    energyFactoryOverhead: Number(energyFactoryOverhead.toFixed(2)),
    secondaryFinishingOperations: Number(secondaryFinishingCost.toFixed(2)),
    outboundPackagingLogistics: Number(outboundPackagingLogistics.toFixed(2)),
    crossBorderTariffsDuties: Number(crossBorderTariffsDuties.toFixed(2)),
    totalShouldCost: Number(totalShouldCost.toFixed(2)),
  };

  return {
    pillars,
    batchSize,
    grossWeightKg: Number(grossWeightKg.toFixed(3)),
    netWeightKg: Number(netWeightKg.toFixed(3)),
    scrapWeightKg: Number(scrapWeightKg.toFixed(3)),
    scrapCreditUsd: Number(scrapCreditUsd.toFixed(2)),
    rawMaterialNetUsd: Number(rawMaterialCost.toFixed(2)),
    toolingTotalUsd: Number(baseToolingCost.toFixed(2)),
    cycleTimeMinutes: Number(cycleTimeMinutes.toFixed(1)),
    hourlyMachineLaborRate: Number(machineOperatorLaborRate.toFixed(2)),
    carbonEmissions: {
      materialExtractionCo2e: Number(materialExtractionCo2e.toFixed(2)),
      manufacturingProcessCo2e: Number(manufacturingProcessCo2e.toFixed(2)),
      freightLogisticsCo2e: Number(freightLogisticsCo2e.toFixed(2)),
      totalScope3Co2eKgPerUnit: Number(totalScope3Co2eKgPerUnit.toFixed(2)),
      totalBatchCo2eTons: Number(totalBatchCo2eTons.toFixed(2)),
      cbamRiskTariffUsd: Number(cbamRiskTariffUsd.toFixed(2)),
    },
  };
}

export function generateParetoFrontier(
  part: CadPart,
  currentMaterial: MaterialSpec,
  currentRegion: SourcingRegion,
  batchSize: number
) {
  // Scenarios for cost vs carbon trade-off
  return [
    {
      label: 'Baseline (Current Setup)',
      material: currentMaterial.name,
      region: currentRegion.name,
      unitCost: calculateShouldCost(part, currentMaterial, currentRegion, batchSize).pillars.totalShouldCost,
      carbonKg: calculateShouldCost(part, currentMaterial, currentRegion, batchSize).carbonEmissions.totalScope3Co2eKgPerUnit,
      type: 'current',
    },
    {
      label: 'Nearshore Fast-Turn (Mexico)',
      material: currentMaterial.name,
      region: 'Mexico Hub',
      unitCost: 31.85,
      carbonKg: 13.2,
      type: 'nearshore',
    },
    {
      label: 'Low-Labor Scale (India)',
      material: currentMaterial.name,
      region: 'India Hub',
      unitCost: 28.40,
      carbonKg: 16.8,
      type: 'low-cost',
    },
    {
      label: 'Eco-Material Pivot (80% Recycled Al)',
      material: 'GreenEco Al 6061',
      region: currentRegion.name,
      unitCost: 29.10,
      carbonKg: 5.4,
      type: 'eco-optimum',
    },
    {
      label: 'Polymer Injection Pivot (DuPont Zytel)',
      material: 'DuPont Zytel Nylon',
      region: 'India Hub',
      unitCost: 19.80,
      carbonKg: 6.2,
      type: 'radical-innovation',
    }
  ];
}
