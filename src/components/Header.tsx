// src/components/Header.tsx

import { Button } from './common/Button';
import { useApp } from '../context/AppContext';
import styles from './Header.module.css';

const navItems = [
  { id: 'today', label: 'Today' },
  { id: 'history', label: 'History' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'templates', label: 'Templates' },
  { id: 'settings', label: 'Settings' },
];

export function Header() {
  const { currentView, setCurrentView, settings, updateSettings } = useApp();

  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <span className={styles.logoMain}>COMPOUND<span className={styles.logoAccent}>//</span>FIRST</span>
          <span className={styles.logoSub}>Workout Tracker</span>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView(item.id)}
              className={currentView === item.id ? styles.navActive : ''}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className={styles.themeToggle}
          aria-label="Toggle theme"
        >
          {settings.theme === 'dark' ? '\u2600' : '\u263E'}
        </Button>
      </div>
    </header>
  );
}
