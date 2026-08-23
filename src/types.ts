export type ViewMode = 'shaded' | 'heatmap' | 'wireframe' | 'xray';

export interface CadPart {
  id: string;
  name: string;
  category: string;
  defaultMaterial: string;
  boundingBox: { x: number; y: number; z: number }; // mm
  netVolumeCm3: number;
  complexityScore: number; // 1-10
  description: string;
  dfmPoints: DfmPoint[];
  features: string[];
}

export interface DfmPoint {
  id: string;
  title: string;
  location: [number, number, number]; // 3D coordinates on mesh
  type: 'fillet' | 'thickness' | 'tolerance' | 'undercut' | 'tooling';
  severity: 'high' | 'medium' | 'low';
  currentSpec: string;
  remedySpec: string;
  costImpactPerUnit: number;
  cycleTimeSavedSec: number;
  co2eSavedKg: number;
  remediated: boolean;
  description: string;
}

export interface MaterialSpec {
  id: string;
  name: string;
  code: string;
  category: 'metal' | 'polymer' | 'alloy';
  densityGPerCm3: number;
  costPerKgUsd: number;
  machinabilityRating: number; // 0-100%
  scrapRecoveryValueUsdPerKg: number;
  carbonFactorKgCo2ePerKg: number; // Embodied cradle-to-gate
  toolWearCoefficient: number;
  primaryProcess: string;
  colorHex: string;
}

export interface SourcingRegion {
  id: string;
  name: string;
  country: string;
  subHub: string;
  laborRateUsdPerHour: number;
  electricityRateUsdPerKwh: number;
  gridCarbonIntensityKgCo2ePerKwh: number;
  freightCostUsdPerKg: number;
  freightTransitDays: number;
  customsTariffDutyPercent: number;
  leadTimeWeeks: number;
  riskRating: 'Low' | 'Moderate' | 'High';
  description: string;
  supplierCountInCluster: number;
}

export interface CostPillars {
  rawMaterialCost: number;
  setupToolingAmortized: number;
  cycleTimeMachiningLabor: number;
  scrapNestingOverhead: number;
  energyFactoryOverhead: number;
  secondaryFinishingOperations: number;
  outboundPackagingLogistics: number;
  crossBorderTariffsDuties: number;
  totalShouldCost: number;
}

export interface CostBreakdownDetails {
  pillars: CostPillars;
  batchSize: number;
  grossWeightKg: number;
  netWeightKg: number;
  scrapWeightKg: number;
  scrapCreditUsd: number;
  rawMaterialNetUsd: number;
  toolingTotalUsd: number;
  cycleTimeMinutes: number;
  hourlyMachineLaborRate: number;
  carbonEmissions: CarbonBreakdown;
}

export interface CarbonBreakdown {
  materialExtractionCo2e: number;
  manufacturingProcessCo2e: number;
  freightLogisticsCo2e: number;
  totalScope3Co2eKgPerUnit: number;
  totalBatchCo2eTons: number;
  cbamRiskTariffUsd: number;
}

export interface SupplierRecord {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  city: string;
  certifications: string[];
  auditedRating: number; // 1-5
  capacityUtilization: number; // 0-100%
  onTimeDeliveryRate: number; // 0-100%
  quotedShouldCostDelta: number; // e.g. +2.4% or -1.1%
  specialties: string[];
  contactEmail: string;
}

export interface TeardownResult {
  fallback: boolean;
  analysis: {
    partName: string;
    material: string;
    batchSize: number;
    geometricExtraction: {
      boundingBoxMm: string;
      netVolumeCm3: number;
      boundingMassKg: number;
      netPartMassKg: number;
      materialUtilizationPercent: number;
      criticalFeatures: string[];
    };
    processRouting: {
      primaryProcess: string;
      secondaryProcess: string;
      surfaceTreatment: string;
      estimatedCycleTimeSec: number;
      recommendedProcessSwitch: string;
    };
    dfmRemediationPoints: Array<{
      id: string;
      location: string;
      currentSpec: string;
      recommendedSpec: string;
      impact: string;
      savingPercentage: number;
    }>;
    regionalComparison: {
      indiaHub: any;
      mexicoHub: any;
    };
    scope3Carbon: {
      rawMaterialCO2eKg: number;
      manufacturingCO2eKg: number;
      logisticsCO2eKg: number;
      totalCO2ePerUnitKg: number;
      carbonReductionAdvice: string;
    };
  };
}
