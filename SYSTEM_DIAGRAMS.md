# InvestHub System Diagrams & Architecture
> **Architecture Style**: Single Page Application (SPA) / Modern Web App (Next.js)
> **Generated On**: 2026-02-12

This document contains comprehensive architectural diagrams for the **InvestHub** platform. The diagrams are defined using **Mermaid.js** syntax, which renders into visual charts.

---

## 1. System Context Diagram (DFD Level 0)

**Description**: High-level view of how users and external systems interact with InvestHub.

```mermaid
graph TD
    %% Actors
    User((Investor))
    Admin((Administrator))

    %% System Boundary
    subgraph InvestHub Platform
        Portal[InvestHub Web Application]
    end

    %% External Systems
    Razorpay[Razorpay Payment Gateway]
    EmailService[Email Provider (SMTP/Resend)]
    GoogleAuth[Google OAuth]

    %% Relationships
    User -->|Views Portfolio, Invests, Withdraws| Portal
    Admin -->|Manages Capital, Approves Withdrawals| Portal
    
    Portal -->|Initiates Payments, Verifies Webhooks| Razorpay
    Portal -->|Sends OTPs, Notifications| EmailService
    Portal -->|Authenticates Users| GoogleAuth
    
    Razorpay -->|Payment Status Updates (Webhook)| Portal
```

---

## 2. Container Architecture (C4 Level 2)

**Description**: Detailed breakdown of the application containers and technology choices.

```mermaid
graph TD
    %% Clients
    Browser[Web Browser (Client)]
    
    %% Server Side
    subgraph "Next.js Environment (Serverless)"
        Router[App Router (Server Components)]
        API[API Routes / Server Actions]
        Auth[NextAuth.js Handler]
        Services[Business Logic Layer]
    end

    %% Data Store
    DB[(MongoDB Database)]
    
    %% Flows
    Browser -- "HTTPS / JSON / RSC Payload" --> Router
    Browser -- "AJAX / Fetch API (Client Actions)" --> API
    
    Router -- "Queries Data" --> DB
    API -- "CRUD Operations" --> Services
    Services -- "Mongoose Models" --> DB
    
    Auth -- "Validates Session" --> DB
    Auth -- "OAuth Handshake" --> GoogleAuth[Google Identity]
```

---

## 3. Data Flow Diagram Strategy (DFD Level 1)

**Description**: Functional decomposition of the system's core processes.

```mermaid
flowchart TD
    User((User))
    Admin((Admin))
    Database[(Main Database)]
    
    subgraph "InvestHub System"
        P1[1.0 Authentication]
        P2[2.0 Investment Management]
        P3[3.0 Wallet & Transactions]
        P4[4.0 Admin Administration]
    end

    User -->|Credentials| P1
    P1 -->|Session Token| User
    
    User -->|Select Plan, Amount| P2
    P2 -->|Create Investment| Database
    P2 -->|Deduct Balance| P3
    
    User -->|Withdraw Request| P3
    P3 -->|Lock Funds| Database
    
    Admin -->|Login| P1
    Admin -->|Approve Withdrawal| P4
    P4 -->|Update Status| P3
    P3 -->|Unlock/Transfer Funds| Database
```

---

## 4. Component Diagram

**Description**: Internal structure of the application logic modules.

```mermaid
classDiagram
    class Frontend {
        +DashboardPage
        +InvestmentModal
        +ProfileSettings
    }

    class API_Layer {
        +POST /api/finance/deposit
        +POST /api/finance/withdraw
        +POST /api/admin/manage
    }

    class Service_Layer {
        +LedgerService
        +AuthService
        +NotificationService
    }

    class Data_Layer {
        +UserModel
        +WalletModel
        +InvestmentModel
        +TransactionModel
    }

    Frontend --> API_Layer : JSON Requests
    API_Layer --> Service_Layer : Invokes Logic
    Service_Layer --> Data_Layer : CRUD Operations
    Data_Layer --> MongoDB : Mongoose Driver
```

---

## 5. Entity Relationship Diagram (ERD)

**Description**: The data schema and relationships between core entities.

```mermaid
erDiagram
    USER ||--|| WALLET : has
    USER ||--o{ INVESTMENT : owns
    USER ||--o{ TRANSACTION : initiates
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ USER : refers

    INVESTMENT }|--|| STRATEGY : follows

    USER {
        string _id PK
        string email
        string password
        enum role "USER|ADMIN"
        enum status "ACTIVE|BLOCKED"
        string referralCode
        string kycStatus
    }

    WALLET {
        string _id PK
        string userId FK
        number principal
        number profit
        number locked
        number referral
        number totalDeposited
        number totalWithdrawn
    }

    INVESTMENT {
        string _id PK
        string userId FK
        number amount
        string plan
        date startDate
        date maturityDate
        boolean isActive
    }

    TRANSACTION {
        string _id PK
        string userId FK
        enum type "DEPOSIT|WITHDRAWAL|PROFIT"
        number amount
        enum status "PENDING|SUCCESS|FAILED"
        string razorpayOrderId
        string utrNumber
    }

    STRATEGY {
        string _id PK
        string name
        number lockInPeriod
        number internalROI
        number conservativeROI
        enum riskLevel
    }
```

