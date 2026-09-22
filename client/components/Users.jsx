'use client';

import { useState, useEffect } from 'react';

export default function Users({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('employee');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !password) {
      return alert('Please fill in all user fields.');
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });
      if (!res.ok) throw new Error('Failed to create user');
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('employee');
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${id}/role`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole }),
        }
      );
      if (!res.ok) throw new Error('Failed to change role');
      fetchUsers();
    } catch (err) {
      alert(err.message);
      fetchUsers();
    }
  };

  const handleDeleteUser = async (id) => {
    if (
      !confirm(
        'Are you sure you want to delete this user? They will be removed from projects and task assignments.'
      )
    )
      return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section className="page-section">
      <div className="content-header">
        <div>
          <h1>Users</h1>
          <p>Create users and manage their roles.</p>
        </div>
        <button className="new-project-btn" onClick={() => setIsModalOpen(true)}>
          + Add User
        </button>
      </div>

      <div className="admin-list">
        {loading ? null : error ? (
          <p style={{ color: '#d85c5c' }}>{error}</p>
        ) : !users.length ? (
          <p style={{ color: '#858595' }}>No users yet.</p>
        ) : (
          users.map((user) => (
            <div className="admin-card" key={user._id}>
              <div>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
              <div className="user-actions">
                <select
                  value={user.role}
                  onChange={(e) => handleChangeRole(user._id, e.target.value)}
                  disabled={user._id === currentUserId}
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
                {user._id !== currentUserId && (
                  <button
                    className="delete-project"
                    onClick={() => handleDeleteUser(user._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create User</h3>
            <div className="input-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateUser}>
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}