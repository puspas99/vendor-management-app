# DevXcelerate App

A React 19 proof-of-concept implementing JWT authentication with refresh tokens, protected routes, and profile management. Built with Vite, React Router, Axios, Formik, and Context API.

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

```bash
npm install
npm run dev
```

By default the app expects an API available at `http://localhost:4000`. Update `.env` to match your backend configuration.

## Available Scripts

- `npm run dev` – start the development server
- `npm run build` – build for production
- `npm run preview` – preview the production build locally
- `npm run lint` – run ESLint
- `npm run prettier` – check formatting with Prettier
- `npm run prettier:fix` – format files using Prettier
- `npm run test` – execute unit tests once with Vitest
- `npm run test:watch` – run unit tests in watch mode

## Environment Variables

Create `.env` using the provided defaults:

```
VITE_API_BASE_URL=http://localhost:4000
VITE_JWT_SECRET=replace-with-development-secret
```

All Vite environment variables must start with `VITE_`. The app reads `VITE_API_BASE_URL` when configuring Axios.

## Project Structure

```
src/
  components/
  context/
  services/
  __tests__/
```

- **Context** – `AuthContext` manages authentication state and exposes helpers.
- **Services** – `apiService` configures Axios with interceptors; `authService` wraps auth endpoints.
- **Components** – Login, SignUp, Profile, Logout, and PrivateRoute.
- **Tests** – React Testing Library suites covering login, profile, and PrivateRoute behavior.

## Testing

```bash
npm run test
```

The Vitest setup file located at `src/setupTests.js` registers Testing Library matchers.

## Linting & Formatting

ESLint and Prettier are configured via `eslint.config.js` and `.prettierrc.cjs`. Run `npm run lint` and `npm run prettier` to validate code quality.

## Notes

- Authentication data persists in `localStorage` under the `devxcelerate.auth` key.
- Axios interceptors automatically refresh access tokens on `401` responses.
- Update `authService.js` endpoints if your backend uses different routes.

