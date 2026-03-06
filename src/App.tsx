// src/App.tsx

import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { TodayView } from './components/views/TodayView';
import { ExerciseDetailView } from './components/views/ExerciseDetailView';
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
      content = <div>History view coming soon...</div>;
      break;
    case 'exercises':
      content = <div>Exercises view coming soon...</div>;
      break;
    case 'templates':
      content = <div>Templates view coming soon...</div>;
      break;
    case 'settings':
      content = <div>Settings view coming soon...</div>;
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
