import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';
import { db } from '../../utils/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import './UserProfile.css';

const UserProfile = ({ onClose }) => {
    const { t } = useTranslation();
    const { currentUser, signOut } = useAuth();
    const { userRole } = useUser();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profileData, setProfileData] = useState({
        displayName: '',
        email: currentUser?.email || '',
        phone: '',
        notificationPreferences: {
            email: true,
            push: false,
        },
        privacySettings: {
            showBirthYear: true,
            showEmail: false,
            showPhone: false,
        },
        theme: 'light',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    useEffect(() => {
        loadUserProfile();
    }, [currentUser]);

    const loadUserProfile = async () => {
        try {
            if (!currentUser) return;
            
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setProfileData(prev => ({
                    ...prev,
                    displayName: userData.displayName || currentUser.displayName || '',
                    phone: userData.phone || '',
                    privacySettings: userData.privacySettings || prev.privacySettings
                }));
            } else {
                const defaultProfile = {
                    displayName: currentUser.displayName || '',
                    email: currentUser.email,
                    phone: '',
                    privacySettings: {
                        showBirthYear: true,
                        showEmail: false,
                        showPhone: false,
                    }
                };
                await updateDoc(doc(db, 'users', currentUser.uid), defaultProfile);
                setProfileData(defaultProfile);
            }
        } catch (err) {
            console.error('Error loading profile:', err);
            setError(t('failedToLoadProfile'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const [section, field] = name.split('.');
            setProfileData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setProfileData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), profileData);
            setSuccess(t('profileUpdateSuccess'));
        } catch (err) {
            setError(t('profileUpdateError'));
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm(t('confirmAccountDeletion'))) {
            try {
                await deleteDoc(doc(db, 'users', currentUser.uid));
                await signOut();
                window.location.href = '/login';
            } catch (err) {
                setError(t('accountDeletionError'));
            }
        }
    };

    if (loading) return <div className="profile-modal loading">{t('loading')}</div>;

    return (
        <div className="profile-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="profile-content">
                <h2>{t('userProfile')}</h2>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>{t('basicInfo')}</h3>
                        <div className="form-group">
                            <label>{t('displayName')}</label>
                            <input
                                type="text"
                                name="displayName"
                                value={profileData.displayName}
                                onChange={handleChange}
                                placeholder={t('enterDisplayName')}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('email')}</label>
                            <input
                                type="email"
                                value={profileData.email}
                                readOnly
                                className="readonly-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('phone')}</label>
                            <input
                                type="tel"
                                name="phone"
                                value={profileData.phone}
                                onChange={handleChange}
                                placeholder={t('enterPhone')}
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>{t('notifications')}</h3>
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="notificationPreferences.email"
                                    checked={profileData.notificationPreferences.email}
                                    onChange={handleChange}
                                />
                                {t('emailNotifications')}
                            </label>
                        </div>
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="notificationPreferences.push"
                                    checked={profileData.notificationPreferences.push}
                                    onChange={handleChange}
                                />
                                {t('pushNotifications')}
                            </label>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>{t('privacy')}</h3>
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="privacySettings.showBirthYear"
                                    checked={profileData.privacySettings.showBirthYear}
                                    onChange={handleChange}
                                />
                                {t('showBirthYear')}
                            </label>
                        </div>
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="privacySettings.showEmail"
                                    checked={profileData.privacySettings.showEmail}
                                    onChange={handleChange}
                                />
                                {t('showEmailToOthers')}
                            </label>
                        </div>
                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    name="privacySettings.showPhone"
                                    checked={profileData.privacySettings.showPhone}
                                    onChange={handleChange}
                                />
                                {t('showPhoneToOthers')}
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="save-btn">
                            {t('saveChanges')}
                        </button>
                        <button 
                            type="button" 
                            className="delete-account-btn"
                            onClick={handleDeleteAccount}
                        >
                            {t('deleteAccount')}
                        </button>
                    </div>
                </form>
                
                <button className="close-btn" onClick={onClose}>
                    {t('close')}
                </button>
            </div>
        </div>
    );
};

export default UserProfile; 