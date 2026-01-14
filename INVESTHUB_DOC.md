# INVESTHUB System Documentation

## 1. System Overview
**InvestHub** is a comprehensive investment simulation platform designed to facilitate user capital growth through simulated investment cycles. The system allows users to deposit funds, accumulate profits based on admin-controlled distribution scenarios, and withdraw earnings. Ideally suited for financial logic testing and user management simulation.

---

## 2. Technology Stack
*   **Frontend**: Next.js 14 (React), Tailwind CSS.
*   **Backend**: Next.js API Routes (Serverless functions).
*   **Database**: MongoDB (Mongoose ODM).
*   **Authentication**: NextAuth.js (Credentials Provider).
*   **Real-time Communication**: Socket.io (Custom implementation via API trigger).
*   **Payments**: Razorpay Integration.
*   **Email Service**: Nodemailer (Gmail SMTP).

---

## 3. Database Architecture (Schemas)

### 3.1 `User`
*   **_id**: ObjectId
*   **name**: String (Required)
*   **email**: String (Unique, Indexed)
*   **password**: String (Hashed)
*   **role**: Enum [`USER`, `ADMIN`] (Default: `USER`)
*   **status**: Enum [`ACTIVE`, `BLOCKED`] (Default: `ACTIVE`)
*   **payoutPreference**: Enum [`COMPOUND`, `PAYOUT`] - *Determines where profit goes.*
*   **referralCode**: String (Unique)
*   **createdAt**: Date

### 3.2 `Wallet`
*   **userId**: ObjectId (Ref: User, Unique 1:1)
*   **balance**: Number (Principal + Compounded Balance)
*   **payoutWalletBalance**: Number (Withdrawable Profits if preference is PAYOUT)
*   **totalDeposited**: Number (Lifetime Deposits)
*   **totalWithdrawn**: Number (Lifetime Withdrawals)
*   **totalProfit**: Number (Lifetime Profit)

### 3.3 `Transaction`
*   **userId**: ObjectId (Ref: User)
*   **type**: Enum [`DEPOSIT`, `WITHDRAWAL`, `PROFIT`, `REFERRAL_BONUS`]
*   **amount**: Number
*   **status**: Enum [`SUCCESS`, `PENDING`, `FAILED`]
*   **referenceId**: ObjectId (Polymorphic Ref to Deposit/Withdrawal/ProfitDistribution)
*   **description**: String
*   **createdAt**: Date (Indexed for sort)

### 3.4 `Deposit`
*   **userId**: ObjectId
*   **amount**: Number
*   **razorpayOrderId**: String
*   **razorpayPaymentId**: String
*   **razorpaySignature**: String
*   **status**: Enum [`PENDING`, `SUCCESS`, `FAILED`]

### 3.5 `Withdrawal`
*   **userId**: ObjectId
*   **amount**: Number
*   **status**: Enum [`PENDING`, `APPROVED`, `REJECTED`]
*   **adminRemark**: String
*   **processedAt**: Date

### 3.6 `ProfitDistribution`
*   **totalProfit**: Number (Total pool)
*   **adminShare**: Number
*   **userShare**: Number
*   **distributedToUserCount**: Number
*   **distributionDate**: Date

### 3.7 `Content`
*   **type**: Enum [`VIDEO`, `CHART`, `POST`]
*   **title**: String
*   **url**: String (Resource Link)
*   **uploadedBy**: ObjectId (Admin)
*   **isPublic**: Boolean

### 3.8 `Notification`
*   **userId**: ObjectId
*   **title**: String
*   **message**: String
*   **isRead**: Boolean

---

## 4. Actors & Roles

### 4.1 User (Investor)
*   **Capabilities**:
    *   Register and create account.
    *   Manage Profile & Payout Preference (Compound vs Payout).
    *   Deposit Funds via Payment Gateway.
    *   Request Withdrawals.
    *   View Real-time Dashboard (Balance, Charts).
    *   Consume Educational Content.

