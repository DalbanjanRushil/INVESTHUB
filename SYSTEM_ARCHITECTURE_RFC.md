# Architecture RFC 001: Financial Integrity & Governance Upgrades

**Date:** January 20, 2026
**Status:** PROPOSAL
**Author:** Principal System Architect (Antigravity)

---

## 🏛️ Context
InvestHub v3.0.0 has established a "Performance Ledger". However, to move from **Simulation** to **Institutional Grade**, we must handle failure states (wrong declarations) and financial reality (losses) with rigorous accounting standards.

Below are 3 proposed architectural upgrades to satisfy strict auditability and solvency requirements.

---

## 1. Feature: Performance Restatement Protocol (The "Correction" Layer)

**Problem It Solves:**
Human Admins make mistakes. A period (e.g., "Jan 2026") might be Declared & Locked with ₹1,00,000 profit, but the real figure was ₹90,000.
**Naive Failure:** Simply "Unlocking" and editing the record destroys the audit trail. Users who already saw ₹1,00,000 will lose trust if it silently changes to ₹90,000.
**Correct Design:** **Additive Corrections.** You never touch the original record. You create a "Restatement" record that applies a mathematical delta to the original.

### Data Model
New Collection: `performance_restatements`
```typescript
{
  _id: ObjectId,
  originalPeriodId: ObjectId, // Link to "Jan 2026"
  correctionType: "ADJUSTMENT" | "VOID",
  
  // The Delta (What changed?)
  deltaNetProfit: number, // e.g., -10000
  deltaAdminShare: number,
  deltaInvestorShare: number,

  reason: string, // Mandatory Audit Note
  authorizedBy: ObjectId, // Admin ID
  createdAt: Date
}
```

### State Transitions
1.  **Original:** Jan 2026 Locked (Profit: 100k).
2.  **Event:** Admin notices error.
3.  **Action:** Admin creates Restatement (Delta: -10k).
4.  **Result:**
    *   System effective Profit = 100k + (-10k) = 90k.
    *   UI shows: "Jan 2026 (Restated)".
    *   Next Payout: Deducts 10k from future distribution (Clawback logic) or Adjusts current if not distributed.

### Abuse Vectors
*   **Vector:** Admin maliciously restating history to hide theft.
*   **Defense:** Restatements trigger a "Critical System Alert" to all users via email. "Correction Notice: Jan 2026 results adjusted downward by 10%." Transparency is the defense.

---

## 2. Feature: High-Water Mark (HWM) Enforcement

**Problem It Solves:**
In Month 1, the fund loses 10%. In Month 2, it gains 10%.
**Naive Failure:** The system treats Month 2 as "Profit" and distributes it.
**Reality:** The investor is merely back to break-even. The Admin should *not* earn a performance fee on recovery money. This is "Double Dipping" on volatility.
**Correct Design:** Profits are ONLY distributed when the `Cumulative Wealth Index` exceeds its previous all-time high.

### Data Model
Update `PerformancePeriod`:
```typescript
{
  ...existingFields,
  cumulativeIndexStart: number, // e.g., 1000.00
  cumulativeIndexEnd: number,   // e.g., 1050.00
  isHighWaterMark: boolean,     // True if IndexEnd > All Previous IndexEnd
}
```

### Logic Flow
1.  **Month 1 (Loss):** Start 1000 -> End 900. (No Distro). HWM = 1000.
2.  **Month 2 (Gain):** Start 900 -> End 990. (Profit generated, but End < HWM).
    *   **Action:** Profit is retained in "Reserve", NOT distributed. Admin Fee = 0.
3.  **Month 3 (Gain):** Start 990 -> End 1100.
    *   **Action:** Distribute profit relative to (1100 - 1000). Only the *new* growth is taxed/shared.

### Trust Factor
This effectively tells users: *"We don't get paid unless YOU are actually profitable, not just recovering from losses we caused."*

---

## 3. Feature: Idempotency Keys on Financial Mutations

**Problem It Solves:**
User clicks "Withdraw" twice rapidly. Or Admin clicks "Distribute" and the internet lags, so they click again.
**Naive Failure:** The request is sent twice. The server processes both. Double spending occurs.
**Correct Design:** Every financial mutation request MUST include a unique `Idempotency-Key` header (UUID).

### State Transitions
1.  **Request 1:** `POST /withdraw` (Key: `abc-123`).
2.  **Server:** Checks Redis/DB for `abc-123`. Not found. Processes. Saves result.
3.  **Request 2 (Retry):** `POST /withdraw` (Key: `abc-123`).
4.  **Server:** Finds `abc-123`. Returns the *saved result* from Request 1. **DOES NOT** execute logic again.

### Scalability Reality
*   **10 Users:** Not needed (low collision probability).
*   **10k Users:** Critical. Network retries happen constantly on mobile.
*   **Implementation:** Middleware layer using Redis (TTL 24h).

---

## 🏁 Summary of Trade-offs

| Feature | Trade-off | Recommendation |
| :--- | :--- | :--- |
| **Restatement** | Increases DB complexity (Agreggation Queries required). | **Safe.** Essential for audit trails. |
| **High-Water Mark** | Admin earns less revenue during volatility. | **Safe.** Essential for user fairness and legal defense. |
| **Idempotency** | Adds Redis dependency and client-side logic. | **Mandatory.** Prevents accidental double-spends. |

---
*Architected by Antigravity*
