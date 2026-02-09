# INVESTHUB - Project Status & Documentation

**Date:** 2025-01-28
**Framework:** Next.js 14 (App Router)
**Database:** MongoDB (Mongoose)
**Styling:** Tailwind CSS
**Authentication:** NextAuth.js

---

## 1. Project Overview
InvestHub is a comprehensive investment management platform allowing users to invest in various plans, track their portfolios, and earn profits. Administrators manage the system, declaring performance, distributing profits, and handling withdrawals.

## 2. Directory Structure & Key Routes

### User Panel (`/dashboard`)
The main hub for investors.
- **Dashboard (`/dashboard`)**: Landing view. Shows Portfolio Summary, Quick Actions.
- **Market (`/dashboard/market`)**: Browse and purchase investment plans (Flexi, Fixed 3M/6M/1Y).
- **Portfolio (`/dashboard/portfolio`)**: Detailed view of active and matured investments.
- **Transactions (`/dashboard/transactions`)**: History of Deposits, Withdrawals, Profit Credits, and Referral Bonuses.
- **KYC (`/dashboard/kyc`)**: Identity verification interface (Aadhaar/PAN upload).
- **Referral (`/dashboard/referral`)**: User's referral code, stats, and network tree.
- **Profile (`/dashboard/profile`)**: Account settings, Password reset, Banking details.
- **Performance (`/dashboard/performance`)**: Transparency reports on platform performance.

### Admin Panel (`/admin`)
Restricted to users with `role: "ADMIN"`.
- **Dashboard (`/admin/dashboard`)**: High-level stats (Total Users, Pool Capital, Pending Withdrawals). Includes a **Toggle** to view the dashboard as a User.
- **Operations (`/admin/operations`)**: User Management (Block/Unblock), Withdrawal Approvals, KYC Verification.
- **Investments (`/admin/investments`)**: Global view of all user investments.
- **Performance (`/admin/performance`)**: Create/Lock Performance Periods, Declare Profits.
- **Content (`/admin/content`)**: Upload/Manage educational videos and blogs.

---

## 3. Data Models (Schema)

| Model | Description | Key Fields |
| :--- | :--- | :--- |
| **User** | Identity & Auth | `name`, `email`, `role` (USER/ADMIN), `kycStatus`, `payoutPreference` (COMPOUND/PAYOUT), `referralCode` |
| **Wallet** | Financial State | `principal` (Invested), `profit` (Earned), `referral` (Bonus), `locked` (Active in Fixed Plans) |
| **Investment** | Active Plans | `userId`, `plan` (FLEXI, FIXED_*), `amount`, `startDate`, `maturityDate`, `interestRate`, `isActive` |
| **Transaction** | Ledger | `type` (DEPOSIT, WITHDRAWAL, PROFIT, INVEST), `amount`, `status`, `referenceId` |
| **Withdrawal** | Requests Queue | `amount`, `status` (PENDING, APPROVED, REJECTED), `adminComment` |
| **PerformancePeriod** | Profit Cycles | `periodLabel` (e.g., "Jan 2025"), `netProfit`, `locked` (boolean), `distributionLinked` |
| **Notification** | User Alerts | `title`, `message`, `isRead` |

---

## 4. Key Logic & Workflows

### A. Authentication & Roles
- **NextAuth** handles sessions.
- Middleware protects `/admin` routes.
- `UserRole` enum distinguishes `ADMIN` vs `USER`.

### B. Investment Flow
1. **Deposit**: User adds funds (Razorpay integration implied). Funds go to `Wallet.balance` (or `principal` depending on logic).
2. **Invest**: User selects a plan.
   - Funds deducted from Wallet.
   - `Investment` document created (`isActive: true`).
   - If Fixed plan, funds are technically "locked".

### C. Profit Distribution (Admin)
File: `src/app/api/admin/distribute-profit/route.ts`
1. **Performance Period**: Admin locks a period with a specific `netProfit`.
2. **Distribution**:
   - Admin triggers distribution.
   - System calculates **Admin Share** (50%) vs **User Share** (50%).
   - **User Share** is distributed proportionally based on each user's `Wallet.principal`.
3. **Smart Taxation (TDS)**:
   - If User Profit > ₹5000, 10% TDS is deducted.
4. **Payout Preference**:
   - **COMPOUND**: Profit added to `Wallet.principal` (Auto-reinvest).
   - **PAYOUT**: Profit added to `Wallet.profit` (Withdrawable).
5. **Notification**: Users receive success emails and in-app notifications.

### D. Withdrawal Logic (User)
File: `src/app/api/finance/withdraw/route.ts`
1. **Request**: User requests amount $X$.
2. **Validation**: Check if `(Principal + Profit + Referral) >= X`.
3. **Waterfall Deduction**:
   1. Deduct from **Profit** first.
   2. Then **Referral**.
   3. Finally **Principal**.
4. **Ledger Sync**:
   - If Principal is touched, the system *automatically* scales down active `FLEXI` investments to match the new lower principal. This prevents "phantom capital" where Wallet says ₹0 but Investment says ₹1000 active.
5. **Optimistic Locking**: Uses strict version checking (`__v`) to prevent double-spending during rapid requests.
6. **Socket Update**: Real-time alert sent to Admin Dashboard.

### E. Dashboard Self-Healing
File: `src/app/(dashboard)/admin/dashboard/page.tsx` (and User Dashboard)
- When a dashboard loads, it checks for data consistency.
- **Fix**: If `Wallet.locked` < Sum of Fixed Investments, it auto-corrects.
- **Fix**: If `Wallet.principal` < Sum of Flexi Investments, it auto-corrects.
- **Fix**: Generates `referralCode` if missing.

---

## 5. Current State of Development

- **Frontend**: Full Admin & User dashboards linked. Responsive UI with Tailwind.
- **Backend API**:
    - `POST /api/finance/withdraw`: Robust, with concurrency handling.
    - `POST /api/admin/distribute-profit`: Complex logic with TDS and Compounding.
    - `GET /api/user/*`: Data fetching for dashboards.
- **Admin Features**:
    - **Dashboard Toggle**: Admin can "View as User" to debug/verify user experience.
    - **Stats**: Real-time aggregation of total capital and user counts.

## 6. Pending / To-Do (Inferred)
- **Razorpay Webhooks**: Ensure `src/app/api/finance/deposit` handle success callbacks accurately.
- **KYC Verification**: Admin UI to approve documents.
- **Automated Maturity**: Cron job to unlock "Fixed" plans when `maturityDate` passes.

