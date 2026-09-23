
'use client';

import { useEffect, useState } from 'react';

export default function Header({
  username,
  searchTerm,
  setSearchTerm
}) {
  const [profileOpen, setProfileOpen] = useState(false);

  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user_session');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Could not load user:', error);
      }
    }
  }, []);

  return (
    <>
      <header className="header">

        <div className="logo">
          TODO
        </div>

        <div className="search-container">
          <input
            type="text"
            className="search-bar"
            placeholder="Search projects or tasks..."
            value={searchTerm ?? ''}
            onChange={(e) =>
              setSearchTerm?.(e.target.value)
            }
          />
        </div>

        <div
          className="profile"
          onClick={() => setProfileOpen(true)}
          style={{
            cursor: 'pointer'
          }}
        >

          <div className="profile-picture">
            <img
              src="/profile.jpg"
              alt="Profile picture"
            />
          </div>

          <span className="username">
            {username || user?.name || 'User'}
          </span>

        </div>

      </header>


      {profileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onSaved={(updatedUser) => {
            setUser(updatedUser);

            localStorage.setItem(
              'user_session',
              JSON.stringify(updatedUser)
            );

            setProfileOpen(false);
          }}
        />
      )}

    </>
  );
}


function ProfileModal({
  user,
  onClose,
  onSaved
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPassword('');
    }
  }, [user]);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      alert('Name and email are required.');
      return;
    }

    if (password && password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);

      const token = localStorage.getItem('token');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/users/profile`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(
          data.message ||
          'Could not update your profile.'
        );
        return;
      }

      localStorage.setItem(
        'user_session',
        JSON.stringify(data.user)
      );

      onSaved(data.user);

    } catch (error) {
      console.error('Profile update error:', error);

      alert('Could not connect to the server.');

    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '16px'
          }}
        >
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '450px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          color: '#29293d'
        }}
      >

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: 700
            }}
          >
            My Profile
          </h2>

          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#858595'
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '24px'
          }}
        >
          <img
            src="/profile.jpg"
            alt="Profile picture"
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid #7E5AFE'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '7px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              border: '1px solid #dddde8',
              borderRadius: '8px',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '7px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              border: '1px solid #dddde8',
              borderRadius: '8px',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '7px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            New Password
          </label>

          <input
            type="password"
            value={password}
            placeholder="Leave blank to keep current password"
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              border: '1px solid #dddde8',
              borderRadius: '8px',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>

        <div
          style={{
            marginBottom: '24px',
            fontSize: '13px',
            color: '#858595'
          }}
        >
          Role:{' '}
          <strong style={{ color: '#29293d' }}>
            {user.role === 'admin'
              ? 'Admin'
              : 'Employee'}
          </strong>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '11px 20px',
              border: '1px solid #dddde8',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              color: '#555566',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '11px 22px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#7E5AFE',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  );
}

