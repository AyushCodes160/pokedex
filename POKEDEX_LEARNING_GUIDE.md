# Pokédex Arena: Learning & Interview Guide

This document is designed to help you understand the specific technologies, architectural decisions, and concepts used in the **Pokemon Arena** project. Use this guide to prepare for technical interviews or to deepen your understanding of the stack.

---

## 1. Technologies Used

### Frontend
-   **React (v18):** UI library for building component-based interfaces.
-   **Vite:** Next-generation frontend tooling for fast development and optimized builds. (Configured for port **8080**).
-   **TypeScript:** Adds static typing to JavaScript for improved safety.
-   **Tailwind CSS:** Utility-first CSS framework for rapid styling.
-   **Shadcn UI:** Reusable components built with Radix UI and Tailwind.
-   **Framer Motion:** Powering the **3D Battle Arena** perspective and smooth UI transitions.
-   **Recharts:** Visualizing Pokemon stats with composable charts.

### Backend
-   **Node.js & Express:** REST API server (Running on port **3000**).
-   **Prisma ORM:** Type-safe database access for MongoDB.
-   **MongoDB:** NoSQL database for Users, Teams, and Battle Results.
-   **JWT & bcryptjs:** Secure stateless authentication and password hashing.

---

## 2. Key Concepts & Architecture

### 🔄 The MERN Stack (with Prisma)
We use **Prisma** as the data layer because it provides auto-generated types that catch errors during development. 

### ⚔️ Apex Arena Mechanics
The Battle Arena implementation uses advanced techniques:
-   **3D Perspective**: Built using CSS `perspective` and `transform-style: preserve-3d`, with Framer Motion handling the "floating" feeling of the combatants.
-   **Turn-Based Logic**: Uses a speed-based sequence where the faster Pokemon attacks first. The logic is encapsulated in an `async` sequence to ensure animations play out chronologically.
-   **Damage Calculation**: Implements the official Pokemon damage formula, including Type Effectiveness, STAB (Same-Type Attack Bonus), and Critical Hits.

### 🌗 Dynamic Theming
-   **Poke Ball / Ultra Ball Toggle**: A custom theme provider that switches between Dark and Light modes.
-   **Implementation**: Uses `document.documentElement.classList` to toggle the `.dark` class, which Tailwind uses to apply different color variables. The icons themselves are custom SVG components that rotate and scale on toggle.

### 🔐 Authentication Flow
1.  **JWT Strategy**: Tokens are stored in `localStorage` and sent in the `Authorization` header for protected actions like saving a team.
2.  **Auth Guard**: The `AppLayout` component re-verifies auth state on every route change.

---

## 3. Study Resources

-   **React Hooks**: [React Official Docs - Hooks](https://react.dev/reference/react)
-   **Prisma with MongoDB**: [Prisma Mongo Guide](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
-   **Framer Motion**: [Animation Guides](https://www.framer.com/motion/)
-   **Tailwind CSS**: [Docs](https://tailwindcss.com/docs)

---

## 4. Common Interview Questions

### Q: Why use a 3D perspective for a 2D sprite game?
**A:** "It creates a more immersive 'Arena' feel without the overhead of a full 3D engine like Three.js. By using CSS 3D transforms and Framer Motion, we achieve a premium look that stays lightweight and performant."

### Q: How did you solve the battle 'hang' bug?
**A:** "I refactored the turn logic to handle speed-based move ordering within a single `executeMove` transaction. I used a `try...finally` block to ensure the 'animating' state is always reset, preventing the UI from locking up if something fails."

---

## 5. Deployment & DevOps

### 🛑 Preventing Render Spin-down
Render's free tier sleeps after 15 minutes. We use a **Self-Ping Mechanism** in `index.js` to keep the service awake by hitting the `/api/ping` endpoint every 14 minutes.
