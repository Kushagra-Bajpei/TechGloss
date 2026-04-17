# Collaborative Technical Glossary Platform

A modern, full-stack web application designed for developers to contribute and moderate technical terminology.

## Features
- **Modern UI**: Glassmorphic design with smooth transitions.
- **Contribution System**: Users can submit new terms for review.
- **Collaborative Edits**: Users can suggest improvements to existing definitions.
- **Voting System**: Upvote or downvote definitions to highlight the best explanations.
- **Moderation Dashboard**: Moderators can approve or reject new terms and suggestions.
- **Role-based Access**: Separate interfaces for Users and Moderators.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+), FontAwesome.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (via Mongoose).
- **Security**: JWT Authentication, Bcrypt password hashing.

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed.
- [MongoDB](https://www.mongodb.com/) running locally or an Atlas connection string.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Check `.env` file and ensure `MONGO_URI` is correct.
4. **Seed the database** (Optional but recommended for testing):
   ```bash
   node seed.js
   ```
5. Start the server:
   ```bash
   npm run dev
   ```
   *The server will run on [http://localhost:5000](http://localhost:5000).*

### 3. Frontend Setup
1. Since this is a vanilla frontend, you can simply open `frontend/index.html` in your browser.
2. **Recommended**: Use a local server (like VS Code "Live Server" extension) to avoid CORS/Path issues.
3. Ensure the `API_URL` in `frontend/js/auth.js` matches your backend address.

---

## Test Credentials
If you ran the `seed.js` script, you can use these accounts:

- **Moderator Account**:
  - Email: `admin@example.com`
  - Password: `admin123`
- **User Account**:
  - Email: `jane@example.com`
  - Password: `user123`

---

## Project Structure
```text
/backend
  /middleware    - Auth and Role protection
  /models        - MongoDB Schemas (User, Term, Suggestion)
  /routes        - API Endpoints
  server.js      - Express App Entry
  seed.js        - Sample Data Script
/frontend
  /css           - Modern Styling
  /js            - Frontend logic (auth.js, main.js)
  index.html     - Main SPA Structure
```
