# InvestHub Financial Flow & API Map

This document tracks the lifecycle of a deposit and balance rendering.

## 1. Flow Overview
| Phase | Action | File / API | Data Handled |
| :--- | :--- | :--- | :--- |
| **P1** | Plan Selection | `src/components/dashboard/FinancialActions.tsx` | UI State: `selectedPlan` (FLEXI, FIXED_3M, etc) |
| **P2** | Order Creation | `src/app/api/finance/deposit/route.ts` | **INPUT:** amount, plan. <br>**STORE:** Creates `Deposit` (status: PENDING). <br>**RETURN:** `razorpayOrderId`. |
| **P3** | Signature Verify | `src/app/api/finance/deposit/verify/route.ts`| **STORE:** Updates `Deposit` to SUCCESS. <br>**STORE:** Creates `Investment` (Ledger Record). <br>**STORE:** Updates `Wallet` (Increments `principal` or `locked`). |
| **P4** | Data Retrieval | `src/app/(dashboard)/dashboard/page.tsx` | **QUERY:** `Wallet`, `Investment`, `Transaction`. <br>**LOGIC:** Self-Heals wallet if ledger mismatch. |
| **P5** | Visual Cards | `src/components/dashboard/DashboardHero.tsx` | **RENDER:** `principal + profit + referral + locked`. |

## 2. Model Structure (MongoDB)
- **Collection: `deposits`**
  - Used for tracking the payment transaction status only.
  - Fields: `amount`, `status`, `razorpayOrderId`.
- **Collection: `investments`** (GOLD SOURCE)
  - The actual source of truth for user funds.
  - Fields: `userId` (ObjectId), `amount`, `plan`, `isActive`.
- **Collection: `wallets`**
  - Cached balances for fast UI.
  - Fields: `principal`, `profit`, `locked`, `referral`.

## 3. Critical Rendering Logic
In `DashboardHero.tsx`, the card "Total Portfolio Value" sums all four wallet sub-categories:
```javascript
const totalValue = principal + profit + referral + locked;
```
If this is ₹0, it means the `Wallet` document found by the ID in your session does not match the one updated by the payment gateway.
