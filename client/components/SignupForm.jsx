'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupForm() {

  const router = useRouter();

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [disabled, setDisabled] =
    useState(false);

  useEffect(() => {

    if (
      localStorage.getItem('token')
    ) {
      router.push('/');
    }

  }, [router]);

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      alert(
        'Please fill in all fields.'
      );
      return;
    }

    if (
      password !== confirmPassword
    ) {
      alert(
        'Passwords do not match.'
      );
      return;
    }

    if (password.length < 6) {
      alert(
        'Password must be at least 6 characters.'
      );
      return;
    }

    setDisabled(true);

    try {

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/signup`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            name: name.trim(),
            email:
              email
                .trim()
                .toLowerCase(),
            password
          })
        }
      );

      const data =
        await res.json();

      if (!res.ok) {

        alert(
          data.message ||
          'Could not create your account.'
        );

        return;
      }

      localStorage.setItem(
        'token',
        data.token
      );

      localStorage.setItem(
        'user_session',
        JSON.stringify(data.user)
      );

      router.push('/');

    } catch (err) {

      console.error(err);

      alert(
        'Could not connect to the server. Make sure it is running.'
      );

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
        color: '#29293d'
      }}
    >

      <div
        className="signup-container"
        style={{
          width: '400px',
          textAlign: 'center'
        }}
      >

        <h1
          className="logo"
          style={{
            color: '#7E5AFE',
            fontSize: '32px',
            fontWeight: 800,
            marginBottom: '40px',
            marginLeft: '80px',
            alignContent: 'center'
          }}
        >
          TODO
        </h1>

        <h2
          style={{
            fontSize: '26px',
            fontWeight: 700,
            marginBottom: '8px'
          }}
        >
          Create your account
        </h2>

        <p
          className="subtitle"
          style={{
            fontSize: '14px',
            color: '#858595',
            marginBottom: '28px'
          }}
        >
          Create your own workspace and start organizing your tasks
        </p>

        <form
          className="signup-form"
          style={{
            textAlign: 'left'
          }}
          onSubmit={handleSubmit}
        >

          <div className="input-group">

            <label htmlFor="name">
              Name
            </label>

            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              required
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

          </div>

          <div className="input-group">

            <label htmlFor="email">
              Email
            </label>

            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

          </div>

          <div className="input-group">

            <label htmlFor="password">
              Password
            </label>

            <input
              type="password"
              id="password"
              placeholder="Create a password"
              required
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

          </div>

          <div className="input-group">

            <label htmlFor="confirm-password">
              Confirm Password
            </label>

            <input
              type="password"
              id="confirm-password"
              placeholder="Confirm your password"
              required
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value
                )
              }
            />

          </div>

          <button
            type="submit"
            className="signup-button"
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
              cursor: 'pointer'
            }}
          >
            {disabled
              ? 'Creating...'
              : 'Create account'}
          </button>

        </form>

        <p
          className="login-text"
          style={{
            marginTop: '23px',
            fontSize: '13px',
            color: '#858595'
          }}
        >
          Already have an account?{' '}

          <Link
            href="/login"
            style={{
              color: '#7E5AFE',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Log in
          </Link>

        </p>

      </div>

    </div>
  );
}