### 4.2 Admin (Manager)
*   **Capabilities**:
    *   View Global Dashboard (Total Users, Liquidity, etc.).
    *   Manage Users (Block/Unblock).
    *   Upload Educational Content.
    *   **Manage Withdrawals**: View Pending, Approve (Finalize), or Reject (Refund).
    *   **Distribute Profit**: Input Period Profit -> System calculates & distributes.

---

## 5. Module: Financial Logic & Flows

### 5.1 Deposit Flow
1.  **Initiation**: User enters amount.
2.  **Gateway**: System creates Razorpay Order.
3.  **Payment**: User completes payment on Client.
4.  **Verification (Backend)**:
    *   Verify Signature.
    *   If Valid:
        *   Update `Deposit` status to `SUCCESS`.
        *   Update `Wallet`: Increment `balance`, Increment `totalDeposited`.
        *   Create `Transaction`: Type `DEPOSIT`, Status `SUCCESS`.
        *   **Socket Event**: Notify User Client to update balance.

### 5.2 Withdrawal Flow
1.  **Request (User)**:
    *   Check `Wallet.balance >= amount`.
    *   **Deduction Action**: `Wallet.balance -= amount` (Funds Locked immediately).
    *   `Wallet.totalWithdrawn += amount`.
    *   Create `Withdrawal` doc (Status: `PENDING`).
    *   Create `Transaction` doc (Status: `PENDING`).
    *   **Socket Event**: Notify Admin Dashboard of new request.
2.  **Processing (Admin)**:
    *   Admin views Pending list.
    *   **Action: APPROVED**:
        *   Update `Withdrawal.status` = `APPROVED`.
        *   Send Notification to User.
        *   Socket Update: User notified of success.
    *   **Action: REJECTED**:
        *   Update `Withdrawal.status` = `REJECTED`.
        *   **Refund Action**: `Wallet.balance += amount` (Funds returned).
        *   `Wallet.totalWithdrawn -= amount` (Revert metric).
        *   Send Notification to User (with Remark).
        *   Socket Update: User notified of refund.

### 5.3 Profit Distribution Flow
1.  **Input**: Admin inputs `Total Profit`.
2.  **Calculation**:
    *   System calculates share split (e.g., 20% Admin / 80% Users - configurable).
3.  **Distribution Loop**:
    *   For each Active User with Balance > 0:
        *   Calculate User's pro-rata share based on Capital.
        *   **Check Preference**:
            *   If `COMPOUND`: Add share to `Wallet.balance`.
            *   If `PAYOUT`: Add share to `Wallet.payoutWalletBalance`.
        *   Create `Transaction`: Type `PROFIT`.
        *   Notify User.

---

## 6. Logic Explanations for Diagrams

### 6.1 Flowchart (User Journey)
*   **Start** -> Login -> Dashboard.
*   **Decision**:
    *   **Deposit**: -> Gateway -> Success -> Balance Update -> End.
    *   **Withdraw**: -> Input Amount -> Check Balance -> Deduct -> Wait Approval -> End.
    *   **View Content**: -> Browse Feed -> End.

### 6.2 Sequence Diagram (Withdrawal)
1.  **User** -> `POST /api/finance/withdraw` (Amount).
2.  **System** -> DB: Find Wallet.
3.  **DB** -> System: Return Wallet.
4.  **System** -> System: Check Balance & Deduct.
5.  **System** -> DB: Create Withdrawal & Transaction (Pending).
6.  **System** -> Socket: Emit `admin:new_request`.
7.  **Admin** -> `POST /api/admin/withdraw/manage` (Approve/Reject).
8.  **System** -> DB: Update Status.
    *   *Alt [Reject]*: System -> DB: Refund Wallet.
9.  **System** -> Socket: Emit `user:update`.
10. **System** -> Email: Send Notification.

---

## 7. Folder Structure & Key Files
*   `src/models/`: Mongoose Schemas (Single source of truth for data).
*   `src/app/api/finance/`: User financial routes.
*   `src/app/api/admin/`: Admin management routes.
*   `src/components/`: Reusable UI (Forms, Charts).
*   `src/lib/`: Utilities (DB Connect, Auth, Email, Socket).
