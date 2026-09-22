'use client';

export default function TaskCard({ task, isAdmin, onArchiveTask, onDeleteTask }) {
  const getMemberInitials = (m) =>
    (m?.name || m?.email || 'User').slice(0, 2).toUpperCase();

  const handleDragStart = (e) => {
    if (isAdmin) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task._id);
    e.target.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
  };

  const assigned = task.assignedTo;

  return (
    <div
      className="task-card"
      draggable={!isAdmin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="task-card-top">
        <h4>{task.title}</h4>
        {isAdmin && (
          <div className="task-actions">
            <button
              className="task-archive"
              title="Archive task"
              onClick={() => onArchiveTask(task._id)}
            >
              □
            </button>
            <button
              className="task-delete"
              title="Delete task"
              onClick={() => onDeleteTask(task._id)}
            >
              ×
            </button>
          </div>
        )}
      </div>
      {task.description && <p>{task.description}</p>}
      {task.label && task.label !== 'General' && (
        <span
          style={{
            display: 'inline-block',
            background: '#eeeafd',
            color: '#6c4df6',
            padding: '5px 9px',
            borderRadius: '7px',
            fontSize: '11px',
            fontWeight: '600',
            marginBottom: '8px',
          }}
        >
          {task.label}
        </span>
      )}
      {assigned && (
        <div className="task-footer">
          <div className="task-avatar" title={assigned.email || assigned.name}>
            {getMemberInitials(assigned)}
          </div>
        </div>
      )}
    </div>
  );
}