'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import Projects from '../components/Projects';
import Clients from '../components/Clients';
import Users from '../components/Users';
import Archive from '../components/Archive';

export default function Home() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const session = localStorage.getItem('user_session');

    if (!token || !session) {
      router.replace('/login');
      return;
    }

    try {
      setUser(JSON.parse(session));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user_session');
      router.replace('/login');
    }
  }, [router]);

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="layout">
      <Header
        username={user.name}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <Sidebar
        currentSection={currentSection}
        setCurrentSection={setCurrentSection}
        isAdmin={isAdmin}
      />

      <main className="main-content">
        {currentSection === 'dashboard' && <Dashboard isAdmin={isAdmin} />}

        {currentSection === 'projects' && (
          <Projects isAdmin={isAdmin} searchTerm={searchTerm} />
        )}

        {currentSection === 'clients' && isAdmin && <Clients />}

        {currentSection === 'users' && isAdmin && (
          <Users currentUserId={user._id || user.id} />
        )}

        {currentSection === 'archive' && <Archive isAdmin={isAdmin} />}
      </main>
    </div>
  );
}
