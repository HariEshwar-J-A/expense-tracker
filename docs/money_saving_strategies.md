# 💡 Future Scope: Expense Reduction & Savings Optimization

To transform the app from a simple "tracker" to a financial assistant, here are high-impact features planned for future development.

## 1. 📉 Smart Budgets & Limits
**"Stop overspending before it happens."**
- **Feature**: Users set monthly limits per category (e.g., $300 for Dining).
- **UI**: Detailed progress bars on the Dashboard (Green -> Yellow -> Red).
- **Action**: "Soft" alert notifications when user hits 80% and 100% of the limit.
- **Tech**: New `Budget` model linked to `User` and `Category`.

## 2. 🕵️ Subscription Detective
**"Find leaks in your wallet."**
- **Feature**: Detect recurring amounts on similar dates (e.g., $14.99 on the 10th of every month).
- **UI**: A "Recurring Expenses" view highlighting detected subscriptions.
- **Action**: Calculate annual cost (e.g., "$179/year") to prompt cancellation thoughts.

## 3. 🎯 Savings Goals
**"Give your money a purpose."**
- **Feature**: Create goals (e.g., "Emergency Fund", "Vacation").
- **UI**: Circular progress ring on Dashboard.
- **Integration**: When adding an expense, option to "Transfer to Savings" (virtual allocation).

## 4. 🧠 LLM-Powered Financial Insights
**"Your personal CFO."**
- **Feature**: Use an LLM (via API) to analyze monthly CSV data.
- **Output**: "You spent 15% more on Coffee this month. Cutting back by 3 cups a week would save you $60/month."
- **Tech**: Simple "Generate Advice" button sending anonymized summary data to an LLM provider.

## 5. 🗓️ Visual "No-Spend" Tracker
**"Gamify your habits."**
- **Feature**: A calendar view where days with $0 spending get a gold star or green check.
- **Metric**: "Current Streak: 5 days".
- **Psychology**: Encourages conscious non-spending.
