# E-Commerce Frontend

React 18 + Vite · Bootstrap 5 · React Router 6 · Axios · Context API

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with:
   ```
   VITE_API_BASE_URL=http://localhost:8080/api
   VITE_WS_BASE_URL=http://localhost:8080
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   ```

3. Ensure backend is running on port 8080

4. Run development server:
   ```bash
   npm run dev
   ```

## Build

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_WS_BASE_URL` - WebSocket base URL (without /api prefix)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for payments