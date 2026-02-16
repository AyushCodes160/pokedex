# Pokemon Arena

A feature-rich, modern Pokedex application with Team Builder and Battle Arena capabilities, built with the MERN stack (MongoDB, Express, React, Node.js) + Prisma.

## 🚀 Features

-   **Pokedex**: Browse detailed information about Pokemon species, stats, types, and moves.
-   **Team Builder**: Create, manage, and save your own custom Pokemon teams.
-   **Battle Arena**: *(Coming Soon)* Simulate battles with your teams against AI opponents.
-   **Authentication**: Secure user accounts with Sign Up, Sign In, and Logout functionality (JWT + bcrypt).
-   **Responsive Design**: Fully responsive UI for Desktop and Mobile.
-   **Custom Theming**: Unique "Pokemon Arena" branding with custom fonts ("Pocket Monk") and dynamic UI elements.

## 🛠️ Tech Stack

-   **Frontend**: React, Vite, TypeScript, Tailwind CSS, Shadcn UI, Framer Motion, Recharts.
-   **Backend**: Node.js, Express.js.
-   **Database**: MongoDB (via Prisma ORM).
-   **Authentication**: JSON Web Tokens (JWT) & bcryptjs.
-   **Deployment**: configured for Render.

## 🏁 Getting Started

Follow these steps to set up the project locally.

### 1. Prerequisites
-   Node.js (v18+ recommended)
-   MongoDB Database (local or Atlas connection string)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd pokedex
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Connection string for your MongoDB database
DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/pokedex?retryWrites=true&w=majority"

# Secret key for JWT signing (can be any random string)
SECRET_KEY="your-super-secret-key-change-this"
```

### 4. Database Setup

Generate the Prisma client:

```bash
npx prisma generate
```

*(Optional) Push schema changes if modifying `schema.prisma`:*
```bash
npx prisma db push
```

### 5. Running the App

For **Local Development** (you need two terminals):

**Terminal 1 (Backend):**
```bash
npm run server
# Runs on http://localhost:3000
```

**Terminal 2 (Frontend):**
```bash
npm run dev
# Runs on http://localhost:5173 (proxies API calls to port 3000)
```

For **Production Test** (Simulating deployment):
```bash
npm run build
npm start
# Runs the built frontend via the Express server on http://localhost:3000
```

## 🚀 Deployment

The project is configured for seamless deployment on **Render**.

1.  **Build Command**: `npm install && npm run build`
2.  **Start Command**: `npm start`
3.  **Environment Variables**: set `DATABASE_URL` and `SECRET_KEY` in the Render dashboard.

## 📁 Project Structure

-   `src/`: React frontend source code.
-   `prisma/`: Database schema and migrations.
-   `index.js`: Express backend entry point.
-   `public/`: Static assets (fonts, images).
-   `dist/`: Production build output.
