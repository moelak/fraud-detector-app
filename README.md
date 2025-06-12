# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Fraud Detection App

This is a fraud detection application that uses Clerk for authentication and Supabase for data storage.

### Authentication Setup

The app uses Clerk for user authentication and integrates with Supabase's built-in `auth.users` table.

#### Required Setup Steps:

1. **Configure Clerk JWT Template**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com) → JWT Templates
   - Create a new template named `supabase`
   - Set the audience to `authenticated`
   - Add your Supabase project URL to the allowed list
   - Configure claims to include user metadata

2. **Supabase Configuration**:
   - The app automatically uses Supabase's built-in authentication
   - Users will appear in Supabase Dashboard → Authentication → Users
   - No custom users table is needed

3. **Environment Variables**:
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Features

- **Dashboard**: Overview of fraud detection metrics
- **Rule Management**: Create and manage fraud detection rules
- **Visualization**: Charts and analytics for fraud patterns
- **Monitoring**: Real-time system monitoring and alerts
- **Chargebacks**: Manage chargeback disputes
- **Reports**: Generate fraud detection reports
- **AI Chat Assistant**: Get help with fraud detection queries

### Development

```bash
npm install
npm run dev
```

### Authentication Flow

1. User signs up/logs in through Clerk
2. Clerk JWT token is automatically passed to Supabase
3. User appears in Supabase auth.users table
4. App can query Supabase data using RLS policies based on auth.uid()

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  extends: [
    // other configs...
    // Enable lint rules for React
    reactX.configs['recommended-typescript'],
    // Enable lint rules for React DOM
    reactDom.configs.recommended,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```