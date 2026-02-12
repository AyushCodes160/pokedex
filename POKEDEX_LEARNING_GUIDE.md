# Pokédex Arena: Learning & Interview Guide

This document is designed to help you understand the specific technologies, architectural decisions, and concepts used in the **Pokemon Arena** project. Use this guide to prepare for technical interviews or to deepen your understanding of the stack.

---

## 1. Technologies Used

### Frontend
-   **React (v18):** UI library for building component-based interfaces.
-   **Vite:** Next-generation frontend tooling for fast development and optimized builds.
-   **TypeScript:** Adds static typing to JavaScript, improving code quality and developer experience.
-   **Tailwind CSS:** Utility-first CSS framework for rapid, responsive styling.
-   **Shadcn UI:** Reusable components built with Radix UI and Tailwind CSS.
-   **Framer Motion:** Library for declarative, production-ready animations.
-   **Recharts:** Composable charting library for visualizing stats.

### Backend
-   **Node.js & Express:** Runtime and framework for the REST API server.
-   **Prisma ORM:** Next-generation ORM for type-safe database access.
-   **MongoDB:** NoSQL database used to store Users, Teams, and Battle History.
-   **JWT (JSON Web Tokens):** Standard for stateless authentication.
-   **bcryptjs:** Library for hashing passwords securely.

---

## 2. Key Concepts & Architecture

### 🔄 The MERN Stack (with Prisma)
This project uses a variation of the MERN stack. Instead of using Mongoose directly, we use **Prisma** to interact with **MongoDB**.
-   **Why Prisma?** It provides auto-generated type definitions (`.d.ts`), making database queries type-safe. If you change your schema, TypeScript warns you about breaking changes in your code instantly.

### 🔐 Authentication Flow
1.  **Sign Up**: User provides credentials. Password is hashed with `bcrypt` (salt + hash) before saving to the DB. NEVER save plain-text passwords.
2.  **Sign In**: User provides credentials. Server finds the user, compares the basic password with the hashed one using `bcrypt.compare()`.
3.  **Token Generation**: If valid, server generates a **JWT** signed with a `SECRET_KEY`. This token is sent to the client.
4.  **Client Storage**: The React app stores this token in `localStorage`.
5.  **Protected Routes**: When the user accesses `/team-builder`, the app checks for the token. If missing, it redirects to `/auth`.
6.  **Authenticated Requests**: API requests (like "Save Team") include the token in headers. The backend verifies the signature before processing.

### 🎨 Styling & Theming
-   **Tailwind Config**: We customized `tailwind.config.ts` to include specific fonts (`font-pixel`, `font-display`, `font-pokemon`) and colors (`pokemon-yellow`, `pokemon-blue`) to match the brand.
-   **Global CSS**: `index.css` handles font imports (from CDNs) and special text effects (like the stroke on the "Pokemon Arena" logo).

### 🚀 Deployment Strategy
-   **Hybrid Serving**: In development, we run two servers (Vite for HMR, Express for API). In production (Render), we build the React app to static files (`dist/`) and tell Express to serve those static files along with the API routes.
-   **Build Process**: `npm run build` compiles TypeScript/React into optimized HTML/CSS/JS. The `postinstall` script ensures `prisma generate` runs so the database client is ready on the cloud server.

---

## 3. Study Resources

-   **React Hooks**: [React Official Docs - Hooks](https://react.dev/reference/react)
-   **Prisma with MongoDB**: [Prisma Mongo Guide](https://www.prisma.io/docs/concepts/database-connectors/mongodb)
-   **JWT Auth**: [JWT.io Introduction](https://jwt.io/introduction)
-   **Tailwind CSS**: [Tailwind Docs](https://tailwindcss.com/docs)
-   **Vite**: [Why Vite?](https://vitejs.dev/guide/why.html)

---

## 4. Common Interview Questions

### Q: Why did you choose Prisma over Mongoose?
**A:** "I chose Prisma for its strong type safety and auto-completion features. It integrates perfectly with TypeScript, significantly reducing runtime errors compared to Mongoose's flexible but looser schema definition."

### Q: How do you handle Authentication state?
**A:** "I verify the JWT token presence in `localStorage` on app initialization. The `AppLayout` component listens for storage events to update the UI (showing 'Logout' vs 'Sign In') dynamiclly without needing a page refresh."

### Q: How does the application handle data persistence?
**A:** "All critical data (Users, Teams, History) is stored in MongoDB. The schema is defined in `schema.prisma`, which serves as the single source of truth for the data model."

### Q: How did you implement the custom fonts?
**A:** "I used Google Fonts and CDNFonts to import 'Orbitron' and 'Pocket Monk'. I configured Tailwind utilities to apply these fonts easily across components (`font-display`, `font-pokemon`), keeping the design consistent and thematic."

---

## 5. Deployment & DevOps

### 🛑 Preventing Render Spin-down
Render's free tier spins down web services after 15 minutes of inactivity, causing the next request to take 50+ seconds to load.

**Solution:** Self-Ping Mechanism
We implemented a self-ping strategy in `index.js`.
1.  **Detection**: The app checks for the `RENDER_EXTERNAL_URL` environment variable (automatically set by Render).
2.  **Interval**: If present, it sets up a `setInterval` to ping its own `/api/ping` endpoint every 14 minutes.
3.  **Result**: This keeps the service "active" preventing the sleep cycle.

**Alternative**: You can also use external monitoring services like `cron-job.org` to hit the URL, but the internal solution is self-contained.
