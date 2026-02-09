# InvestHub - Wealth Management Simulation Platform

**InvestHub** is a high-fidelity academic fintech simulation platform designed to model a profit-sharing investment ecosystem. It features a sophisticated dual-interface system (User & Admin) built with modern web technologies, ensuring a premium, secure, and responsive experience.

## 🚀 Tech Stack

- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Custom Premium Dark Theme `0B1120`)
- **Database:** [MongoDB](https://www.mongodb.com/) (via Mongoose)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Credentials w/ Role-Based Access)
- **Real-time:** Custom Polling / Socket.io (ready for integration)
- **Validation:** [Zod](https://zod.dev/)

---

## ✨ Key Features

### 🔐 Authentication & Security
- **Role-Based Access Control (RBAC):** Distinct flows for `USER` and `ADMIN` roles.
- **Secure Login:** Encrypted passwords (bcrypt) and protected routes.
- **Session Management:** Robust session handling with automatic redirections.
- **Safety:** Optimistic Concurrency Control (OCC) for withdrawals to prevent double-spending.

### 👤 User Dashboard
- **Portfolio Overview:** Real-time visibility of Principal, Profit, and Referral bonuses.
- **Investment Management:** View active `FLEXI` and `LOCKED` (Fixed Deposit) plans.
- **Financial Actions:** Seamless UI for Deposits and Withdrawals.
- **Transaction History:** Detailed logs of all financial movements.
- **Dark Mode UI:** A consistent, premium navy-dark aesthetic.

### 🛡️ Admin Command Center
- **Dashboard Toggle:** Instantly switch between Admin stats and a simulated User View.
- **Capital Management:** Monitor total pool capital, user count, and active investments.
- **Settlement Engine:**
  - **Full Liquidation:** Atomic execution to settle User Wallets + Investments safely.
  - **Profit Distribution:** Bulk distribute profits based on User Principal (smartly excluding uninvested balance).
- **Strategy Manager:** Create and manage lock-in plans (3M, 6M, 1Y).
- **Content Studio:** Upload and manage educational resources (PDFs, Videos).
- **User Operations:** View detailed user audits and fix balance desyncs automatically (Self-Healing Ledger).

---

## 📂 Project Structure

```bash
src/
├── app/
│   ├── (auth)/             # Login, Register, Forgot Password
│   ├── (dashboard)/        # Protected User & Admin Routes
│   │   ├── admin/          # Admin-specific pages (Command Center)
│   │   └── dashboard/      # User Portfolio
│   ├── api/                # Backend API Routes (Next.js serverless)
│   │   ├── admin/          # Settlement, Distribution, Content APIs
│   │   └── finance/        # Withdrawal, Investment APIs
│   └── page.tsx            # Landing Page
├── components/
│   ├── admin/              # Admin widgets (Toggle, Strategy, Stats)
│   ├── dashboard/          # User widgets (Hero, Actions, Charts)
│   ├── layout/             # Navbar, Sidebar, Shell
│   └── providers/          # Context Providers (Auth, Theme)
├── lib/                    # Utilities (DB Connect, Auth Options, Helpers)
└── models/                 # Mongoose Schemas (User, Wallet, Investment, Transaction)
```

---

## 🛠️ Setup & Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/investhub.git
    cd investhub
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env.local` file:
    ```env
     MONGODB_URI= your mongo db uri 
NEXTAUTH_SECRET=create , your own secret key 
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY_ID= create razorpay id
RAZORPAY_KEY_SECRET= razorpay secret key 
EMAIL_USER= enter email for the managemnet who is responsible for mailing for the system 
EMAIL_PASS= email password , which will be know as app password 
GOOGLE_CLIENT_ID= google ai studio , client id 
GOOGLE_CLIENT_SECRET= scret key 
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

5.  **Access the App**
    - Landing: `http://localhost:3000`
    - Admin: `http://localhost:3000/admin/dashboard`

---

## 🧩 Future Roadmap (For AI Planning)

- [ ] **Payment Gateway Integration:** Verification of Razorpay/Stripe webhooks.
- [ ] **Advanced Analytics:** Chart.js integration for profit trendlines.
- [ ] **KYC Module:** Document upload and admin verification flow.
- [ ] **Email Service:** Switch from Nodemailer to Resend/SendGrid for reliability.
- [ ] **Mobile App:** React Native adaptation using shared components.

---

*Verified & maintained by the InvestHub Engineering Team.*