---

## 6. Sequence Diagram: Deposit & Investment Flow

**Description**: The step-by-step process of a user adding funds and starting an investment.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend (Client)
    participant API as /api/finance/deposit
    participant RP as Razorpay
    participant DB as MongoDB

    User->>UI: Cliks "Invest" & Enters Amount
    UI->>API: POST /api/finance/deposit {amount, plan}
    
    API->>RP: Create Order (amount, currency)
    RP-->>API: Return Order ID
    API->>DB: Create Deposit Record (Status: PENDING)
    API-->>UI: Return Order ID & Key

    UI->>RP: Open Payment Modal
    User->>RP: Completes Payment
    RP-->>UI: Payment Success Callback
    
    UI->>API: POST /api/finance/invest/verify {paymentId, orderId}
    API->>RP: Verify Signature (HMAC)
    
    alt Signature Valid
        API->>DB: Update Deposit -> SUCCESS
        API->>DB: Create Investment Record (Active)
        API->>DB: Update Wallet (TotalDeposited + Amount)
        API-->>UI: Success Response
        UI->>User: Show "Investment Active" Modal
    else Signature Invalid
        API-->>UI: Error Response
        UI->>User: Show "Payment Verification Failed"
    end
```

---

## 7. Sequence Diagram: Withdrawal Request & Admin Approval

**Description**: The governance flow for moving funds out of the system.

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API_W as /api/finance/withdraw
    participant API_A as /api/admin/withdraw
    participant Ledger as LedgerService
    actor Admin
    participant Email as EmailService

    %% User Request
    User->>UI: Request Withdrawal (e.g., ₹5000)
    UI->>API_W: POST /api/finance/withdraw {amount}
    
    API_W->>Ledger: Check Balance & Lock Funds
    alt Sufficient Balance
        Ledger->>DB: Wallet.profit -= 5000
        Ledger->>DB: Wallet.locked += 5000
        API_W->>DB: Create Withdrawal Request (PENDING)
        API_W-->>UI: Request Submitted
    else Insufficient Balance
        API_W-->>UI: Error: Insufficient Funds
    end

    %% Admin Approval
    Admin->>UI: View Pending Withdrawals
    Admin->>UI: Click "Approve" (Enter UTR: UTR123)
    
    UI->>API_A: POST /api/admin/withdraw/manage {id, action: "APPROVE", utr}
    
    API_A->>Ledger: Finalize Withdrawal
    Ledger->>DB: Wallet.locked -= 5000
    Ledger->>DB: Wallet.totalWithdrawn += 5000
    Ledger->>DB: Update Withdrawal -> APPROVED (with UTR)
    
    API_A->>Email: Send "Withdrawal Approved" Email to User
    API_A-->>UI: Success Message
```

---

## 8. Deployment Architecture

**Description**: Infrastructure topology for production deployment.

```mermaid
graph TD
    UserDevice[User Device (Mobile/Desktop)]
    
    subgraph Cloud Infrastructure
        LB[Load Balancer / CDN (Vercel Edge)]
        
        subgraph Compute Region (Serverless)
            NextApp[Next.js Application Server]
        end
        
        subgraph Database Cluster (Atlas)
            PrimaryDB[(MongoDB Primary)]
            ReplicaDB[(MongoDB Replica)]
        end
    end
    
    UserDevice -- HTTPS --> LB
    LB -- Route Request --> NextApp
    NextApp -- Mongoose Connection --> PrimaryDB
    PrimaryDB -- Replication --> ReplicaDB
```

---

## 9. DFD Level 2: Investment Process

**Description**: Detailed breakdown of the 'Investment Management' process.

```mermaid
flowchart LR
    User -->|Input Amount| Validate[2.1 Validate Amount]
    Validate -->|Valid| CreateOrder[2.2 Create Razorpay Order]
    CreateOrder -->|Order ID| Payment[2.3 Process Payment]
    Payment -->|Webhook Success| Verify[2.4 Verify Signature]
    Verify -->|Valid| CreateInv[2.5 Create Investment Record]
    Verify -->|Valid| UpdateWallet[2.6 Update Wallet Stats]
    CreateInv --> DB[(Investments)]
    UpdateWallet --> DB[(Wallets)]
```

