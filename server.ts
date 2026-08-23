import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Prompt 1: Geometry & Should-Cost Analyzer Engine
app.post("/api/gemini/teardown", async (req, res) => {
  try {
    const { partName, material, volume, dimensions, complexFeatures, region, targetBatch } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Return high-fidelity deterministic response if API key is not yet set
      return res.json({
        fallback: true,
        analysis: {
          partName: partName || "Machined Automotive Joint Housing",
          material: material || "Aluminum 6061-T6",
          batchSize: targetBatch || 20000,
          geometricExtraction: {
            boundingBoxMm: dimensions || "185 x 120 x 85 mm",
            netVolumeCm3: volume || 412.5,
            boundingMassKg: 5.12,
            netPartMassKg: 1.11,
            materialUtilizationPercent: 21.7,
            criticalFeatures: [
              "Deep internal blind pocket (depth-to-diameter ratio > 4.5:1)",
              "4x M8x1.25 tapped mounting bores with ±0.015mm position tolerance",
              "Internal stepped bore with 0.8µm Ra surface finish requirement",
              "Variable wall thickness transitioning from 3.2mm to 14.5mm"
            ]
          },
          processRouting: {
            primaryProcess: "5-Axis CNC Machining (Roughing: High-Feed Endmill -> Finishing: Ballnose)",
            secondaryProcess: "EDM (Electrical Discharge Machining) for sharp internal corners R < 1.0mm",
            surfaceTreatment: "Type III Hard Anodize (MIL-A-8625, 50µm coating)",
            estimatedCycleTimeSec: 840,
            recommendedProcessSwitch: "For runs >15,000 units, High-Pressure Die Casting (HPDC) with CNC net-shape finish yields 34% cost savings."
          },
          dfmRemediationPoints: [
            {
              id: "dfm-1",
              location: "Internal Corner Radii",
              currentSpec: "R 0.8mm internal corners in deep pocket",
              recommendedSpec: "Increase internal radii to R >= 3.5mm",
              impact: "Eliminates sinker EDM operation, allows standard 1/4\" endmill tooling, saves $4.80/unit.",
              savingPercentage: 8.2
            },
            {
              id: "dfm-2",
              location: "Housing Flange Boss Wall",
              currentSpec: "Non-uniform wall thickness (14.5mm solid chunk)",
              recommendedSpec: "Core out solid boss to uniform 4.0mm nominal wall with 2x 2.5mm support ribs",
              impact: "Reduces raw billet weight by 380g, cuts roughing cycle by 140 seconds, saves $5.60/unit.",
              savingPercentage: 9.6
            },
            {
              id: "dfm-3",
              location: "Internal Hydraulic Passage Port",
              currentSpec: "H7 blind hole tolerance (±0.005mm)",
              recommendedSpec: "Relax non-critical bore clearance to ISO H9 (±0.030mm)",
              impact: "Eliminates secondary reaming/honing step and reduces tool wear scrap rate by 2.4%.",
              savingPercentage: 4.1
            }
          ],
          regionalComparison: {
            indiaHub: {
              region: "India (Bengaluru/Jaipur Automotive Corridor)",
              unitLandedCost: 28.40,
              laborIndexHourly: 4.20,
              freightLeadDays: 26,
              tariffDutyPercent: 2.5,
              gridCarbonIntensityKgCO2PerKwh: 0.72,
              recommendation: "Optimal for high-volume structural runs with high labor component."
            },
            mexicoHub: {
              region: "Mexico (Monterrey Nearshore Corridor)",
              unitLandedCost: 31.85,
              laborIndexHourly: 7.80,
              freightLeadDays: 4,
              tariffDutyPercent: 0.0,
              gridCarbonIntensityKgCO2PerKwh: 0.43,
              recommendation: "Optimal for tight US JIT supply chains with low buffer inventory tolerance."
            }
          },
          scope3Carbon: {
            rawMaterialCO2eKg: 12.8,
            manufacturingCO2eKg: 3.4,
            logisticsCO2eKg: 0.9,
            totalCO2ePerUnitKg: 17.1,
            carbonReductionAdvice: "Switching to 80% recycled post-consumer aluminum billet reduces Scope 3 footprint by 64% with zero structural tensile compromise."
          }
        }
      });
    }

    const prompt = `System Instruction:
You are a proprietary multimodal Cost Engineering and Manufacturing AI. Perform an objective digital teardown and 8-pillar should-cost analysis.

Input Details:
- Part Name: ${partName || "Machined Automotive Joint Housing"}
- Material: ${material || "Aluminum 6061-T6"}
- Target Batch Volume: ${targetBatch || 20000}
- Part Dimensions: ${dimensions || "185 x 120 x 85 mm"}
- Part Volume: ${volume || 412.5} cm3
- Target Sourcing Region: ${region || "India vs Mexico"}
- Complex Features: ${JSON.stringify(complexFeatures || ["Deep blind pocket", "M8 tapped holes", "Internal step"])}

Return a strict JSON object with:
- geometricExtraction (boundingBoxMm, netVolumeCm3, boundingMassKg, netPartMassKg, materialUtilizationPercent, criticalFeatures)
- processRouting (primaryProcess, secondaryProcess, surfaceTreatment, estimatedCycleTimeSec, recommendedProcessSwitch)
- dfmRemediationPoints (array of 3 points with location, currentSpec, recommendedSpec, impact, savingPercentage)
- regionalComparison (indiaHub vs mexicoHub landed costs, labor, freight days, tariff, carbon)
- scope3Carbon (rawMaterialCO2eKg, manufacturingCO2eKg, logisticsCO2eKg, totalCO2ePerUnitKg, carbonReductionAdvice)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ fallback: false, analysis: parsed });
  } catch (error: any) {
    console.error("Gemini Teardown Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate teardown" });
  }
});

// Prompt 2: Interactive AI Sourcing Co-Pilot Chat
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Dynamic conversational simulation if no API key is available
      const lower = (message || "").toLowerCase();
      let reply = "";

      if (lower.includes("zytel") || lower.includes("polymer") || lower.includes("nylon") || lower.includes("material")) {
        reply = `**Sourcing Assessment: Stainless Steel 316 ➔ DuPont Zytel® 70G33L Polymer Pivot**

• **Financial Impact**: Unit landed cost drops from **$42.50** to **$19.80** (-53.4%) at 20,000+ volume run.
• **Tooling & Amortization**: Requires hardened P20/H13 injection mold ($24,500 NRE). Amortization break-even occurs at **1,150 units**.
• **Cycle Time Acceleration**: Cycle drops from **18.5 minutes (5-Axis CNC)** to **38 seconds (Injection Molding)**.
• **DFM Warning**: Maintain uniform 3.2mm wall thickness on the 3D CAD mesh to prevent differential shrinkage and sink marks on mounting bosses.
• **Scope 3 Decarbonization**: Raw material embodied carbon drops by **68%** (from 19.4 kg CO2e to 6.2 kg CO2e per unit).
• **Recommended Supplier Cluster**: **Pune & Bengaluru Automotive Corridor, India** (42 vetted Tier-1 precision molders with IATF 16949 certification).`;
      } else if (lower.includes("dfm") || lower.includes("fillet") || lower.includes("pocket") || lower.includes("edm")) {
        reply = `**DFM Geometry Remediation Priority Matrix**

1. **Deep Corner Radii (R < 1.0mm)**:
   • *Issue*: Requires sinker EDM electrodes or fragile micro-endmills with high tool chatter.
   • *Remediation*: Increase to **R >= 3.5mm**. Eliminates EDM routing, reducing machine cycle by **160s** and saving **$4.80/unit**.

2. **Excessive Boss Thickness (14.5mm solid chunk)**:
   • *Issue*: High raw billet wastage and risk of volumetric porosity.
   • *Remediation*: Core out to **4.0mm nominal wall** with dual gusset ribs. Trims **380g** of raw billet ($5.60 savings).

3. **Tolerance Relaxation on Non-Sealing Flanges**:
   • *Remediation*: Relax ±0.010mm to ±0.050mm to allow multi-spindle standard milling.`;
      } else if (lower.includes("india") || lower.includes("mexico") || lower.includes("region") || lower.includes("landed")) {
        reply = `**Cross-Border Landed Cost Comparison: India vs Mexico Hubs**

• **India Hub (Bengaluru/Jaipur)**:
  - Landed Unit Cost: **$28.40** (Labor: $4.20/hr, Grid: $0.11/kWh)
  - Sea Transit: **26-28 days** to US West Coast | Duty: **2.5% MFN**
  - Best for: Large-batch planned production runs where labor arbitrage dominates freight.

• **Mexico Nearshore (Monterrey Corridor)**:
  - Landed Unit Cost: **$31.85** (Labor: $7.80/hr, Grid: $0.14/kWh)
  - Ground Transit: **3-5 days** cross-border drayage | Duty: **0% USMCA**
  - Best for: JIT lean assembly lines with high demand variability and low buffer inventory toleration.`;
      } else {
        reply = `**Sourcing Co-Pilot Analysis**

• **Active Component**: ${context?.partName || "Machined Automotive Joint Housing"}
• **Current Benchmark Should-Cost**: **$${context?.unitCost || "34.20"}** / unit (${context?.batchSize || "20,000"} units)
• **Key Cost Driver**: Raw material billet removal (78.3% chip-to-part ratio) and 5-axis CNC cycle time.
• **Instant Action Items**:
  1. Toggle **Cost Risk Heatmap** to inspect flagged high-expense geometry.
  2. Adjust **Batch Volume slider** to evaluate tooling amortization threshold.
  3. Test **DuPont Zytel Polymer** or **Recycled Al 6061** to optimize Scope 3 emissions.`;
      }

      return res.json({ fallback: true, reply });
    }

    const systemInstruction = `You are the interactive user-facing AI Sourcing Assistant built into the dashboard interface. Your persona is a helpful, brilliant, peer-level procurement and engineering consultant. You speak directly to the user (a design engineer or sourcing manager). Your output must be highly scannable, using bold text anchors and short, high-utility bullet fragments. You have continuous visibility into the active 3D CAD canvas view and 8-pillar should cost matrix.`;

    const chatPrompt = `Context Data:
- Active Part: ${context?.partName || "Machined Automotive Joint Housing"}
- Current Material: ${context?.material || "Stainless Steel 316"}
- Current Batch: ${context?.batchSize || 20000} units
- Current Sourcing Region: ${context?.region || "India Hub"}
- Calculated Should-Cost: $${context?.unitCost || 34.20} / unit
- Scope 3 Carbon: ${context?.carbon || 17.1} kg CO2e

User Query:
"${message}"

Provide a direct, high-impact, actionable engineering and sourcing consultation response with bold anchors and clear metrics.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: chatPrompt,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    return res.json({ fallback: false, reply: response.text || "No response generated" });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate chat response" });
  }
});

// Vite middleware or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`3D Should-Cost Sourcing Engine Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
