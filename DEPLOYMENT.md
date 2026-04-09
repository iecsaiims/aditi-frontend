# Frontend Deployment

## Vercel

- Import the frontend repository as its own Vercel project.
- Use the Vite framework preset.
- Keep the existing build command.

## Environment variables

- Local:
  - `VITE_API_URL=http://localhost:4000/api`
- Preview:
  - `VITE_API_URL=https://staging-backend.example.com/api`
- Production:
  - `VITE_API_URL=https://triage-api.example.com/api`

## Notes

- Do not point preview frontends at the production backend.
- The frontend should always read the backend base URL from `VITE_API_URL` in deployed environments.
