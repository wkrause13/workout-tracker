// src/components/views/TemplatesView.tsx

import { useState, useId } from 'react';
import { useApp } from '../../context/AppContext';
import type { Template, TemplateExercise } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import styles from './TemplatesView.module.css';

type EditingTemplate = {
  id?: string;
  name: string;
  exercises: TemplateExercise[];
};

const emptyTemplateExercise: TemplateExercise = {
  exerciseId: '',
  exerciseName: '',
  targetSets: '',
  targetReps: '',
  restSeconds: undefined,
  priority: 'main',
  notes: '',
};

export function TemplatesView() {
  const { templates, exercises, addTemplate, updateTemplate, deleteTemplate } = useApp();
  const [editingTemplate, setEditingTemplate] = useState<EditingTemplate | null>(null);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const exerciseIdBase = useId();

  const handleCreateNew = () => {
    setEditingTemplate({
      name: '',
      exercises: [],
    });
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate({
      id: template.id,
      name: template.name,
      exercises: [...template.exercises],
    });
  };

  const handleCancel = () => {
    setEditingTemplate(null);
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name.trim()) return;

    // Filter out empty exercises
    const validExercises = editingTemplate.exercises.filter(
      e => e.exerciseName.trim() !== ''
    );

    if (editingTemplate.id) {
      // Update existing template
      const existingTemplate = templates.find(t => t.id === editingTemplate.id);
      if (existingTemplate) {
        updateTemplate({
          ...existingTemplate,
          name: editingTemplate.name.trim(),
          exercises: validExercises,
        });
      }
    } else {
      // Create new template
      addTemplate({
        name: editingTemplate.name.trim(),
        exercises: validExercises,
      });
    }

    setEditingTemplate(null);
  };

  const handleDelete = (templateId: string) => {
    deleteTemplate(templateId);
    setDeleteConfirmId(null);
    setExpandedTemplateId(null);
  };

  const handleAddExercise = () => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      exercises: [...editingTemplate.exercises, { ...emptyTemplateExercise }],
    });
  };

  const handleRemoveExercise = (index: number) => {
    if (!editingTemplate) return;
    const newExercises = editingTemplate.exercises.filter((_, i) => i !== index);
    setEditingTemplate({
      ...editingTemplate,
      exercises: newExercises,
    });
  };

  const handleExerciseChange = (index: number, field: keyof TemplateExercise, value: string | number | undefined) => {
    if (!editingTemplate) return;
    const newExercises = [...editingTemplate.exercises];
    newExercises[index] = {
      ...newExercises[index],
      [field]: value,
    };

    // If exerciseName is selected from dropdown, update exerciseId too
    if (field === 'exerciseName') {
      const selectedExercise = exercises.find(e => e.name === value);
      newExercises[index].exerciseId = selectedExercise?.id || '';
    }

    setEditingTemplate({
      ...editingTemplate,
      exercises: newExercises,
    });
  };

  const handleTemplateNameChange = (name: string) => {
    if (!editingTemplate) return;
    setEditingTemplate({
      ...editingTemplate,
      name,
    });
  };

  // Editing mode
  if (editingTemplate) {
    return (
      <div className={styles.container}>
        <div className={styles.editor}>
          <h2 className={styles.editorTitle}>
            {editingTemplate.id ? 'Edit Template' : 'New Template'}
          </h2>

          <Input
            label="Template Name"
            value={editingTemplate.name}
            onChange={(e) => handleTemplateNameChange(e.target.value)}
            placeholder="e.g., Push Day, Pull Day..."
            className={styles.nameInput}
          />

          <div className={styles.exercisesSection}>
            <h3 className={styles.sectionTitle}>Exercises</h3>

            {editingTemplate.exercises.length === 0 ? (
              <p className={styles.noExercises}>No exercises added yet</p>
            ) : (
              <div className={styles.exerciseList}>
                {editingTemplate.exercises.map((exercise, index) => (
                  <div key={index} className={styles.exerciseCard}>
                    <div className={styles.exerciseHeader}>
                      <span className={styles.exerciseNumber}>{index + 1}</span>
                      <button
                        className={styles.removeButton}
                        onClick={() => handleRemoveExercise(index)}
                        type="button"
                        aria-label={`Remove ${exercise.exerciseName || `exercise ${index + 1}`}`}
                      >
                        Remove
                      </button>
                    </div>

                    <div className={styles.exerciseFields}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor={exerciseIdBase + '-' + index + '-exerciseName'}>Exercise Name</label>
                        <div className={styles.inputWithDropdown}>
                          <input
                            type="text"
                            id={exerciseIdBase + '-' + index + '-exerciseName'}
                            className={styles.textField}
                            value={exercise.exerciseName}
                            onChange={(e) => handleExerciseChange(index, 'exerciseName', e.target.value)}
                            placeholder="Type or select..."
                            list={`exercise-list-${index}`}
                          />
                          <datalist id={`exercise-list-${index}`}>
                            {exercises.map(ex => (
                              <option key={ex.id} value={ex.name} />
                            ))}
                          </datalist>
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor={exerciseIdBase + '-' + index + '-targetSets'}>Target Sets</label>
                          <input
                            type="text"
                            id={exerciseIdBase + '-' + index + '-targetSets'}
                            className={styles.textField}
                            value={exercise.targetSets || ''}
                            onChange={(e) => handleExerciseChange(index, 'targetSets', e.target.value)}
                            placeholder="e.g., 4-5"
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor={exerciseIdBase + '-' + index + '-targetReps'}>Target Reps</label>
                          <input
                            type="text"
                            id={exerciseIdBase + '-' + index + '-targetReps'}
                            className={styles.textField}
                            value={exercise.targetReps || ''}
                            onChange={(e) => handleExerciseChange(index, 'targetReps', e.target.value)}
                            placeholder="e.g., 3-6"
                          />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.fieldLabel} htmlFor={exerciseIdBase + '-' + index + '-restSeconds'}>Rest (sec)</label>
                          <input
                            type="number"
                            id={exerciseIdBase + '-' + index + '-restSeconds'}
                            className={styles.textField}
                            value={exercise.restSeconds || ''}
                            onChange={(e) => handleExerciseChange(index, 'restSeconds', e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="180"
                          />
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor={exerciseIdBase + '-' + index + '-priority'}>Priority</label>
                        <select
                          id={exerciseIdBase + '-' + index + '-priority'}
                          className={styles.selectField}
                          value={exercise.priority}
                          onChange={(e) => handleExerciseChange(index, 'priority', e.target.value as 'main' | 'support' | 'optional')}
                        >
                          <option value="main">Main</option>
                          <option value="support">Support</option>
                          <option value="optional">Optional</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel} htmlFor={exerciseIdBase + '-' + index + '-notes'}>Notes (optional)</label>
                        <textarea
                          id={exerciseIdBase + '-' + index + '-notes'}
                          className={styles.textArea}
                          value={exercise.notes || ''}
                          onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                          placeholder="Any notes..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="secondary"
              onClick={handleAddExercise}
              className={styles.addExerciseButton}
            >
              + Add Exercise
            </Button>
          </div>

          <div className={styles.editorActions}>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!editingTemplate.name.trim()}
            >
              Save Template
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
        <h2 className={styles.title}>Workout Templates</h2>
        <Button variant="primary" onClick={handleCreateNew}>
          + New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>No templates yet</p>
          <Button variant="secondary" onClick={handleCreateNew}>
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className={styles.templateList}>
          {templates.map((template) => (
            <div key={template.id} className={styles.templateCard}>
              {deleteConfirmId === template.id ? (
                <div className={styles.deleteConfirm}>
                  <p className={styles.deleteConfirmText}>
                    Delete "{template.name}"?
                  </p>
                  <div className={styles.deleteConfirmActions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className={styles.deleteConfirmButton}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={styles.templateCardHeader}
                    onClick={() => setExpandedTemplateId(
                      expandedTemplateId === template.id ? null : template.id
                    )}
                    role="button"
                    tabIndex={0}
                    aria-expanded={expandedTemplateId === template.id}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setExpandedTemplateId(
                          expandedTemplateId === template.id ? null : template.id
                        );
                      }
                    }}
                  >
                    <div className={styles.templateInfo}>
                      <h3 className={styles.templateName}>{template.name}</h3>
                      <p className={styles.templateMeta}>
                        {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className={styles.templateActions}>
                      <span
                        className={`${styles.expandIcon} ${expandedTemplateId === template.id ? styles.expanded : ''}`}
                      >
                        v
                      </span>
                    </div>
                  </div>

                  {expandedTemplateId === template.id && (
                    <div className={styles.templateCardExpanded}>
                      {template.exercises.length > 0 && (
                        <ul className={styles.exercisePreviewList}>
                          {template.exercises.map((ex, i) => (
                            <li key={i} className={styles.exercisePreviewItem}>
                              <span className={styles.exercisePreviewName}>
                                {ex.exerciseName}
                              </span>
                              <span className={styles.exercisePreviewDetails}>
                                {ex.targetSets && `${ex.targetSets} sets`}
                                {ex.targetSets && ex.targetReps && ' / '}
                                {ex.targetReps && `${ex.targetReps} reps`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className={styles.templateCardActions}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(template.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
