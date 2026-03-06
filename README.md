# Workout Tracker

[![Deploy to GitHub Pages](https://github.com/williamkrause/workout/actions/workflows/deploy.yml/badge.svg)](https://github.com/williamkrause/workout/actions/workflows/deploy.yml)

A modern workout tracking application built with React, TypeScript, and Vite. Track your exercises, create workout templates, and monitor your progress over time.

## Features

- **Workout Logging**: Track sets, reps, and weights for each exercise
- **Exercise Library**: Manage your personal exercise database with muscle group categorization
- **Workout Templates**: Create reusable templates for your regular routines
- **Progress Tracking**: View your workout history and track improvements
- **Customizable Settings**: Configure units (lbs/kg), rest timers, and themes
- **Local Storage**: All data is stored locally in your browser
- **Responsive Design**: Works great on desktop and mobile devices

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Chart.js** - Progress visualization
- **date-fns** - Date manipulation
- **CSS Variables** - Theming support

## Setup Instructions

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/williamkrause/workout.git
   cd workout
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run deploy` - Build and deploy to GitHub Pages

## Deployment

This project is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. The deployment workflow:

1. Triggers on push to `main`
2. Installs dependencies with `npm install`
3. Builds the project with `npm run build`
4. Deploys the `dist` folder to GitHub Pages

### Manual Deployment

To manually deploy to GitHub Pages:

```bash
npm run deploy
```

## Project Structure

```
workout/
  src/
    components/       # React components
      common/         # Reusable UI components
      session/        # Workout session components
      views/          # Main view components
    context/          # React context for state management
    data/             # Seed data and default templates
    hooks/            # Custom React hooks
    types/            # TypeScript type definitions
    utils/            # Utility functions
    App.tsx           # Main application component
    main.tsx          # Application entry point
  public/             # Static assets
  .github/
    workflows/
      deploy.yml      # GitHub Actions deployment workflow
```

## License

MIT
