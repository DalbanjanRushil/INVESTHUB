# PRO Investment Tracking Module Plan

## 1. Overview
This module transforms InvestHub from a simple wallet tracker into a comprehensive wealth management dashboard. It builds trust through transparency ("Where is my money?"), manages expectations (Lock-in periods), and demonstrates professionalism (Historical data).

### Key Features
1.  **Asset Allocation Transparency**: Visual breakdown of invested funds (Stocks, Liquid, Real Estate).
2.  **Performance History**: Interactive graphs showing past returns to prove track record.
3.  **Risk Profile**: Clear indication of risk levels (Low/Medium/High) and safety measures.
4.  **Lock-in Lifecycle**: Visual timeline showing fund status (Invested -> Locked -> Estimated Release).

---

## 2. Database Design (Models)

### New Model: `InvestmentStrategy`
This model defines a "Fund" or "Plan" that users invest in.

```typescript
interface IInvestmentStrategy {
  name: string; // e.g., "Growth Opportunities Fund A"
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  minInvestment: number;
  lockInWhere: number; // in months
  estimatedReturnRange: string; // e.g., "12-15%"
  
  // Visual Data
  allocation: {
    label: string; // e.g., "Real Estate"
    percentage: number; // e.g., 40
    color: string; // e.g., "#FF5733"
  }[];
  
  history: {
    date: Date;
    roi: number; // Percentage return for that period
  }[];

  isActive: boolean;
}
```

### Updates to `User` / `Wallet`
*   Current implementation seems to pool all `balance` together.
*   We will treat the default `Wallet.balance` as invested in the "Primary Strategy" for this update, or add a field `activeStrategyId`.

---

## 3. Tech Stack & Libraries
*   **Charts**: `recharts` (Standard, highly customizable, responsive).
*   **Icons**: `lucide-react` (Existing).
*   **Styling**: `Tailwind CSS` + `framer-motion` (for "Premium" animations).

---

## 4. UI/UX Architecture

### A. The "Where is Fund Invested" Section
*   **Design**: A sleek Card containing a **Donut Chart** with a legend.
*   **Interaction**: Hovering over slices shows specific focused assets (e.g., "Real Estate - Commercial Project in Mumbai").
*   **Aesthetic**: Glassmorphism background, neon/gradient chart colors.

### B. Performance History ("Previous Records")
*   **Design**: Area Chart with a gradient fill under the line to signify "Growth".
*   **Trust Factor**: Show consistency. Even if there are dips, transparency builds trust.
*   **Tooltip**: Precise ROI on hover for specific months.

### C. Risk & Trust Badge
*   **Design**: A "Risk Meter" (Gauge) showing the current risk setting.
*   **Content**: "Conservative to Moderate". Text explaining *why* it's safe (e.g., "Backed by tangible assets").

### D. Lock-in Period & Timeline
*   **Design**: A horizontal **Progress Stepper**.
    1.  Funds Recieved
    2.  Deployed (Date)
    3.  Maturity (Date)
    4.  Release (Date)
*   **Feedback**: "You are 3 months into the 12-month lock-in."

---

## 5. Implementation Steps

### Phase 1: Backend Setup
1.  Create `src/models/InvestmentStrategy.ts`.
2.  Create `src/app/api/strategy/route.ts` (GET) to fetch the active strategy data.
3.  Seed the DB with the "Official InvestyHub Plan" data (Mock data needed initially).

### Phase 2: React Components
1.  Install `recharts` and `framer-motion`.
2.  Create `src/components/investments/AllocationChart.tsx`.
3.  Create `src/components/investments/PerformanceGraph.tsx`.
4.  Create `src/components/investments/StrategyCard.tsx`.

### Phase 3: Integration
1.  Update the user Dashboard (`/dashboard`) to include a new tab or section "Investment Insights".
2.  Fetch data from API.
3.  Display the premium UI.

---

## 6. "Pro" Touch - Trust Elements
*   **Verifiable Data**: Add a "Verify" badge (even if cosmetic for now) that implies third-party auditing.
*   **CEO Message**: A small quote/section from the "Fund Manager" explaining the current specific outlook (e.g., "Bullish on Tech this quarter").

