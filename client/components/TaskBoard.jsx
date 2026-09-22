'use client';

import { useState } from 'react';
import TaskCard from './TaskCard';

export default function TaskBoard({
  project,
  isAdmin,
  filterTerm,
  onOpenTaskModal,
  onArchiveTask,
  onDeleteTask,
  onTaskStatusChange,
}) {
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const taskMatchesSearch = (task, term) => {
    if (!term) return true;
    return `${task.title || ''} ${task.description || ''} ${task.label || ''}`
      .toLowerCase()
      .includes(term);
  };

  const handleDragOver = (e) => {
    if (!isAdmin) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragEnter = (e, status) => {
    if (!isAdmin) {
      e.preventDefault();
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!isAdmin) {
      const taskId = e.dataTransfer.getData('text/plain');
      if (taskId) {
        onTaskStatusChange(taskId, status);
      }
    }
  };

  const renderColumn = (status, label) => {
    const tasks = (project.tasks || []).filter(
      (task) =>
        !task.archived &&
        !task.deleted &&
        task.status === status &&
        taskMatchesSearch(task, filterTerm)
    );

    return (
      <div
        className={`board-column ${dragOverColumn === status ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={(e) => handleDragEnter(e, status)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="column-header">
          <div className="column-title">
            <span className={`status-dot ${status}-dot`}></span>
            <h3>{label}</h3>
            <span className="task-count">{tasks.length}</span>
          </div>
        </div>
        <div className="task-list">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              isAdmin={isAdmin}
              onArchiveTask={onArchiveTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
        {isAdmin && (
          <button
            className="add-task-btn"
            onClick={() => onOpenTaskModal(project._id, status)}
          >
            + Add a task
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="board">
      {renderColumn('todo', 'TODO')}
      {renderColumn('in-progress', 'IN PROGRESS')}
      {renderColumn('done', 'DONE')}
    </div>
  );
}