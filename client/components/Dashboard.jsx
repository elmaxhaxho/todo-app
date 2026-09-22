'use client';

import { useState, useEffect } from 'react';

export default function Dashboard({ isAdmin }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      }
    }
    fetchDashboard();
  }, []);

  if (error) {
    return <p style={{ color: '#d85c5c' }}>{error}</p>;
  }

  if (!data) return null;

  const adminCards = [
    ['Total Projects', data.totalProjects],
    ['Total Tasks', data.totalTasks],
    ['Total Clients', data.totalClients],
    ['Total Users', data.totalUsers],
    ['Archived Projects', data.archivedProjects],
    ['Archived Tasks', data.archivedTasks],
  ];

  const employeeCards = [
    ['My Projects', data.myProjects],
    ['My Tasks', data.myTasks],
    ['My Pending Tasks', data.myPendingTasks],
    ['My Completed Tasks', data.myCompletedTasks],
  ];

  const cards = isAdmin ? adminCards : employeeCards;

  return (
    <section className="page-section">
      <div className="content-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your work.</p>
        </div>
      </div>
      <div className="dashboard-cards">
        {cards.map(([title, value], index) => (
          <div className="dashboard-card" key={index}>
            <h3>{title}</h3>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}