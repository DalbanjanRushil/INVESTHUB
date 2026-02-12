# InvestHub Technical Documentation

## 1. Project Overview

**InvestHub** is a sophisticated financial simulation and portfolio management platform designed to democratize investment strategies. Unlike typical trading apps, InvestHub focuses on **simulated high-yield strategies**, offering users a risk-free (or low-risk, depending on deployment) environment to understand compound interest, lock-in periods, and portfolio diversification.

### Core Value Proposition
-   **"The Bank of the Future"**: Mimics high-end banking logic with a double-entry ledger at its core.
-   **Education First**: Helps users understand the difference between *Principal*, *Profit*, and *Referral* income.
-   **Transparency**: Every cent moved is trackable via an immutable ledger system.

---

## 2. Technology Stack

### Frontend & Core
-   **Framework**: [Next.js 14+](https://nextjs.org/) (App Router) - chosen for its server-side rendering and API capabilities.
-   **Language**: **TypeScript** - ensured strict type safety across full-stack.
-   **Styling**: **Tailwind CSS** - for rapid, utility-first UI development.
-   **Icons**: `lucide-react`.
-   **Charts**: `recharts` - for performance graphs.

### Backend & Data
-   **Runtime**: Node.js (via Next.js API Routes).
-   **Database**: **MongoDB Atlas** - chosen for its document model which fits the nested nature of financial transactions and logs.
-   **ODM**: **Mongoose** - for schema validation and middleware.
-   **Authentication**: **NextAuth.js** - supporting Credentials and Google OAuth.
-   **Real-time Updates**: Custom Socket implementation (Event-driven).

### Integrations
-   **Payments**: **Razorpay** (Orders, Webhooks, Signature Verification).
-   **Email**: Nodemailer (Transactional emails for deposits/withdrawals).

---

## 3. System Architecture

The system follows a **Modular Monolith** architecture within the Next.js ecosystem. 

### High-Level Architecture
1.  **Client Layer**: React Components (Server and Client) handling UI/UX.
2.  **API Layer**: Secure API Routes (`src/app/api/...`) acting as the interface.
3.  **Service Layer**: Business logic centralized in `src/lib/services` (e.g., `LedgerService`).
4.  **Data Layer**: Mongoose Models interacting with MongoDB.

### Data Flow Pattern
1.  **Action**: User initiates an action (e.g., Deposit).
2.  **Validation**: Zod schemas validate input.
3.  **Processing**: `LedgerService` executes the business logic.
4.  **Persistence**: **Atomic Transactions** (MongoDB Sessions) ensure data integrity.
5.  **View Update**: `Wallet` (Materialized View) is updated for fast read access.
6.  **Notification**: Socket emits event to Frontend; Email service sends confirmation.

---

## 4. Database Design

### Core Collections

#### 1. Users (`users`)
-   **_id**: ObjectId
-   **role**: `USER` | `ADMIN`
-   **status**: `ACTIVE` | `BLOCKED`
-   **kycStatus**: `NOT_SUBMITTED` | `PENDING` | `VERIFIED`
-   **payoutPreference**: `COMPOUND` | `PAYOUT`
-   **referredBy**: ObjectId (Ref: User)

#### 2. Wallets (`wallets`) - *The Materialized View*
*Design Rationale: To avoid calculating balances from millions of ledger entries every time, we maintain a live snapshot.*
-   **userId**: ObjectId
-   **principal**: Number (Active Capital)
-   **profit**: Number (Withdrawable Gains)
-   **referral**: Number (Commissions)
-   **locked**: Number (Funds in transit/withdrawal)

#### 3. Transactions (`transactions`) - *The High-Level Record*
-   **type**: `DEPOSIT` | `WITHDRAWAL` | `PROFIT` | `REFERRAL_BONUS`
-   **status**: `INITIATED` | `PENDING` | `SUCCESS` | `FAILED`
-   **amount**: Number
-   **gatewayOrderId**: String (Razorpay)
-   **riskFlag**: `LOW` | `MEDIUM` | `HIGH`

#### 4. LedgerEntries (`ledgerentries`) - *The Immutable Log*
*The "Accountant" of the system. Implements Double-Entry Bookkeeping.*
-   **accountType**: `PRINCIPAL` | `PROFIT` | `GATEWAY` | `LOCKED` | ...
-   **direction**: `CREDIT` | `DEBIT`
-   **amount**: Number
-   **transactionId**: ObjectId
-   *Invariant*: Sum(Debits) must equal Sum(Credits) for every transaction group.

#### 5. Investments (`investments`)
-   **plan**: `FLEXI` | `FIXED_3M` | `FIXED_6M` | `FIXED_1Y`
-   **amount**: Number
-   **startDate**: Date
-   **maturityDate**: Date
-   **isActive**: Boolean

---

## 5. User Roles & Permissions

### A. USER (Investor)
*   **View**: Personal Dashboard, Portfolio Performance, Transaction History.
*   **Create**: Deposits (via Gateway), Withdrawal Requests.
*   **Update**: Profile settings, Payout preference.
*   **Access**: Restricted to own data via `session.user.id`.

### B. ADMIN (System Manager)
*   **View**: Global Command Center, All Users, System Ledger, Financial Health.
*   **Action**: 
    *   Approve/Reject Withdrawals (Input UTR).
    *   Block/Unblock Users.
    *   Manage Investment Strategies/Rates.
*   **Security**: Protected by `role === 'ADMIN'` middleware checks.

---

## 6. Complete Feature Breakdown

### Feature A: Deposit & Investment
**Purpose**: Onboard funds and start earning.
1.  **Input**: Amount, Plan Selection (e.g., Fixed 6 Months).
2.  **Process**:
    *   Create Razorpay Order.
    *   **Verify Signature** (HMAC-SHA256).
    *   **Ledger**: Debit `GATEWAY` (System Asset Source), Credit `PRINCIPAL` (User Liability).
    *   **Investment**: Create `Investment` doc with maturity date.
    *   **Referral**: If user was referred, Credit 1% to Referrer's `REFERRAL` balance (Pending Admin Approval).
3.  **Output**: Updated Wallet Balance, Email Confirmation.

### Feature B: Withdrawal (The "Waterfall" Logic)
**Purpose**: Liquidate funds securely.
1.  **Input**: Amount to withdraw.
2.  **Logic (Waterfall)**:
    *   System checks balances in this specific order:
        1.  **Profit** (Taxable/Gains first)
        2.  **Referral** (Commission second)
        3.  **Principal** (Capital last - triggers investment breakage)
    *   If `Principal` is touched, valid `FLEXI` investments are reduced/closed.
3.  **Ledger**: Debit (Profit/Referral/Principal), Credit `LOCKED` (Escrow).
4.  **Admin Action**: Admin reviews request, transfers money via Bank, enters UTR.
5.  **Finalization**: Debit `LOCKED`, Credit `ADMIN_BANK` (System Output).

### Feature C: User Management (Admin)
**Purpose**: Control access and risk.
1.  **Capabilities**: View detailed user profile, wallet stats, and KYC status.
2.  **Actions**: "Block User" immediately invalidates their session (checked via `callbacks.session`).

---

## 7. API Structure

### Authentication
*   `POST /api/auth/signin`: Credentials or Google OAuth.
*   `GET /api/auth/session`: Retrieve current session/role.

### Finance
*   `POST /api/finance/deposit/verify`: Complete deposit flow.
*   `POST /api/finance/withdraw`: Request withdrawal.
*   `GET /api/finance/transactions`: Fetch user history.

### Admin
*   `GET /api/admin/users`: List all users.
*   `POST /api/admin/finance/withdraw/approve`: Approve withdrawal (requires UTR).
*   `POST /api/admin/finance/withdraw/reject`: Reject withdrawal (Reverses Ledger).

---

## 8. Business Logic & Algorithms

### The Double-Entry Engine (`LedgerService`)
Every financial movement is atomic.
```typescript
// Conceptual Flow
Transaction {
  Movements: [
    { Account: 'PRINCIPAL', Direction: 'DEBIT', Amount: 5000 },
    { Account: 'LOCKED',    Direction: 'CREDIT', Amount: 5000 }
  ]
}
// Constraint: Sum(Debit) === Sum(Credit)
```

### Waterfall Liquidation Algorithm
Used during withdrawal to protect user's core capital as long as possible.
```python
remaining_request = 1000
# Step 1: Use Profit
deduct_profit = min(wallet.profit, remaining_request)
remaining_request -= deduct_profit

# Step 2: Use Referral
deduct_referral = min(wallet.referral, remaining_request)
remaining_request -= deduct_referral

# Step 3: Use Principal
deduct_principal = remaining_request
```

### Investment Maturity
Fixed plans (`FIXED_6M`) have a `maturityDate`. Logic prevents early withdrawal of these specific funds unless a "Break" penalty logic is invoked (if implemented) or they are strictly locked.

---

## 9. Security Design

### 1. Authentication & Session Management
-   **Strategy**: JWT (JSON Web Tokens).
-   **Security**: Token is stateless, but `session` callback performs a **Database Lookup** on critical fields (`status`, `role`) every time the client requests a session. This allows for **Instant Ban Enforcement**.

### 2. Transaction Integrity
-   **Idempotency**: Razorpay Order IDs are tracked. A deposit cannot be processed twice (`Deposit.status` check).
-   **Atomicity**: All multi-document writes (Ledger + Wallet + Transaction) occur within a **MongoDB Transaction Session**. If one fails, all roll back.

### 3. Data Protection
-   **Input Validation**: All API inputs are validated with **Zod** schemas.
-   **No Floating Point Errors**: Financial calculations should ideally use Integer math (cents), though current implementation uses safely handled Floats with epsilon checks in `LedgerService`.

### 4. Access Control (RBAC)
-   API Routes check `session.user.role`.
-   Admin routes explicitly return `401 Unauthorized` if role is not `ADMIN`.
