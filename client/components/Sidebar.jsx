'use client';

import { useRouter } from 'next/navigation';

export default function Sidebar({ currentSection, setCurrentSection, isAdmin }) {
  const router = useRouter();

  const handleLogout = (e) => {
    e.preventDefault();
    if (confirm('Are you sure you want to log out?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_session');
      router.push('/login');
    }
  };

  return (
    <aside className="sidebar">
      <nav className="navigation">
        <button
          className={`nav-item ${currentSection === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentSection('dashboard')}
        >
          <span className="nav-icon">⌂</span>
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-item ${currentSection === 'projects' ? 'active' : ''}`}
          onClick={() => setCurrentSection('projects')}
        >
          <span className="nav-icon">☰</span>
          <span>Projects</span>
        </button>

        {isAdmin && (
          <>
            <button
              className={`nav-item ${currentSection === 'clients' ? 'active' : ''}`}
              onClick={() => setCurrentSection('clients')}
            >
              <span className="nav-icon">♙</span>
              <span>Clients</span>
            </button>

            <button
              className={`nav-item ${currentSection === 'users' ? 'active' : ''}`}
              onClick={() => setCurrentSection('users')}
            >
              <span className="nav-icon">♙</span>
              <span>Users</span>
            </button>
          </>
        )}

        <button
          className={`nav-item ${currentSection === 'archive' ? 'active' : ''}`}
          onClick={() => setCurrentSection('archive')}
        >
          <span className="nav-icon">✉</span>
          <span>Archive</span>
        </button>
      </nav>

      <button className="nav-item logout" onClick={handleLogout}>
        <span className="nav-icon">↪</span>
        <span>Logout</span>
      </button>
    </aside>
  );
}