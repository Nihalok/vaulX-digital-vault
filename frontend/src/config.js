// In production (Vercel monorepo), VITE_API_URL is '' so API calls go to same domain.
// In local dev, set VITE_API_URL=http://localhost:5000 in frontend/.env
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';