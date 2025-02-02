import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import './Login.css';

const Login = () => {
    const { signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const triggerConfetti = () => {
        import('canvas-confetti').then(confetti => {
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            function randomInRange(min, max) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                
                // since particles fall down, start a bit higher than random
                confetti.default({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });
                confetti.default({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);
        });
    };

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            setError('');
            await signInWithGoogle();
            triggerConfetti();
            setTimeout(() => {
                navigate('/');
            }, 3000);
        } catch (error) {
            console.error('Login error:', error);
            setError(t('loginError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <i className="fas fa-birthday-cake birthday-icon"></i>
                    <h1>{t('welcomeMessage')}</h1>
                    <p className="subtitle">{t('loginSubtitle')}</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                    className={`google-signin-btn ${loading ? 'loading' : ''}`}
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                >
                    <i className="fab fa-google google-icon"></i>
                    <span>{t('signInWithGoogle')}</span>
                </button>

                <div className="login-footer">
                    <p>{t('privacyNotice')}</p>
                </div>
            </div>
        </div>
    );
};

export default Login; 