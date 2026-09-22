'use client';

import TaskBoard from './TaskBoard';

export default function ProjectCard({
  project,
  isAdmin,
  filterTerm,
  onEditProject,
  onArchiveProject,
  onDeleteProject,
  onOpenTaskModal,
  onArchiveTask,
  onDeleteTask,
  onTaskStatusChange,
}) {
  const getMemberInitials = (m) =>
    (m?.name || m?.email || 'User').slice(0, 2).toUpperCase();

  return (
    <div className="project-board">
      <div className="project-header">
        <div className="project-title-section">
          <div>
            <h2>{project.title}</h2>
            {project.description && (
              <p style={{ fontSize: '13px', color: '#858595', marginBottom: '8px' }}>
                {project.description}
              </p>
            )}
            <div className="project-members" style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '8px' }}>
              {(project.members || []).map((m) => (
                <div key={m._id} className="member-avatar" title={m.name || m.email}>
                  {getMemberInitials(m)}
                </div>
              ))}
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="project-actions">
            <button className="archive-project" onClick={() => onEditProject(project)}>
              Edit
            </button>
            <button className="archive-project" onClick={() => onArchiveProject(project._id)}>
              Archive
            </button>
            <button className="delete-project" onClick={() => onDeleteProject(project._id)}>
              Delete
            </button>
          </div>
        )}
      </div>
      <TaskBoard
        project={project}
        isAdmin={isAdmin}
        filterTerm={filterTerm}
        onOpenTaskModal={onOpenTaskModal}
        onArchiveTask={onArchiveTask}
        onDeleteTask={onDeleteTask}
        onTaskStatusChange={onTaskStatusChange}
      />
    </div>
  );
}