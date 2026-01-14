# InvestHub Project Overview

This document provides a comprehensive technical overview of the InvestHub project, detailing user roles, module architecture, page structure, and key features. It is designed to provide context for AI assistants and developers joining the project.

---

## 1. Project Description
**InvestHub** is an advanced investment simulation platform. It enables users to experience a complete investment lifecycle—depositing funds, accumulating simulated profits (distributed by admins), and managing withdrawals—within a secure, role-based web application.

## 2. Technical Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB (via Mongoose)
- **Auth**: NextAuth.js (Credentials Provider)
- **Payment Simulation**: Razorpay Integration
- **Communications**: Nodemailer (Email), Custom Socket Implementation (Real-time updates)

---

## 3. Data Modules (Schema)
The data layer is built on MongoDB with the following Mongoose models (`src/models/`):

1.  **User**: Stores authentication data, roles (`USER`/`ADMIN`), status, and profile info.
2.  **Wallet**: Manages financial state (Balance, Payout Balance, Total Deposited/Withdrawn). Linked 1:1 with User.
3.  **Transaction**: Ledger for all financial moves (`DEPOSIT`, `WITHDRAWAL`, `PROFIT`, `BONUS`).
4.  **Deposit**: Tracks Razorpay payment attempts and success states.
5.  **Withdrawal**: Tracks user withdrawal requests and admin approval/rejection status.
6.  **Content**: Stores metadata for educational materials (Videos, Charts, Posts) uploaded by admins.
7.  **Notification**: User-specific system notifications.
8.  **ProfitDistribution**: Records of admin-initiated profit sharing events.
9.  **InvestmentStrategy**: (Internal) Defines parameters for simulation logic.

---

## 4. Application Architecture & Pages

The application is divided into three primary zones: **Public/Auth**, **User Dashboard**, and **Admin Dashboard**.

### 4.1 Public & Authentication
Located in `src/app/(auth)`:
-   **Landing Page** (`src/app/page.tsx`): Public entry point.
-   **Login** (`/login`): User and Admin authentication.
-   **Register** (`/register`): New user account creation.
-   **Forgot Password** (`/forgot-password`): Request password reset link.
-   **Reset Password** (`/reset-password`): Set new password via token.

### 4.2 User Dashboard
Route Base: `/dashboard` (Guarded: Users only)
-   **Overview** (`/dashboard/page.tsx`): Main summary (Balance, Recent Activity, Charts).
-   **Market** (`/dashboard/market`): View available investment strategies or live market data simulations.
-   **Portfolio** (`/dashboard/portfolio`): Detailed breakdown of user holdings and growth.
-   **Transactions** (`/dashboard/transactions`): History of all deposits, withdrawals, and earnings.
-   **Profile** (`/dashboard/profile`): User settings and payout preferences.

### 4.3 Admin Dashboard
Route Base: `/admin` (Guarded: Admins only)
-   **Dashboard** (`/admin/dashboard`): Global statistics (Total Liquidity, User Count, Pending Requests).
-   **Investments** (`/admin/investments`):
    -   *Manage Withdrawals*: Approve or Reject user withdrawal requests.
    -   *Profit Distribution*: Input tools to distribute profits to all users.
-   **Content Management** (`/admin/content`): Upload, edit, or delete educational content (Videos/Posts).
-   **Operations** (`/admin/operations`): User management (Block/Unblock users), System logs.

---

## 5. Key Features

### 5.1 Financial Core
-   **Deposit System**: Integrated with Razorpay. Verifies signatures server-side (`api/finance/deposit/verify`) before updating wallet balances.
-   **Withdrawal Workflow**:
    1.  **User Request**: Funds are locked immediately.
    2.  **Admin Review**: Admin sees request in dashboard.
    3.  **Decision**:
        -   *Approve*: Marks as success, notifies user.
        -   *Reject*: Automatically refunds locked amount to user wallet.
-   **Profit Distribution**: Bulk transaction system where admins can inject "profit" into the system, which is mathematically distributed to users based on their current capital.

### 5.2 Content Delivery
-   Admins can effectively function as content creators using the `Content Management` module.
-   Users receive a curated feed of Updates, Videos, and Charts on their dashboard (`ContentFeed` component).
-   Supports filtering by content type (Video, Chart, Post).

### 5.3 Communication & Real-time
-   **Email Service**: Automated emails for registration success and password resets.
-   **Real-time Sockets**: Updates user balance and status immediately without refreshing the page when:
    -   A deposit is confirmed.
    -   A withdrawal is approved/rejected.
    -   Profits are distributed.

### 5.4 Security
-   **Role-Based Access Control (RBAC)**: Middleware ensures Users cannot access Admin routes and vice-versa.
-   **Secure API Layers**: All financial endpoints (`api/finance/*`, `api/admin/*`) validate session and permissions before execution.

---

## 6. Directory Map (Key Folders)
-   `src/app/api`: Backend logic (REST Endpoints).
-   `src/components`: UI Building blocks.
    -   `dashboard/`: Specialized charts and feeds.
    -   `forms/`: Reusable input forms (Login, Deposit, etc.).
    -   `ui/`: Base design system components.
-   `src/lib`: Core utilities (Auth config, DB connection, Mailer).
-   `src/models`: Database definitions.

