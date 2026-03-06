// src/components/Layout.tsx

import { useEffect, type ReactNode } from 'react';
import { Header } from './Header';
import { useApp } from '../context/AppContext';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { settings } = useApp();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <span>Data stored locally</span>
        <span className={styles.separator}>|</span>
        <span>Works offline</span>
      </footer>
    </div>
  );
}
