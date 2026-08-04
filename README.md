# Touchpoint Widget

A Vue 3 widget project bundled for a Zoho extension workflow.

## Features

- Vue 3 application scaffold
- Vite-based frontend build
- ZET packaging step integrated into the build command
- ESLint and Prettier configuration for clean code quality

## Project structure

- `src/` — Vue source files
- `app/` — built widget output used by the extension package
- `dist/` — output folder for the packaged ZET result
- `server/` — local server entry point
- `eslint.config.js` — ESLint configuration
- `.prettierrc.json` — Prettier configuration

## Getting started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Start the local development server:

   ```sh
   npm run dev
   ```

3. Build the widget and package it with ZET:

   ```sh
   npm run build
   ```

## Available scripts

```sh
npm run dev
npm run build
npm run preview
npm run start
npm run lint
npm run format
npm run format:check
```

## Code quality

This project uses:

- ESLint for linting
- Prettier for formatting

Typical commands:

```sh
npm run lint
npm run format
npm run format:check
```

## Notes

The production build runs the Vite build first and then executes the ZET packaging command so the extension can be packed directly from the same workflow.
