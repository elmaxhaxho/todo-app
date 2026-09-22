
'use client';

import { useState, useEffect } from 'react';

export default function Archive({ isAdmin }) {
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchArchive = async () => {
    try {
      setError('');

      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const projectsRes = await fetch(
        `${apiUrl}/api/projects/archive`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!projectsRes.ok) {
        throw new Error('Failed to fetch archived projects');
      }

      const projects = await projectsRes.json();

      setArchivedProjects(projects);

      const tasksRes = await fetch(
        `${apiUrl}/api/tasks/archived`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!tasksRes.ok) {
        throw new Error('Failed to fetch archived tasks');
      }

      const tasks = await tasksRes.json();

      setArchivedTasks(tasks);

    } catch (err) {
      console.error('Archive loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchArchive();
  }, []);

  const handleRestoreProject = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const res = await fetch(
        `${apiUrl}/api/projects/${id}/restore`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        throw new Error(
          data.message || 'Failed to restore project'
        );
      }

      await fetchArchive();

    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestoreTask = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

      const res = await fetch(
        `${apiUrl}/api/tasks/${id}/restore`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        throw new Error(
          data.message || 'Failed to restore task'
        );
      }

      await fetchArchive();

    } catch (err) {
      alert(err.message);
    }
  };


  if (loading) return null;

  if (error) {
    return (
      <p style={{ color: '#d85c5c' }}>
        {error}
      </p>
    );
  }


  return (
    <section className="page-section">

      <div className="content-header">
        <div>
          <h1>Archive</h1>
          <p>
            View your archived projects and tasks.
          </p>
        </div>
      </div>


      <div className="archive-container">

        {}

        <h2>
          Archived Projects
        </h2>

        <div id="archived-projects-container">

          {!archivedProjects.length ? (

            <p
              style={{
                color: '#858595',
                padding: '10px 0 20px',
                fontSize: '13px'
              }}
            >
              No archived projects.
            </p>

          ) : (

            archivedProjects.map((project) => (

              <div
                className="project-board"
                key={project._id}
              >

                <div
                  className="project-header"
                  style={{ marginBottom: 0 }}
                >

                  <div>

                    <h3
                      style={{
                        fontSize: '16px',
                        margin: 0,
                        fontWeight: 600
                      }}
                    >
                      {project.title}
                    </h3>

                    {project.description && (

                      <p
                        style={{
                          fontSize: '13px',
                          color: '#858595',
                          marginTop: '5px'
                        }}
                      >
                        {project.description}
                      </p>

                    )}

                    <p
                      style={{
                        fontSize: '12px',
                        color: '#858595',
                        marginTop: '7px'
                      }}
                    >
                      {project.tasks?.length || 0} task(s)
                    </p>

                  </div>


                  {isAdmin && (

                    <div className="project-actions">

                      <button
                        className="archive-project"
                        onClick={() =>
                          handleRestoreProject(project._id)
                        }
                      >
                        Restore
                      </button>

                    </div>

                  )}

                </div>

              </div>

            ))

          )}

        </div>


        {}

        <h2 style={{ marginTop: '30px' }}>
          Archived Tasks
        </h2>

        <div id="archived-tasks-container">

          {!archivedTasks.length ? (

            <p
              style={{
                color: '#858595',
                padding: '10px 0',
                fontSize: '13px'
              }}
            >
              No archived tasks.
            </p>

          ) : (

            archivedTasks.map((task) => {

              const projectTitle =
                task.projectId?.title ||
                task.projectTitle ||
                'Unknown project';

              return (

                <div
                  className="project-board"
                  key={task._id}
                >

                  <div
                    className="project-header"
                    style={{ marginBottom: 0 }}
                  >

                    <div>

                      <h3
                        style={{
                          fontSize: '16px',
                          margin: 0,
                          fontWeight: 600
                        }}
                      >
                        {task.title}
                      </h3>


                      <p
                        style={{
                          fontSize: '12px',
                          color: '#858595',
                          marginTop: '7px'
                        }}
                      >
                        Project: {projectTitle}
                      </p>


                      {task.description && (

                        <p
                          style={{
                            fontSize: '13px',
                            color: '#858595',
                            marginTop: '5px'
                          }}
                        >
                          {task.description}
                        </p>

                      )}


                      {task.label &&
                        task.label !== 'General' && (

                        <p
                          style={{
                            fontSize: '12px',
                            color: '#858595',
                            marginTop: '5px'
                          }}
                        >
                          Label: {task.label}
                        </p>

                      )}


                      {task.assignedTo && (

                        <p
                          style={{
                            fontSize: '12px',
                            color: '#858595',
                            marginTop: '5px'
                          }}
                        >
                          Assigned to:{' '}
                          {task.assignedTo.name ||
                            task.assignedTo.email}
                        </p>

                      )}

                    </div>


                    {isAdmin && (

                      <div className="project-actions">

                        <button
                          className="archive-project"
                          onClick={() =>
                            handleRestoreTask(task._id)
                          }
                        >
                          Restore
                        </button>

                      </div>

                    )}

                  </div>

                </div>

              );
            })

          )}

        </div>

      </div>

    </section>
  );
}
