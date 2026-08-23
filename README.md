# ⚙️ SmartCost Engine

---

## 📌 Overview

**SmartCost Engine** is a high-precision manufacturing cost intelligence platform tailored for hardware engineers, cost estimators, and strategic procurement teams. By analyzing 3D CAD volumetric geometry, toolpath accessibility, and alloy properties, SmartCost Engine generates an audited, bottom-up **8-Pillar Should-Cost Model** and empowers organizations to negotiate supplier RFQs with data-backed transparency.

---

## ✨ Key Features

### 🧊 1. Interactive 3D CAD Mesh Inspection
- **Multi-Render Modes**: Toggle between Realistic PBR, Wireframe, Translucent X-Ray, and DFM Cost-Risk Heatmaps.
- **Volumetric Metric Extraction**: Real-time bounding box calculation, net part mass, surface area, and scrap volume delta.
- **Pre-Loaded Aerospace & Industrial Parts**: Benchmark brackets, turbine impellers, heatsinks, transmission housings, and robotics linkages.

### 📊 2. Parametric 8-Pillar Should-Cost Model
Computes granular, transparent unit costs across eight distinct cost drivers:
1. **Raw Base Material**: True billet requirement with net scrap turning/swarf buyback credits.
2. **Setup & Custom Tooling**: NRE fixture and mold amortization dynamically distributed across lot sizes.
3. **Cycle Time & Machining Labor**: Feeds/speeds machining cycle time calculated against regional blended operator rates.
4. **Scrap & Nesting Loss**: Process yield margins and initial setup swarf allowance.
5. **Energy & Factory SG&A**: Plant operational overhead and regional kWh grid power pricing.
6. **Secondary Finishing Operations**: Anodizing, passivation, electropolishing, and bead blasting.
7. **Outbound Logistics & Packaging**: Port-to-door freight transit calculations by weight and route.
8. **Cross-Border Customs Tariffs**: Country-specific import tariffs and landed landed price parity.

### 🌍 3. Global Sourcing Hub Matrix
- Benchmark landed unit economics across **North America (USMCA)**, **Eastern Europe**, **Southeast Asia (Vietnam/Malaysia)**, **East Asia**, **Latin America (Mexico)**, and **Western Europe**.
- Compares blended labor rates, transit lead times, freight costs, and tariff compliance.

### 🛠️ 4. AI DFM Remediation Engine
- Pinpoints geometric anomalies driving cost spikes (deep cavity pockets, thin walls, micro-fillet radii, tight corner tolerances).
- Simulate **one-click DFM optimizations** to instantly visualize cost reduction per unit.

### 🌱 5. Scope 3 ESG Carbon & CBAM Accounting
- Quantifies cradle-to-gate carbon intensity ($\text{kg CO}_2\text{e}/\text{unit}$) across material extraction, machining grid emissions, and freight logistics.
- Evaluates **EU CBAM (Carbon Border Adjustment Mechanism)** border tax exposure risks.

### 📄 6. Executive RFQ Negotiation Sheet & PDF Export
- Generates print-ready executive PDF benchmark target sheets formatted with supplier leverage directives, scrap buyback terms, and tooling ownership rights.

---

## 🏗️ Architecture & Tech Stack

- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **3D Graphics & Canvas**: [Three.js](https://threejs.org/) / `@react-three/fiber` / `@react-three/drei`
- **Charts & Data Visuals**: [Recharts](https://recharts.org/) / [Lucide React](https://lucide.dev/)
- **Document Engine**: [jsPDF](https://github.com/parallax/jsPDF) & [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
- **AI / Co-Pilot Layer**: Server-Side [Google GenAI SDK](https://github.com/google/generative-ai-js) (`@google/genai`)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** / **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/smartcost-engine.git
   cd smartcost-engine
