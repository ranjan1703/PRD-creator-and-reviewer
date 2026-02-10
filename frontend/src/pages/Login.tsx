import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Register } from './Register';

export const Login: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState('Admin');
  const [password, setPassword] = useState('Admin');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  if (showRegister) {
    return (
      <Register
        onBackToLogin={() => {
          setShowRegister(false);
          setSuccessMessage(null);
        }}
        onRegisterSuccess={() => {
          setShowRegister(false);
          setSuccessMessage('Registration successful! Please login with your credentials.');
        }}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (!result.success) {
        setError(result.error || 'Login failed');
      }
      // If successful, the AuthContext will update and App.tsx will redirect
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">PRD System</h1>
          <p className="text-gray-600">Product Requirements Document Creator & Reviewer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input w-full"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              required
              disabled={isLoading}
            />
          </div>

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">Default credentials: Admin / Admin</p>
          <button
            onClick={() => setShowRegister(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Create new account →
          </button>
        </div>
      </div>
    </div>
  );
};
