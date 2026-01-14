
# Admin Strategy Management Plan

## 1. Overview
This module empowers the Admin to "control the narrative" of the investment fund. The Admin can update the visible track record, change the asset allocation pie chart, and broadcast new messages to investors. This brings the static `InvestmentStrategy` model to life.

## 2. Features
1.  **Update Monthly ROI**:
    *   Add a new record for the current month (e.g., "Jan 2026: +2.4%") to keep the graph moving.
2.  **Edit Allocation**:
    *   Modify the percentages of the portfolio (e.g., reduce "Liquid" to increase "Tech").
    *   System must ensure total = 100%.
3.  **Update Manager Note**:
    *   Change the "CEO Message" displayed on the user dashboard.

## 3. Implementation Steps

### Backend
1.  **API Route**: `PUT /api/admin/strategy`
    *   payload: `{ action: 'ADD_HISTORY' | 'UPDATE_ALLOCATION' | 'UPDATE_MESSAGE', data: ... }`
    *   Auth: Admin Only.

### Frontend (Admin Dashboard)
1.  **StrategyManager Component**:
    *   A clean UI to view current settings.
    *   Form to add a Month/ROI.
    *   Form to edit Allocation rows.
    *   Form to edit Description/Message.

## 4. Worklfow
1.  Admin logs in.
2.  Dashboard -> "Strategy Management" Card.
3.  Admin enters "Feb 2026" and "+1.2%".
4.  Clicks "Publish Record".
5.  User immediately sees the graph update.

