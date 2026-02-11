# Pokedex Arena

A feature-rich Pokedex application with Team Builder and Battle Arena capabilities.

## Features

- **Pokedex**: Detailed information about Pokemon species, stats, evolutions, and moves.
- **Team Builder**: Create and save custom Pokemon teams.
- **Battle Arena**: Simulate battles against wild Pokemon or AI opponents.
- **Authentication**: User accounts to save teams and battle history.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, Prisma (MongoDB)
- **Database**: MongoDB

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Set up environment variables in `.env`:
    ```
    DATABASE_URL="your-mongodb-connection-string"
    SECRET_KEY="your-secret-key"
    ```

3.  Run the development server (Backend + Frontend dev mode):
    ```bash
    # Open two terminals
    npm run server  # Starts backend on localhost:3000
    npm run dev     # Starts frontend dev server
    ```

    *Note: For production behavior, use `npm run build` and `npm start`.*

## Deployment

The project is configured for deployment on Vercel (Frontend/Serverless) and Render (Backend).

- `vercel.json` is included for Vercel configuration.
- `index.js` listens on `process.env.PORT` for Render compatibility.
