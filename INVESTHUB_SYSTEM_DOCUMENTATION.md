# InvestHub System Documentation & Data Flow Report

**Date:** 2026-01-30
**Project:** InvestHub - Investment Management Platform

This document allows for the creation of Data Flow Diagrams (DFD), Entity-Relationship Diagrams (ERD), Activity Diagrams, and Sequence Diagrams.

---

## 1. System Overview
InvestHub is a web-based platform connecting **Investors (Users)** with investment opportunities managed by **Administrators**. It handles secure authentication, financial transactions (deposits/withdrawals), investment lifecycle management, and profit distribution.

---

## 2. External Entities (DFD Terminators)

| Entity | Description | Interactions |
| :--- | :--- | :--- |
| **User (Investor)** | The end-user of the platform. | Registers, Deposits Funds, Invests in Plans, Withdraws Funds, Uploads KYC. |
| **Admin** | Managing authority. | Verifies KYC, Declares Performance/Profit, Approves Withdrawals, Manages Content. |
| **Payment Gateway** (Razorpay) | External financial service. | Processes Deposits (Incoming), handles payment verification signatures. |
| **Bank System** | External banking network. | Receives Withdrawal Reference (conceptually), targeted by Admin for payouts. |

---

## 3. Data Stores (Database Collections)

For DFD Level 1 & 2, these are your primary data repositories:

| Store Name | Collection ID | Content Description |
| :--- | :--- | :--- |
| **Users Store** | `users` | Auth credentials, Profile, Role, KYC Status, Referral Links. |
| **Wallets Store** | `wallets` | Financial balances (Principal, Profit, Locked), Total Stats. |
| **Transactions Store** | `transactions` | Ledger of every movement (Deposit, Withdrawal, Profit, Invest). |
| **Investments Store** | `investments` | Active active holdings (Flexi/Fixed plans), Maturity dates. |
| **Deposits Store** | `deposits` | Logs of incoming payment gateway requests & their status. |
| **Withdrawals Store** | `withdrawals` | Queue of payout requests awaiting Admin approval. |
| **Perf. Periods Store**| `performance_periods` | Admin-declared profit records for specific timeframes. |
| **KYC Store** | `kyc_requests` | ID Proofs, Pan/Aadhaar numbers, verification status. |
| **Content Store** | `contents` | Educational videos/blogs and user engagement (likes/comments). |

---

## 4. Key Processes & Data Flows

### Process 1.0: User Management & KYC
**Flow:**
1.  **User** sends `Registration Info (Name, Email, Password)` to **System**.
2.  **System** validates & stores in **Users Store**.
3.  **User** uploads `KYC Documents (PAN, Aadhaar, Selfie)` to **System**.
4.  **System** stores in **KYC Store** and updates **User Status** to `PENDING`.
5.  **Admin** requests `Pending KYC List`.
6.  **Admin** sends `Verification Decision (Approve/Reject)` to **System**.
7.  **System** updates **Users Store** (`kycStatus: VERIFIED`).

### Process 2.0: Deposit & Funds Management
**Flow:**
1.  **User** initiates `Deposit Request (Amount, Plan)` via **Interface**.
2.  **System** creates `Order ID` with **Payment Gateway**.
3.  **User** completes payment on **Payment Gateway**.
4.  **Payment Gateway** returns `Payment Success (Signature, PaymentID)` to **System**.
5.  **System** validates signature.
6.  **System** updates:
    *   **Deposits Store**: Mark as `SUCCESS`.
    *   **Wallets Store**: Increment `principal` or `balance`.
    *   **Transactions Store**: Create `DEPOSIT` record.

### Process 3.0: Investment Portfolio
**Description:** Moving funds from idle Wallet to active Investment Plans.
**Flow:**
1.  **User** requests `New Investment (Amount, Plan Type e.g., FIXED_1Y)`.
2.  **System** checks **Wallets Store** for sufficient funds.
3.  **System** deducts amount from **Wallets Store** (`principal` -> `locked`).
4.  **System** creates record in **Investments Store** (`isActive: true`, `maturityDate`).
5.  **System** logs event in **Transactions Store** (Type: `INVEST`).

### Process 4.0: Profit Distribution (Admin)
**Description:** Allocating earnings to users based on performance.
**Flow:**
1.  **Admin** inputs `Performance Data (Net Profit, Period)` to **System**.
2.  **System** stores in **Perf. Periods Store**.
3.  **Admin** triggers `Distribute Profit`.
4.  **System** calculates `User Share` vs `Admin Share`.
5.  **System** iterates through **Wallets Store**:
    *   Calculates individual share based on `principal`.
    *   Applies TDS (Tax) if applicable.
    *   Updates `profit` balance in **Wallets Store**.
6.  **System** creates `PROFIT` records in **Transactions Store**.

### Process 5.0: Withdrawal Management
**Flow:**
1.  **User** requests `Withdrawal (Amount)` via **System**.
2.  **System** validates balance in **Wallets Store**.
3.  **System** debits funds temporarily or places hold (Logic: "Waterfall Deduction" - Profit first, then Principal).
4.  **System** creates entry in **Withdrawals Store** (Status: `PENDING`).
5.  **Admin** reviews `Pending Withdrawals`.
6.  **Admin** sends `Approval` to **System**.
7.  **System** marks **Withdrawals Store** entry as `APPROVED`.
8.  **System** logs `WITHDRAWAL` in **Transactions Store**.
    *   *Note: If Rejected, funds are refunded to Wallet.*

---

## 5. Detailed Data Structures (For Data Dictionary)

### 5.1 User Entity
*   `_id`: UUID
*   `email`: String (Unique)
*   `role`: ADMIN | USER
*   `payoutPreference`: COMPOUND | PAYOUT

### 5.2 Wallet Entity
*   `userId`: Foreign Key (User)
*   `principal`: Currency (Invested Capital)
*   `profit`: Currency (Available Earnings)
*   `locked`: Currency (In Fixed Plans)

### 5.3 Transaction Entity
*   `userId`: Foreign Key
*   `type`: DEPOSIT | WITHDRAWAL | PROFIT
*   `amount`: Number
*   `status`: SUCCESS | PENDING | FAILED

---

## 6. Sequence Logic Notes (for Sequence Diagrams)

*   **Deposit**: The `Deposit` record is created *before* the payment succeeds (Status: PENDING). It is only updated to SUCCESS after the Razorpay callback/verification loop closes.
*   **Withdrawal**: It is a two-step commit. 1. User Request (Creates Pending Record). 2. Admin Action (Finalizes Record & updates Transaction Ledger).
