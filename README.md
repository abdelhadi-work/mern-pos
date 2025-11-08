# MERN POS

Modern Point of Sale platform built with the MERN stack (MongoDB, Express, React, Node.js) that powers electronics retail workflows. The project is organised as a monorepo with dedicated `frontend` and `backend` directories.

## Features

- 🔐 Role-based authentication and login screen with eye-catching Matrix rain background
- 📊 Dashboard, reports, and settings pages for store operations
- 🛒 Product, inventory, and order management flows
- ⚙️ RESTful APIs using Express and MongoDB models
- 🎨 Component-driven React frontend with custom hooks and global styling

> The repo is actively evolving—some modules are still in progress, so expect additional endpoints and UI sections to land soon.

## Project Structure

```
mern-pos/
├── backend/        # Express server, controllers, routes, MongoDB models
├── frontend/       # React app (Vite) with pages, hooks, styles, and API helpers
└── README.md       # Project documentation (this file)
```

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance (local or remote)

## Getting Started

Clone the repository and install dependencies for both workspaces:

```bash
git clone https://github.com/<your-account>/mern-pos.git
cd mern-pos

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create `.env` files in the backend and frontend directories based on the provided samples. Common keys include:

**`backend/.env`**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mern_pos
JWT_SECRET=change_me
```

**`frontend/.env`**
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Running the App Locally

Backend (Express API):
```bash
cd backend
npm run dev
```

Frontend (React + Vite):
```bash
cd frontend
npm run dev
```

By default the Vite dev server listens on port `5173` (or the next available port) and proxies API calls to the backend.

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| backend  | `npm run dev` | Start Express server with nodemon |
| backend  | `npm run lint` | Run backend linters (if configured) |
| frontend | `npm run dev` | Launch Vite dev server |
| frontend | `npm run build` | Create production React build |
| frontend | `npm run lint` | Run frontend ESLint |

## Testing

Testing utilities are being integrated. To contribute, add unit/integration tests under the respective `backend/tests` or `frontend/tests` directories and wire them into the npm scripts.

## Coding Standards

- Follow existing ESLint/Prettier configurations in both workspaces.
- Keep commits focused and descriptive.
- Prefer TypeScript-ready patterns even in JS files (clear types, pure functions, reusable hooks).

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

Please keep PRs small and reference related issues when available. If you plan a large feature, open a discussion first.

## Deployment

Deployment automation is pending. Suggested workflow:

1. Backend: deploy to a Node-friendly environment (Heroku, Render, Railway, etc.) with MongoDB Atlas.
2. Frontend: host the built assets via Vercel, Netlify, or any static host and point it to the deployed API base URL.

## License

Specify your chosen license here (e.g., MIT). If none applies yet, remove this section once a license is decided.

---

Need help or have questions? Open an issue or start a discussion in the repo. Contributions are welcome! 🚀
