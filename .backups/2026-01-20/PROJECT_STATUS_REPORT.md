# InvestHub Project Status Report
**Date:** January 20, 2026
**Version:** 2.5.0

## 1. Project Overview
**InvestHub** is a comprehensive investment profit-sharing platform designed to simulate a high-yield investment program. It acts as a bridge between a central "Admin" (Trader/Fund Manager) and "Investors" (Users).

- **Core Logic:** Users deposit funds, invest in various plans (Flexi/Fixed), and the Admin distributes profits periodically.
- **Tech Stack:** 
  - **Frontend:** Next.js 14 (App Router), React, TailwindCSS, Framer Motion.
  - **Backend:** Next.js Server Actions / API Routes.
  - **Database:** MongoDB (via Mongoose).
  - **Auth:** NextAuth.js (Credentials Provider).
  - **Payments:** Razorpay Integration (Deposits).
  - **Real-time:** Socket.io (for live balance updates).

---

## 2. Core Modules & Functionality

### 🛡️ Admin Command Center
The Admin Dashboard is the nerve center of the application, customized for financial control and user management.

#### **A. Financial Operations**
Located in `/admin/operations`, this module handles the fund flow.
1.  **Profit Distribution Engine:**
    -   **Input:** Total Profit Generated (e.g., ₹1,00,000).
    -   **Logic:** Automatically calculates 50% for Admin and splits the remaining 50% pro-rata among eligible investors based on their active investment stakes.
    -   **Action:** Updates user wallets instantly.

2.  **Quarterly Settlement (Partial):**
    -   **Purpose:** Periodic payout of excess profits.
    -   **Logic:** `Net Earnings = Total Lifetime Profit - Total Lifetime Withdrawn`.
    -   **Threshold:** Admin sets a "Minimum Balance to Keep". Any funds above this are converted into a Withdrawal Request.

3.  **Full Portfolio Dissolution (The "Nuclear" Option):**
    -   **Purpose:** Complete liquidation of the platform or specific user payouts.
    -   **Logic:** 
        -   Unlocks ALL funds (Fixed Plans + Flexi Plans).
        -   Combines with Fluid Cash (Wallet Balance).
        -   Creates a single "Full Settlement" withdrawal request for every user.
    -   **Safety:** Secured behind a confirmation prompt.

#### **B. Dashboard & Analytics**
-   **Real-time Liquidity Pool:** Aggregates `Wallet Cash` + `Active Investments` across the entire database.
-   **Investment Breakdown:** Visual split between Flexi (Liquid) and Fixed (Locked) capital.
-   **Dashboard Toggle:** Ability to switch between "Admin View" and "User View" to inspect the platform as a participant.
-   **Withdrawal Management:** Interface to Approve or Reject user withdrawal requests. *Rejection automatically refunds balance to the user.*

#### **C. Content Studio**
-   Allows Admin to post "Market Updates", " Signals", or "Educational Videos".
-   Content appears on User Dashboards.

---

### 👤 User Experience
The User Interface focuses on trust, clarity, and ease of access to funds.

#### **A. Portfolio & Wallet**
-   **Total Asset Value:** Real-time sum of Cash + Investments.
-   **Deposits:** Integrated with Razorpay for seamless funds addition.
-   **Withdrawals:** Users can request payouts to their bank accounts.

#### **B. Investment Plans**
-   **FLEXI Plan:** Liquid capital, generally lower returns, withdrawable anytime (subject to lock-in logic if applicable).
-   **FIXED Plans (3M, 6M, 1Y):** Locked capital for higher returns. Funds are moved from "Wallet Balance" to "Locked Principal".

#### **C. Referral System**
-   Users generate unique referral codes (format: `INVEST-HUB-XXXX`).
-   Tracks number of referrals (logic for commission is backend-ready).

---

## 3. Database Schema (MongoDB)

The application uses a normalized schema with strict typing in `src/models`:

| Collection | Model | Description |
| :--- | :--- | :--- |
| `users` | `User` | Auth credentials, Role (ADMIN/USER), Status (ACTIVE/BLOCKED). |
| `wallets` | `Wallet` | Financial state: `principal`, `profit`, `referral`, `locked`, `balance`. |
| `transactions` | `Transaction` | Ledger of all Deposits, Withdrawals, and Internal Transfers. |
| `investments` | `Investment` | Individual active plans with start dates and amounts. |
| `withdrawals` | `Withdrawal` | Requests queue with Status (PENDING/APPROVED/REJECTED). |
| `deposits` | `Deposit` | Razorpay order logs and success verifications. |
| `profit_distributions` | `ProfitDistribution` | Audit log of admin profit declarations. |
| `contents` | `Content` | CMS data for videos/posts. |

---

## 4. Work Completed (Recent Changelog)

### **v2.5.0 - Settlement & Stability Update**
1.  **Fixed Settlement Logic:**
    -   Previously, users with compounded principal (reinvested profit) were skipped in settlements.
    -   **Fix:** Algorithm now calculates `Total Net Worth` vs `Total Withdrawn` to determine payout eligibility, regardless of whether funds are in "Profit" or "Principal" wallets.

2.  **Full Dissolution Feature:**
    -   Added capability to force-close all investments and withdraw funds in one click.

3.  **Data Consistency:**
    -   Standardized all MongoDB collection names to lowercase plural (e.g., `Wallet` -> `wallets`) to prevent schema mismatch errors.
    -   Added "Self-Healing" routines in Admin Dashboard to fix missing wallet fields on on-the-fly.

---

## 5. Pending / Roadmap
-   [ ] **KYC Module:** Frontend exists, backend integration pending for document verification.
-   [ ] **Advanced Charts:** Visualizing user growth over time.
-   [ ] **Email Notifications:** connecting SendGrid/Nodemailer for deposit/withdrawal alerts.

---
*Report Generated by Antigravity AI*
