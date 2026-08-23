import { CadPart } from '../types';

export const CAD_PARTS: CadPart[] = [
  {
    id: 'automotive-joint-housing',
    name: 'Machined Automotive Joint Housing (.STEP)',
    category: 'Automotive Powertrain',
    defaultMaterial: 'ss-316',
    boundingBox: { x: 185, y: 120, z: 85 }, // mm
    netVolumeCm3: 412.5,
    complexityScore: 8.4,
    description: 'High-torque automotive suspension steering joint housing with stepped internal bores, 4-bolt mounting flange, and internal lubrication oilways.',
    features: [
      'Deep internal blind cavity (depth: 68mm, D: 42mm)',
      '4x M8x1.25 tapped flange mounting holes',
      'Dual cross-drilled hydraulic lubrication ports (D: 4.5mm)',
      'Tight tolerance H7 internal bore (Ra 0.8µm)',
      'Variable wall thickness: 3.2mm up to 14.5mm at base'
    ],
    dfmPoints: [
      {
        id: 'dfm-fillet-1',
        title: 'Deep Internal Pocket Corner Fillet',
        location: [0, 0.4, 0.2],
        type: 'fillet',
        severity: 'high',
        currentSpec: 'R 0.8mm sharp corner at 68mm cavity depth',
        remedySpec: 'Increase internal radius to R >= 3.5mm',
        costImpactPerUnit: 4.80,
        cycleTimeSavedSec: 160,
        co2eSavedKg: 0.8,
        remediated: false,
        description: 'Requires micro-endmill tool with extreme L/D ratio or dedicated sinker EDM electrode, dramatically inflating cycle time and tool breakage rates.'
      },
      {
        id: 'dfm-wall-2',
        title: 'Over-Engineered Solid Flange Boss',
        location: [0.8, -0.2, 0.4],
        type: 'thickness',
        severity: 'high',
        currentSpec: 'Solid 14.5mm un-cored wall thickness chunk',
        remedySpec: 'Core out to 4.0mm nominal wall + 2x support gussets',
        costImpactPerUnit: 5.60,
        cycleTimeSavedSec: 140,
        co2eSavedKg: 1.4,
        remediated: false,
        description: 'Excessive solid mass leads to 380g of wasted raw billet material, heavy roughing cycle passes, and severe sink marks in cast/mold operations.'
      },
      {
        id: 'dfm-tol-3',
        title: 'Blind Hydraulic Port Position Tolerance',
        location: [-0.6, 0.1, -0.3],
        type: 'tolerance',
        severity: 'medium',
        currentSpec: 'H7 (±0.005mm) on non-mating clearance port',
        remedySpec: 'Relax clearance tolerance to ISO H9 (±0.030mm)',
        costImpactPerUnit: 2.30,
        cycleTimeSavedSec: 75,
        co2eSavedKg: 0.3,
        remediated: false,
        description: 'Ultra-tight tolerance requires secondary precision reaming and CNC in-process CMM probing, increasing machine stall times.'
      }
    ]
  },
  {
    id: 'aerospace-truss-bracket',
    name: 'Aerospace Lightweighting Ribbed Bracket (.STEP)',
    category: 'Aerospace Structural',
    defaultMaterial: 'al-6061-t6',
    boundingBox: { x: 210, y: 95, z: 65 },
    netVolumeCm3: 285.0,
    complexityScore: 7.9,
    description: 'Topology-optimized aerospace engine nacelle support bracket featuring pocketed web trusses and high-strength load bearings.',
    features: [
      'Topology optimized triangular web trusses',
      'Dual spherical bearing press-fit journals',
      'Thin floor pockets (2.0mm thickness)',
      'Multiple countersunk 100° fastener seats'
    ],
    dfmPoints: [
      {
        id: 'dfm-pocket-1',
        title: 'Thin Web Floor Deflection',
        location: [0.2, 0.1, 0.1],
        type: 'thickness',
        severity: 'medium',
        currentSpec: '1.5mm pocket floor thickness causing CNC chatter',
        remedySpec: 'Standardize floor thickness to 2.5mm minimum',
        costImpactPerUnit: 3.10,
        cycleTimeSavedSec: 90,
        co2eSavedKg: 0.4,
        remediated: false,
        description: 'Thin floor sections vibrate under high-speed milling cutter passes, forcing 40% spindle feed rate reduction.'
      },
      {
        id: 'dfm-tool-2',
        title: 'Non-Standard Undercut Chamfer',
        location: [-0.7, -0.3, 0.2],
        type: 'tooling',
        severity: 'high',
        currentSpec: 'Custom 27.5° undercut requiring specialized lollipop tool',
        remedySpec: 'Change undercut to standard 45° chamfer',
        costImpactPerUnit: 4.20,
        cycleTimeSavedSec: 110,
        co2eSavedKg: 0.5,
        remediated: false,
        description: 'Custom angles require custom-ground indexable carbide tooling with long 6-week toolmaker lead times.'
      }
    ]
  },
  {
    id: 'hydraulic-manifold-block',
    name: 'Precision Hydraulic Manifold Valve Body (.STEP)',
    category: 'Fluid Power & Automation',
    defaultMaterial: 'dupont-zytel',
    boundingBox: { x: 140, y: 110, z: 90 },
    netVolumeCm3: 520.0,
    complexityScore: 9.1,
    description: 'High-pressure hydraulic distributor manifold with 7 intersecting internal flow passages and SAE J1926 O-ring port cavities.',
    features: [
      '7x cross-drilled intersecting fluid circuit galleries',
      'SAE J1926-1 straight thread O-ring port cavities',
      'High-pressure burst rating requirement (350 bar)',
      'Micro-burr free internal intersection spec'
    ],
    dfmPoints: [
      {
        id: 'dfm-burr-1',
        title: 'Cross-Drill Gallery Intersection Burrs',
        location: [0.3, -0.4, 0.0],
        type: 'fillet',
        severity: 'high',
        currentSpec: 'Sharp 90° intersecting drill channels',
        remedySpec: 'Specify thermal deburring (TEM) or 120° chamfered breakout',
        costImpactPerUnit: 3.90,
        cycleTimeSavedSec: 130,
        co2eSavedKg: 0.6,
        remediated: false,
        description: 'Loose burrs at blind passage junctions can dislodge into valve spools, causing catastrophic hydraulic lock.'
      }
    ]
  }
];
