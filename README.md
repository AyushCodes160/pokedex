# Pokédex Project Documentation

## 1. Introduction
This project is a full-featured Pokédex web application that displays information for all Pokémon from Generation 1 to the current generation. It includes:
- Pokémon list, search, and filter
- Detailed stats, types, evolutions
- 2D and 3D animated models for each Pokémon

## 2. Tech Stack
- **Backend:** Node.js (Express)
- **Database:** SQLite with Prisma ORM
- **Authentication:** JWT, bcryptjs
- **Email Service:** Nodemailer (Ethereal for testing)
- **Frontend:** HTML, CSS, JavaScript
- **3D Rendering:** three.js
- **Data Source:** PokéAPI

## 3. Architecture
- **Folder Structure:**
  - `/backend`: Node.js server
  - `/public`: Frontend files
  - `/models`: 2D/3D assets or links
- **Data Flow:**
  - Backend fetches Pokémon data from PokéAPI
  - Serves data and model assets to frontend
  - Frontend displays list, details, and renders models
- **Model Integration:**
  - 2D: Use sprites/GIFs from Pokémon Showdown or PokéAPI
  - 3D: Use glTF/OBJ models, rendered with three.js

## 4. Setup Instructions
1. Install dependencies:
   ```sh
   npm install
   ```
   ```
2. Initialize Database:
   ```sh
   npx prisma generate
   npx prisma db push
   ```
3. Run backend server:
   ```sh
   node index.js
   ```
   *Note: Check console for Ethereal Email credentials/URL.*
3. Open `public/index.html` in browser
4. Add new models to `/models` and update frontend logic if needed

## 5. Key Code Walkthroughs
- **API Endpoints:**
  - `/api/pokemon/:id` fetches data for a specific Pokémon
- **Frontend Rendering:**
  - Uses JavaScript to fetch and display Pokémon
  - Integrates three.js for 3D models
- **3D Model Loading:**
  - Use three.js loaders for glTF/OBJ files

## 6. Deployment
- Local: Run server and open frontend
- Cloud: Deploy on Vercel, Heroku, or similar

## 7. Study Resources
- [MDN REST API Guide](https://developer.mozilla.org/en-US/docs/Glossary/REST)
- [Node.js Docs](https://nodejs.org/en/docs/)
- [Express Docs](https://expressjs.com/)
- [JavaScript Info](https://javascript.info/)
- [MDN Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [three.js Fundamentals](https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene)
- [PokéAPI Docs](https://pokeapi.co/docs/v2)
- [MDN Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises)
- [MDN HTML](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [MDN CSS](https://developer.mozilla.org/en-US/docs/Web/CSS)

## 8. Interview Topics & Questions
- REST API design and usage
- Node.js/Express server setup
- Asynchronous data fetching in JavaScript
- Frontend rendering and DOM manipulation
- three.js basics and 3D model integration
- Project structure and scalability
- Optimizing API calls and asset loading

### Sample Interview Questions
- How does your backend fetch and serve Pokémon data?
- How do you handle asynchronous data fetching in JS?
- How do you render and animate 3D models in the browser?
- How do you structure your project for scalability?
- How do you optimize API calls and asset loading?

---

This documentation covers the project setup, technologies used, architecture, study resources, and interview preparation. Update this file as you build your Pokédex for future reference and learning.