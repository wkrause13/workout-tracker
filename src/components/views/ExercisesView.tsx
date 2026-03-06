// src/components/views/ExercisesView.tsx

import { useState, useId, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { Exercise } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import styles from './ExercisesView.module.css';

type EditingExercise = {
  id?: string;
  name: string;
  category: 'compound' | 'accessory';
  muscleGroups: string[];
  variationOf?: string;
};

const emptyExercise: EditingExercise = {
  name: '',
  category: 'compound',
  muscleGroups: [],
  variationOf: undefined,
};

type CategoryFilter = 'all' | 'compound' | 'accessory';

export function ExercisesView() {
  const { exercises, addExercise, updateExercise, deleteExercise, viewExerciseDetail } = useApp();
  const [editingExercise, setEditingExercise] = useState<EditingExercise | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [muscleGroupsInput, setMuscleGroupsInput] = useState('');

  const formId = useId();
  const nameInputId = `${formId}-name`;
  const categoryInputId = `${formId}-category`;
  const muscleGroupsInputId = `${formId}-muscleGroups`;
  const variationInputId = `${formId}-variation`;
  const searchInputId = `${formId}-search`;

  // Filter exercises based on search and category
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscleGroups.some(mg => mg.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || exercise.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchQuery, categoryFilter]);

  // Group exercises by category
  const exercisesByCategory = useMemo(() => {
    const compound = filteredExercises.filter(e => e.category === 'compound');
    const accessory = filteredExercises.filter(e => e.category === 'accessory');
    return { compound, accessory };
  }, [filteredExercises]);

  const handleCreateNew = () => {
    setEditingExercise({ ...emptyExercise });
    setMuscleGroupsInput('');
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise({
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
      muscleGroups: exercise.muscleGroups,
      variationOf: exercise.variationOf,
    });
    setMuscleGroupsInput(exercise.muscleGroups.join(', '));
  };

  const handleCancel = () => {
    setEditingExercise(null);
    setMuscleGroupsInput('');
  };

  const handleSave = () => {
    if (!editingExercise) return;
    if (!editingExercise.name.trim()) return;

    // Parse muscle groups from comma-separated input
    const muscleGroups = muscleGroupsInput
      .split(',')
      .map(mg => mg.trim())
      .filter(mg => mg.length > 0);

    if (editingExercise.id) {
      // Update existing exercise
      const existingExercise = exercises.find(e => e.id === editingExercise.id);
      if (existingExercise) {
        updateExercise({
          ...existingExercise,
          name: editingExercise.name.trim(),
          category: editingExercise.category,
          muscleGroups,
          variationOf: editingExercise.variationOf?.trim() || undefined,
        });
      }
    } else {
      // Create new exercise
      addExercise({
        name: editingExercise.name.trim(),
        category: editingExercise.category,
        muscleGroups,
        variationOf: editingExercise.variationOf?.trim() || undefined,
      });
    }

    setEditingExercise(null);
    setMuscleGroupsInput('');
  };

  const handleDelete = (exerciseId: string) => {
    deleteExercise(exerciseId);
    setDeleteConfirmId(null);
  };

  const handleViewProgress = (exercise: Exercise) => {
    viewExerciseDetail({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
    });
  };

  const handleFieldChange = (field: keyof EditingExercise, value: string) => {
    if (!editingExercise) return;
    setEditingExercise({
      ...editingExercise,
      [field]: value,
    });
  };

  // Editing mode
  if (editingExercise) {
    const isNew = !editingExercise.id;

    return (
      <div className={styles.container}>
        <div className={styles.editor}>
          <h2 className={styles.editorTitle}>
            {isNew ? 'New Exercise' : 'Edit Exercise'}
          </h2>

          <div className={styles.form}>
            <Input
              id={nameInputId}
              label="Exercise Name"
              value={editingExercise.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="e.g., Barbell Bench Press"
              className={styles.formField}
              required
            />

            <div className={styles.formField}>
              <label className={styles.label} htmlFor={categoryInputId}>
                Category
              </label>
              <select
                id={categoryInputId}
                className={styles.selectField}
                value={editingExercise.category}
                onChange={(e) => handleFieldChange('category', e.target.value)}
              >
                <option value="compound">Compound</option>
                <option value="accessory">Accessory</option>
              </select>
            </div>

            <div className={styles.formField}>
              <label className={styles.label} htmlFor={muscleGroupsInputId}>
                Muscle Groups
              </label>
              <input
                id={muscleGroupsInputId}
                type="text"
                className={styles.textField}
                value={muscleGroupsInput}
                onChange={(e) => setMuscleGroupsInput(e.target.value)}
                placeholder="e.g., Chest, Shoulders, Triceps"
              />
              <span className={styles.fieldHint}>
                Separate multiple muscle groups with commas
              </span>
            </div>

            <div className={styles.formField}>
              <label className={styles.label} htmlFor={variationInputId}>
                Variation Of (optional)
              </label>
              <div className={styles.inputWithDropdown}>
                <input
                  id={variationInputId}
                  type="text"
                  className={styles.textField}
                  value={editingExercise.variationOf || ''}
                  onChange={(e) => handleFieldChange('variationOf', e.target.value)}
                  placeholder="Select or type an exercise name"
                  list="exercise-variations-list"
                />
                <datalist id="exercise-variations-list">
                  {exercises
                    .filter(e => e.id !== editingExercise.id)
                    .map(ex => (
                      <option key={ex.id} value={ex.name} />
                    ))}
                </datalist>
              </div>
              <span className={styles.fieldHint}>
                Link this exercise to a parent exercise if it&apos;s a variation
              </span>
            </div>
          </div>

          <div className={styles.editorActions}>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!editingExercise.name.trim()}
            >
              {isNew ? 'Create Exercise' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // List view mode
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Exercise Library</h2>
        <Button variant="primary" onClick={handleCreateNew}>
          + New Exercise
        </Button>
      </div>

      <div className={styles.filters}>
        <Input
          id={searchInputId}
          type="search"
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          aria-label="Search exercises"
        />

        <div className={styles.categoryFilter} role="group" aria-label="Filter by category">
          <button
            className={`${styles.filterButton} ${categoryFilter === 'all' ? styles.active : ''}`}
            onClick={() => setCategoryFilter('all')}
            type="button"
            aria-pressed={categoryFilter === 'all'}
          >
            All
          </button>
          <button
            className={`${styles.filterButton} ${categoryFilter === 'compound' ? styles.active : ''}`}
            onClick={() => setCategoryFilter('compound')}
            type="button"
            aria-pressed={categoryFilter === 'compound'}
          >
            Compound
          </button>
          <button
            className={`${styles.filterButton} ${categoryFilter === 'accessory' ? styles.active : ''}`}
            onClick={() => setCategoryFilter('accessory')}
            type="button"
            aria-pressed={categoryFilter === 'accessory'}
          >
            Accessory
          </button>
        </div>
      </div>

      {filteredExercises.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>
            {searchQuery || categoryFilter !== 'all'
              ? 'No exercises match your search'
              : 'No exercises yet'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <Button variant="secondary" onClick={handleCreateNew}>
              Add Your First Exercise
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.exerciseGroups}>
          {categoryFilter !== 'accessory' && exercisesByCategory.compound.length > 0 && (
            <div className={styles.exerciseGroup}>
              <h3 className={styles.groupTitle}>
                Compound
                <span className={styles.groupCount}>
                  {exercisesByCategory.compound.length}
                </span>
              </h3>
              <div className={styles.exerciseList}>
                {exercisesByCategory.compound.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteConfirmId(id)}
                    isDeleting={deleteConfirmId === exercise.id}
                    onConfirmDelete={handleDelete}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                    onViewProgress={handleViewProgress}
                  />
                ))}
              </div>
            </div>
          )}

          {categoryFilter !== 'compound' && exercisesByCategory.accessory.length > 0 && (
            <div className={styles.exerciseGroup}>
              <h3 className={styles.groupTitle}>
                Accessory
                <span className={styles.groupCount}>
                  {exercisesByCategory.accessory.length}
                </span>
              </h3>
              <div className={styles.exerciseList}>
                {exercisesByCategory.accessory.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onEdit={handleEdit}
                    onDelete={(id) => setDeleteConfirmId(id)}
                    isDeleting={deleteConfirmId === exercise.id}
                    onConfirmDelete={handleDelete}
                    onCancelDelete={() => setDeleteConfirmId(null)}
                    onViewProgress={handleViewProgress}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Exercise Card Component
interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onViewProgress?: (exercise: Exercise) => void;
}

function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
  onViewProgress,
}: ExerciseCardProps) {
  return (
    <div className={styles.exerciseCard}>
      {isDeleting ? (
        <div className={styles.deleteConfirm}>
          <p className={styles.deleteConfirmText}>
            Delete &quot;{exercise.name}&quot;?
          </p>
          <p className={styles.deleteConfirmHint}>This action cannot be undone.</p>
          <div className={styles.deleteConfirmActions}>
            <Button variant="ghost" size="sm" onClick={onCancelDelete}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onConfirmDelete(exercise.id)}
              className={styles.deleteConfirmButton}
            >
              Delete
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <button
                className={styles.exerciseNameButton}
                onClick={() => onViewProgress(exercise)}
                aria-label={`View progress for ${exercise.name}`}
              >
                <h4 className={styles.exerciseName}>{exercise.name}</h4>
              </button>
              <span className={`${styles.categoryBadge} ${styles[exercise.category]}`}>
                {exercise.category}
              </span>
            </div>

            <div className={styles.muscleGroups}>
              {exercise.muscleGroups.map((mg, i) => (
                <span key={i} className={styles.muscleTag}>
                  {mg}
                </span>
              ))}
            </div>

            {exercise.variationOf && (
              <p className={styles.variationInfo}>
                Variation of: <span className={styles.variationName}>{exercise.variationOf}</span>
              </p>
            )}
          </div>

          <div className={styles.cardActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(exercise)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(exercise.id)}
              aria-label={`Delete ${exercise.name}`}
            >
              Delete
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
