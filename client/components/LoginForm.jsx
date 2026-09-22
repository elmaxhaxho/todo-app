'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      alert('Please fill in all fields.');
      return;
    }

    setDisabled(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Invalid email or password.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user_session', JSON.stringify(data.user));
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('Could not connect to the server. Make sure it is running.');
    } finally {
      setDisabled(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#29293d',
      }}
    >
      <div className="login-container" style={{ width: '400px', textAlign: 'center' }}>
        <h1
          className="logo"
          style={{
            color: '#7E5AFE',
            fontSize: '40px',
            fontWeight: 800,
            marginBottom: '45px',
            marginLeft: '80px',
            alignContent: 'center',
          }}
        >
          TODO
        </h1>
        <h2 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '8px' }}>
          Welcome back
        </h2>
        <p className="subtitle" style={{ fontSize: '14px', color: '#858595', marginBottom: '32px' }}>
          Log in to your account to continue
        </p>

        <form className="login-form" style={{ textAlign: 'left' }} onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={disabled}
            style={{
              width: '100%',
              height: '48px',
              marginTop: '5px',
              border: 'none',
              borderRadius: '10px',
              background: '#7E5AFE',
              color: 'white',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Log in
          </button>
        </form>

        <p className="signup-text" style={{ marginTop: '25px', fontSize: '13px', color: '#858595' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: '#7E5AFE', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}