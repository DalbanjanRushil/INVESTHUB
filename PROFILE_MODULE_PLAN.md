
# User Profile & Settings Module Plan

## 1. Overview
The Profile Module gives users control over their account security, personal details, and verification status. In a fintech app, this is where "KYC" (Know Your Customer) happens. This module adds depth to the "Simulation" by mimicking real-world verification flows.

## 2. Features
1.  **Personal Details**: View/Edit Name, Email (Read-only), Phone.
2.  **Security**: Change Password.
3.  **KYC Verification**:
    *   Upload "ID Proof" (Simulation).
    *   Status: Unverified -> Pending -> Verified.
4.  **Referral Network**:
    *   Detailed list of users referred.
    *   Total Commission earned.
5.  **Export Data**: Button to download Transaction History (CSV Simulation).

## 3. UI Structure
*   **Page**: `/dashboard/profile`
*   **Layout**: Sidebar or Tabs (General, Security, KYC, Referrals).
*   **Components**:
    *   `ProfileHeader`: Avatar, Name, Email.
    *   `SecurityForm`: Old Pass, New Pass.
    *   `KYCBox`: Status badge and Upload button.
    *   `ReferralTable`: List of referred users.

## 4. API Endpoints
*   `GET /api/user/profile`: Fetch detailed info + KYC status.
*   `PUT /api/user/profile`: Update details.
*   `POST /api/user/kyc`: Upload docs (Mock).
*   `GET /api/user/referrals`: Fetch referral list.

## 5. Implementation Steps
1.  Create `src/app/api/user/profile/route.ts`.
2.  Create `src/app/api/user/referrals/route.ts`.
3.  Create `src/app/(dashboard)/dashboard/profile/page.tsx`.
4.  Add "Profile" link to `Navbar`.

