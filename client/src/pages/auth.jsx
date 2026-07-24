import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../providers/auth'

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID?.trim()
const googleAuthEnabled = Boolean(googleClientId)

const Auth = ({ defaultTab }) => {
  const { login, register, loginWithGoogleCredential, user, loading } = useAuth()
  const navigate = useNavigate()

  const [isSignUp, setIsSignUp] = useState(defaultTab === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  useEffect(() => {
    setIsSignUp(defaultTab === 'signup')
  }, [defaultTab])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password || (isSignUp && !name)) {
      setError('Please fill in all required fields.')
      return
    }

    try {
      if (isSignUp) {
        register(email, password, name)
      } else {
        login(email, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    }
  }

  const handleGoogleSuccess = (credentialResponse) => {
    setError('')
    try {
      if (!credentialResponse?.credential) {
        throw new Error('No credential returned from Google.')
      }
      loginWithGoogleCredential(credentialResponse.credential)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.')
    }
  }

  // Alias to fix any leftover reference causing ESLint 'handleGoogleSignIn is not defined'
  const handleGoogleSignIn = handleGoogleSuccess

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed. Try again.')
  }

  const handleToggle = () => {
    if (isSignUp) {
      navigate('/login')
    } else {
      navigate('/signup')
    }
  }

  // Show spinner while auth state loads from localStorage
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas)' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid var(--color-hairline)', borderTopColor: 'var(--color-ink)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-canvas)', overflow: 'hidden' }}>
      {/* Background Gradients */}
      <div className="gradient-orb-container">
        <div className="gradient-orb orb-mint" style={{ top: '-10%', left: '15%' }}></div>
        <div className="gradient-orb orb-peach" style={{ bottom: '-15%', right: '10%' }}></div>
        <div className="gradient-orb orb-lavender" style={{ top: '40%', right: '20%' }}></div>
      </div>

      {/* Auth Card */}
      <div className="feature-card" style={{ width: '100%', maxWidth: '420px', zIndex: 10, padding: 'var(--spacing-xl)', borderRadius: 'var(--rounded-xl)', backgroundColor: 'var(--color-surface-card)', textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: '32px', marginBottom: 'var(--spacing-xs)', color: 'var(--color-ink)' }}>
          AuraChat
        </h1>
        <p className="body-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
          {isSignUp ? 'Create your collaborative space' : 'Welcome back to your workspace'}
        </p>

        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: '14px', marginBottom: 'var(--spacing-base)', textAlign: 'left', padding: '10px 14px', border: '1px solid var(--color-error)', borderRadius: 'var(--rounded-md)', backgroundColor: '#fef2f2' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-base)', textAlign: 'left' }}>
          {isSignUp && (
            <div>
              <label className="caption-uppercase" style={{ display: 'block', marginBottom: 'var(--spacing-xxs)', color: 'var(--color-muted)' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter full name"
                className="text-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="caption-uppercase" style={{ display: 'block', marginBottom: 'var(--spacing-xxs)', color: 'var(--color-muted)' }}>
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              className="text-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="caption-uppercase" style={{ display: 'block', marginBottom: 'var(--spacing-xxs)', color: 'var(--color-muted)' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="text-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="button-primary" style={{ marginTop: 'var(--spacing-sm)', width: '100%', height: '44px' }}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: 'var(--spacing-md) 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-xs)' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-hairline)' }}></div>
          <span className="caption" style={{ color: 'var(--color-muted)' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-hairline)' }}></div>
        </div>

        {/* Google OAuth */}
        {googleAuthEnabled ? (
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="360"
            />
          </div>
        ) : (
          <p className="body-sm" style={{ color: 'var(--color-muted)', margin: 0 }}>
            Add <code>REACT_APP_GOOGLE_CLIENT_ID</code> in <code>client/.env</code> to enable Google sign-in.
          </p>
        )}

        <p className="body-sm" style={{ marginTop: 'var(--spacing-lg)' }}>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={handleToggle}
            className="button-tertiary-text"
            style={{ fontSize: '15px' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default Auth