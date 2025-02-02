import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import AdminStats from '../Admin/AdminStats';
import UserProfile from '../Profile/UserProfile';

const TopIcons = ({ onSettingsClick }) => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { userRole } = useUser();
    const [showStats, setShowStats] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Add debug logging
    useEffect(() => {
        console.log('TopIcons - Current user role:', userRole);
    }, [userRole]);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <>
            <div className="top-icons">
                {userRole === 'admin' && (
                    <button 
                        className="icon-button admin-btn" 
                        onClick={() => setShowStats(true)}
                        title="Admin Statistics"
                    >
                        <i className="fas fa-chart-bar"></i>
                    </button>
                )}
                <button 
                    className="icon-button profile-btn"
                    onClick={() => setShowProfile(true)}
                    title="User Profile"
                >
                    <i className="fas fa-user-circle"></i>
                </button>
                <button 
                    className="icon-button logout-btn" 
                    onClick={handleLogout}
                    title="Logout"
                >
                    <i className="fas fa-sign-out-alt"></i>
                </button>
                <div 
                    className="settings-icon" 
                    onClick={onSettingsClick}
                    title="Settings"
                >
                    <i className="fas fa-cog"></i>
                </div>
            </div>
            {showStats && <AdminStats onClose={() => setShowStats(false)} />}
            {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
        </>
    );
};

export default TopIcons; 