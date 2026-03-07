// src/App.tsx

import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import {
  TodayView,
  HistoryView,
  ExercisesView,
  TemplatesView,
  SettingsView,
  ExerciseDetailView,
} from './components/views';
import './App.css';

function AppContent() {
  const { currentView, selectedExercise, clearExerciseDetail } = useApp();

  // If we have a selected exercise, show the detail view
  if (selectedExercise) {
    return (
      <Layout>
        <ExerciseDetailView
          exerciseId={selectedExercise.exerciseId}
          exerciseName={selectedExercise.exerciseName}
          onBack={clearExerciseDetail}
        />
      </Layout>
    );
  }

  let content;
  switch (currentView) {
    case 'today':
      content = <TodayView />;
      break;
    case 'history':
      content = <HistoryView />;
      break;
    case 'exercises':
      content = <ExercisesView />;
      break;
    case 'templates':
      content = <TemplatesView />;
      break;
    case 'settings':
      content = <SettingsView />;
      break;
    default:
      content = <TodayView />;
  }

  return <Layout>{content}</Layout>;
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
