
# Phase 1: System Discovery & Bifurcation Report

## 1. API Endpoint Catalog

### Authentication
| Method | Endpoint | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | User Signup | ✅ Working |
| `POST` | `/api/auth/[...nextauth]` | Login & Session (NextAuth) | ✅ Working |
| `POST` | `/api/auth/forgot-password` | Initiate Password Reset | ⚠️ Logic Exists (Unverified) |
| `POST` | `/api/auth/reset-password` | Complete Password Reset | ⚠️ Logic Exists (Unverified) |

### User Finance (Wallet & Actions)
| Method | Endpoint | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/finance/deposit` | Create Razorpay Order | ✅ Working |
| `POST` | `/api/finance/deposit/verify`| Verify Payment & Credit Wallet | ✅ **FIXED** (Robust) |
| `POST` | `/api/finance/withdraw` | Request Withdrawal (Debits Wallet -> Locked) | 🔸 Needs Logic Review (Metrics) |
| `PUT` | `/api/user/payout-preference`| Toggle Reinvest vs Bank Payout | ✅ Working |

### Admin Operations
| Method | Endpoint | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/distribute-profit`| Calculate & Distribute Returns (w/ TDS) | 🔸 Backend Solid, Trigger Manual |
| `POST` | `/api/admin/withdraw/manage` | Approve (Finalize) or Reject (Refund) Requests | 🔸 Backend Solid, UI Unverified |
| `POST` | `/api/admin/settle` | (Unclear Purpose - Likely Redundant) | ❓ To Be Investigated |

## 2. Core Data Flow Mappings

### A. The Deposit Flow (Now Stable)
1. **User** enters Amount -> `POST /deposit` -> **Razorpay Order**.
2. **User** pays -> Success Callback -> `POST /deposit/verify`.
3. **Backend**:
   - Updates `Deposit` Log to `SUCCESS`.
   - Creates `Investment` (Flexi/Fixed) record.
   - Updates `Wallet`: Adds to `principal` (Flexi) or `locked` (Fixed).
   - Creates `Transaction` (Type: `DEPOSIT`).
   - Emits **Socket Event** -> Frontend shows Toast & Refreshes Data.
   - **Referral Engine**: Credits 1% to referrer if applicable.

### B. The Payout/Profit Flow (Admin Triggered)
1. **Admin** declares Profit Amount -> `POST /admin/distribute-profit`.
2. **Backend**:
   - Calculates Share based on `principal` + `balance`.
   - Checks **Preference**:
     - `COMPOUND`: Adds to `principal` (Auto-reinvest).
     - `PAYOUT`: Adds to `profit` (Withdrawable).
   - Deducts TDS (10%) if share > ₹5000.
   - Sends **Email Notification**.

### C. The Withdrawal Flow
1. **User** Request -> `POST /withdraw`
   - Checks Balance -> Moves Funds from `profit`/`principal` to `locked`.
   - Creates `Withdrawal` (PENDING).
2. **Admin** Review -> `POST /admin/withdraw/manage`
   - **APPROVE**: Marks `Withdrawal` SUCCESS. (Money already gone from wallet).
   - **REJECT**: Marks `Withdrawal` REJECTED. **Refunds** money from `locked` back to `balance`.

## 3. Discovered Gaps & Missing Links (To Be Fixed in Phase 2/3)

### 🔴 Critical Missing Logic
1.  **Investment Maturity**:
    - **Problem**: There is NO automated job or check to see if a `FIXED_3M` plan has matured.
    - **Consequence**: Users' money stays in "Fixed" state forever effectively, unless manually moved.
    - **Fix Needed**: `POST /api/cron/maturity-check` or similar.

2.  **Withdrawal Metrics**:
    - **Problem**: When requesting withdrawal, `totalWithdrawn` is seemingly ignored or updated inconsistently separate from approval.
    - **Fix Needed**: Ensure `totalWithdrawn` only increments on **Admin Approval**, not User Request.

3.  **Admin UI Wiring**:
    - **Problem**: The Admin Dashboard (`/admin/dashboard`) likely exists as a page, but I haven't verified if the buttons actually call the `/api/admin/...` endpoints correctly or if they are just placeholders.

### 🟡 Minor Issues / Tech Debt
-   **Socket Reliability**: While `verify` now emits, relying purely on sockets for critical UI state (like hiding a generic loader) is risky. We added the "Toast" feedback, which is good.
-   **Error Visibility**: Frontend often swallows specific backend validation errors (handling generic "Something went wrong").

---

**Next Step**: Proceed to **PHASE 2: USER WORKFLOW VALIDATION**.
I will sequentially test and solidify the **Withdrawal** and **Auto-Compound** flows to ensure "What Working" expands to cover full lifecycle.
