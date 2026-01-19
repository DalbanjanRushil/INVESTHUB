
# Phase 2: User Workflow Validation Report

## 1. Signup / Login / Session
| Check | Status | Notes |
| :--- | :--- | :--- |
| **User Registration** | ✅ Verified | User `23bcuos023@gmail.com` successfully created. |
| **Session Persistence** | ✅ Verified | `getServerSession` works reliably across API routes (e.g., `verify`, `withdraw`). |
| **Role-Based Access** | ⚠️ Partial | Admin routes check `role === ADMIN`, but frontend Admin Dashboard wiring is unverified. |

## 2. Wallet & Deposit (The "Money In" Flow)
| Check | Status | Notes |
| :--- | :--- | :--- |
| **Order Creation** | ✅ Verified | Razorpay Order ID generated successfully. |
| **Payment Success** | ✅ Verified | Payment gateway completes without error. |
| **Verification API** | ✅ **FIXED** | Robust logic now handles success flags, DB writes, and error logging. |
| **Wallet Update** | ✅ Verified | `principal` / `locked` updates correctly based on plan (Flexi/Fixed). |
| **Transaction Log** | ✅ Verified | "Deposit" entry appears immediately in History. |
| **Dashboard Refresh** | ✅ **FIXED** | `router.refresh()` + Socket Toast ensures UI updates instantly. |
| **State Reset** | ✅ **FIXED** | Modal re-opens cleanly (no stuck "Verifying..." state). |

## 3. Locked Plans & Investments
| Check | Status | Notes |
| :--- | :--- | :--- |
| **Storage Logic** | ✅ Verified | `Investment` model correctly stores `plan`, `startDate`, `maturityDate`. |
| **Allocation** | ✅ Verified | Fixed plans route to `wallet.locked`, Flexi routes to `wallet.principal`. |
| **Maturity Automation**| ⚠️ **NEW** | `cron/maturity-check` endpoint created but **NOT YET TESTED** in live scenario. |

## 4. Auto Compound Toggle
| Check | Status | Notes |
| :--- | :--- | :--- |
| **UI Toggle** | ✅ Verified | Switch correctly calls `PUT /api/user/payout-preference`. |
| **Persistence** | ✅ Verified | MongoDB updates `user.payoutPreference` field. |
| **Logic Impact** | 🔸 Review | Backend `distribute-profit` reads this flag, but we need to verify the *actual split* during a simulated profit run. |

## 5. Withdrawals (The "Money Out" Flow)
| Check | Status | Priority Fixes Needed |
| :--- | :--- | :--- |
| **Request API** | 🔸 **UNVERIFIED** | Code exists (`POST /withdraw`), but UI feedback is untested. |
| **Deduction Logic** | 🔸 **REVIEW** | Does it correctly deduct from `profit` first, then `principal`? Needs validation. |
| **Admin Action** | ❌ **UNVERIFIED** | Admin "Approve/Reject" button wiring is unknown. |
| **Refund Logic** | ⚠️ **CRITICAL** | If Admin rejects, does money *actually* return to `balance`? Code says yes, but untested. |

## 6. Transaction History
| Check | Status | Notes |
| :--- | :--- | :--- |
| **Data Integrity** | ✅ **FIXED** | Missing logs restored. New logs created reliably. |
| **Display** | ✅ Verified | Shows correct Type, Amount, ID, and Timestamp. |
| **Filtering** | ❌ Missing | "Filter" button on UI is currently non-functional (UI only). |

---

# Phase 3: Admin Workflow Audit

## 1. Admin Capabilities (Code Level)
| Feature | Endpoint | Logic Status |
| :--- | :--- | :--- |
| **Distribute Profit** | `POST /admin/distribute-profit` | ✅ **Ready**. Handles TDS, Email, Database Split. |
| **Manage Withdrawals**| `POST /admin/withdraw/manage` | ✅ **Code Exists**. Handles Approve (finalize) / Reject (refund). |
| **View Users/Stats** | (Multiple GETs) | ❓ **Unknown**. Need to find where Admin fetches list data. |

## 2. Missing Admin UI
*   **Navigation**: Is there a visible link for the Admin to go to `/admin/dashboard`?
*   **Action Buttons**: Do "Approve" buttons actually call the API?

---

# EXECUTION PLAN (The "Fix It All" Strategy)

We will now execute the fixes in this strict order:

### **Step 1: The Withdrawal Loop (High Priority)**
1.  **Simulate User Request**: User requests withdrawal of ₹500.
2.  **Verify UI**: Ensure "Pending Withdrawal" appears in History.
3.  **Simulate Admin Action**:
    *   **Scenario A (Reject)**: Verify money returns to wallet.
    *   **Scenario B (Approve)**: Verify status changes to SUCCESS.

### **Step 2: The Profit Cycle**
1.  **Trigger Distribution**: Call `distribute-profit` with a simulated profit (e.g., ₹10,000 for the platform).
2.  **Verify Split**: Check if User gets their correct % share.
3.  **Verify Toggle**: Check if `COMPOUND` users got `principal` increase vs `PAYOUT` users got `profit` increase.

### **Step 3: Admin Wiring**
1.  Locate or Create the Admin Dashboard pages.
2.  Wire the "Approve/Reject" buttons to the valid endpoints.

### **Step 4: Cron Job Setup**
1.  Verify the `maturity-check` logic by artificially aging an investment in the DB and running the endpoint.

---

**Status**: Phase 1 & 2 Reporting Complete.
**Ready to Execute**: Step 1 (The Withdrawal Loop).
