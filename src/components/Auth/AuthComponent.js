import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../utils/auth';
import './AuthComponent.css';

const AuthComponent = () => {
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        try {
            setError(null);
            setLoading(true);
            const user = await authService.signInWithGoogle();
            console.log('Successfully signed in with Google:', user);
            navigate('/');
        } catch (error) {
            console.error('Google sign-in error:', error);
            setError(error.message || 'Failed to sign in with Google. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>Sign in to Birthday Reminder</h2>
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            <button 
                className="auth-button google-button"
                onClick={handleGoogleSignIn}
                disabled={loading}
            >
                <img src="/google-icon.png" alt="Google" />
                {loading ? 'Signing in...' : 'Sign in with Google'}
            </button>
        </div>
    );
};

export default AuthComponent; 