// src/components/views/SettingsView.tsx

import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { STORAGE_KEY } from '../../context/AppContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import styles from './SettingsView.module.css';

const APP_VERSION = '1.0.0';
const GITHUB_REPO = 'https://github.com/username/workout-tracker';

export function SettingsView() {
  const { settings, updateSettings, exportData, importData } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theme toggle
  const handleThemeToggle = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Units toggle
  const handleUnitsToggle = () => {
    const newUnits = settings.units === 'lbs' ? 'kg' : 'lbs';
    updateSettings({ units: newUnits });
  };

  // Timer defaults
  const handleCompoundRestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 30 && numValue <= 600) {
      updateSettings({ compoundRestSeconds: numValue });
    }
  };

  const handleAssistanceRestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 30 && numValue <= 300) {
      updateSettings({ assistanceRestSeconds: numValue });
    }
  };

  // Export data
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workout-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import data
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importData(content);
      if (success) {
        // Read the newly imported settings from localStorage to apply theme
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const newData = JSON.parse(stored);
            if (newData.settings?.theme) {
              document.documentElement.setAttribute('data-theme', newData.settings.theme);
            }
          }
        } catch {
          // Ignore errors
        }
        setImportStatus({ type: 'success', message: 'Data imported successfully!' });
      } else {
        setImportStatus({ type: 'error', message: 'Failed to import data. Invalid file format.' });
      }
      // Clear status after 3 seconds
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.onerror = () => {
      setImportStatus({ type: 'error', message: 'Failed to read file.' });
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear all data
  const handleClearData = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      {/* Appearance Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Theme</span>
            <span className={styles.settingDescription}>
              Current: {settings.theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={handleThemeToggle}
            aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {settings.theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Units</span>
            <span className={styles.settingDescription}>
              Current: {settings.units === 'lbs' ? 'Pounds (lbs)' : 'Kilograms (kg)'}
            </span>
          </div>
          <Button
            variant="secondary"
            onClick={handleUnitsToggle}
            aria-label={`Switch to ${settings.units === 'lbs' ? 'kg' : 'lbs'}`}
          >
            {settings.units === 'lbs' ? 'Switch to kg' : 'Switch to lbs'}
          </Button>
        </div>
      </section>

      {/* Timer Defaults Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Timer Defaults</h2>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Compound Exercise Rest</span>
            <span className={styles.settingDescription}>
              Default rest time after compound exercises
            </span>
          </div>
          <div className={styles.inputWithUnit}>
            <Input
              type="number"
              value={settings.compoundRestSeconds}
              onChange={handleCompoundRestChange}
              min={30}
              max={600}
              aria-label="Compound exercise rest time in seconds"
              className={styles.timerInput}
            />
            <span className={styles.unit}>seconds</span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingName}>Accessory Exercise Rest</span>
            <span className={styles.settingDescription}>
              Default rest time after accessory exercises
            </span>
          </div>
          <div className={styles.inputWithUnit}>
            <Input
              type="number"
              value={settings.assistanceRestSeconds}
              onChange={handleAssistanceRestChange}
              min={30}
              max={300}
              aria-label="Accessory exercise rest time in seconds"
              className={styles.timerInput}
            />
            <span className={styles.unit}>seconds</span>
          </div>
        </div>
      </section>

      {/* Data Management Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data Management</h2>

        <div className={styles.dataButtons}>
          <Button
            variant="secondary"
            onClick={handleExport}
            className={styles.dataButton}
          >
            Export Data
          </Button>

          <Button
            variant="secondary"
            onClick={handleImportClick}
            className={styles.dataButton}
          >
            Import Data
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className={styles.hiddenInput}
            aria-hidden="true"
          />

          {importStatus && (
            <div
              className={`${styles.importStatus} ${styles[importStatus.type]}`}
              role="alert"
            >
              {importStatus.message}
            </div>
          )}
        </div>

        <div className={styles.dangerZone}>
          <h3 className={styles.dangerTitle}>Danger Zone</h3>

          {showClearConfirm ? (
            <div className={styles.confirmClear}>
              <p className={styles.confirmText}>
                Are you sure? This will delete all your workouts, templates, and exercises. This action cannot be undone.
              </p>
              <div className={styles.confirmButtons}>
                <Button
                  variant="ghost"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleClearData}
                  className={styles.dangerButton}
                >
                  Yes, Clear All Data
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setShowClearConfirm(true)}
              className={styles.clearButton}
            >
              Clear All Data
            </Button>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>About</h2>

        <div className={styles.aboutContent}>
          <div className={styles.aboutRow}>
            <span className={styles.aboutLabel}>App Name</span>
            <span className={styles.aboutValue}>Compound First</span>
          </div>
          <div className={styles.aboutRow}>
            <span className={styles.aboutLabel}>Version</span>
            <span className={styles.aboutValue}>{APP_VERSION}</span>
          </div>
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.githubLink}
          >
            View on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
