# Expense Tracker: Technical Architecture & Design Decisions

This document serves as a deep dive into the engineering choices, system architecture, and trade-offs made during the development of the Expense Tracker.

---

## 🏗️ System Architecture

### 1. Frontend: The "Fat Client" Approach
The client is a Single Page Application (SPA) built with **React 19** and **Vite**, designed to handle significant logic on the browser side to reduce server load.

*   **Core UI Library:** **Material UI (MUI)** v7. Using MUI allows us to leverage pre-built, accessible components (Inputs, Modals, Grids) while maintaining a custom aesthetic via the `ThemeProvider`.
*   **State Management:** React **Context API** (`AuthContext`, `ThemeContext`) manages global state.
*   **Visualization:** **D3.js** handles complex data mapping for charts, providing granular control over animations and interactivity that high-level wrappers often lack.
*   **Routing:** **React Router v7** handles client-side navigation and protected route guards.

### 2. Backend: The "Flexible Service" Layer
The server is a RESTful API built with **Node.js** and **Express**, focusing on stateless operations and heavy data processing (OCR).

*   **Database Layer:** **Knex.js** (Query Builder). We intentionally avoided full ORMs (like Sequelize) to maintain raw SQL control and performance.
*   **Multi-DB Strategy:**
    *   **Development:** Uses **SQLite** for zero-configuration setup (stored as a local file).
    *   **Production:** Designed to switch seamlessly to **PostgreSQL** via environment variables, thanks to Knex's agnostic schema definitions.

### 3. The 2-Tier Parsing Strategy
One of the most complex architectural components is the receipt parser (`server/utils/receiptParser.js`).

1.  **Tier 1 (Local):** `pdf-parse` attempts to extract raw text. This is virtually instant and free.
2.  **Tier 2 (Cloud):** If Tier 1 yields < 50 characters, the file is identified as an image-based scan. It is then piped to the **OCR.space API**.
3.  **Normalization:** Regardless of the source, a unification layer instantly converts various date/amount formats into standard ISO 8601 (`YYYY-MM-DD`) and float values.

---

## 📝 Architecture Decision Records (ADR)

### ADR-001: State Management (Context vs. Redux)
*   **Decision:** Use **React Context API**.
*   **Alternatives:** Redux Toolkit, Zustand, Recoil.
*   **Reasoning:**
    *   **Complexity:** The application state (User Session, Theme, Toast Notifications) is strictly global but infrequently updated. Redux introduces boilerplate (reducers/actions) suited for high-frequency, complex state transitions which are absent here.
    *   **Performance:** Avoiding Redux saves ~15KB (gzipped) from the initial bundle.
    *   **Maintainability:** Context leverages native React hooks, reducing the learning curve for new contributors.

### ADR-002: Styling Strategy (MUI vs. Tailwind vs. CSS Modules)
*   **Decision:** Use **Material UI (MUI) + Sx Prop**.
*   **Alternatives:** Tailwind CSS, Plain CSS Modules.
*   **Reasoning:**
    *   **Speed:** MUI provides accessible-by-default components (e.g., Ripple effects on buttons, proper ARIA attributes on inputs) out of the box.
    *   **Consistency:** The `sx` prop allows us to access theme tokens (colors, spacing) directly in components, ensuring strict adherence to the design system without managing massive CSS classes.
    *   **Dark Mode:** MUI's built-in `Palette` switching made implementing specific Dark Mode colors trivial.

### ADR-003: Database Abstraction (Knex.js vs. ORM)
*   **Decision:** Use **Knex.js** (Query Builder).
*   **Alternatives:** Sequelize, TypeORM, Prisma.
*   **Reasoning:**
    *   **Control:** Full ORMs often generate inefficient SQL for complex queries (like our Dashboard Analytics aggregations). Knex lets us write optimized SQL (e.g., `GROUP BY strftime`) while still protecting against Injection attacks.
    *   **Flexibility:** Knex migrations allow us to support both SQLite (for easy dev onboarding) and Postgres (for robust production) with a single codebase.

### ADR-004: Data Visualization (D3.js vs. Chart.js)
*   **Decision:** Use **D3.js** directly.
*   **Alternatives:** Chart.js, Recharts, Nivo.
*   **Reasoning:**
    *   **Customization:** The "Safe-to-Spend" gauge and specific interactive tooltip behaviors required custom geometry that is difficult to "hack" into pre-built chart libraries.
    *   **Animation:** D3's transition API allows for smooth entry animations (e.g., bars growing from bottom) that feel more premium than standard library transitions.

### ADR-005: Routing Library
*   **Decision:** Use **React Router**.
*   **Reasoning:**
    *   Industry standard for React SPAs.
    *   Robust support for `Outlet` layouts (used for the persistent Sidebar/Header) and protected route wrappers (redirecting unauthenticated users to Login).

### ADR-006: Build Tool (Vite vs. Create React App)
*   **Decision:** Use **Vite**.
*   **Reasoning:**
    *   **Dev Experience:** Instant HMR (Hot Module Replacement) vs. CRA's multi-second reloads.
    *   **Build Optimization:** Native Rollup support allows accurate code-splitting (splitting vendor chunks) which was crucial for performance optimization.
