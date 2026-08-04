# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Database Setup & Component Seeding

For teammates pulling this branch, the 40 marketplace components are stored inside MongoDB. To sync your local database with this dataset, follow these steps:

1. Clone the repository and install the dependencies:
   ```bash
   npm install
   ```

2. Seed your local database with the complete dataset of components:
   ```bash
   npm run seed:components
   ```

*(Note: Ensure your MongoDB local server instance is running on `mongodb://localhost:27017` as defined inside `server/.env` before executing the seeder script)*

