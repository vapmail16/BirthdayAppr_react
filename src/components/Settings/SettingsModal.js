import React, { useState } from 'react';
import { doc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';

const SettingsModal = ({ isOpen, onClose }) => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState('notifications');
    const [settings, setSettings] = useState({
        // Notification Settings
        emailNotifications: true,
        reminderDays: 3,
        
        // Display Settings
        theme: 'babyOrange',
        
        // Personalization Settings
        language: 'en',
        
        // Backup Settings
        autoBackup: false,
        backupFrequency: 'weekly'
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [error, setError] = useState('');

    const handleThemeChange = async (theme) => {
        try {
            const newSettings = { ...settings, theme };
            document.documentElement.setAttribute('data-theme', theme);
            await setDoc(doc(db, 'settings', 'userSettings'), newSettings);
            setSettings(newSettings);
        } catch (err) {
            console.error('Error updating theme:', err);
        }
    };

    const handleLanguageChange = async (e) => {
        const newLanguage = e.target.value;
        const newSettings = {
            ...settings,
            language: newLanguage
        };
        setSettings(newSettings);
        
        try {
            // Save to Firebase
            await setDoc(doc(db, 'settings', 'userSettings'), newSettings);
            // Update i18n language
            i18n.changeLanguage(newLanguage);
        } catch (err) {
            console.error('Error updating language:', err);
        }
    };

    const handleBackup = async () => {
        try {
            // Get all contacts
            const querySnapshot = await getDocs(collection(db, 'contacts'));
            const contacts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Create backup data
            const backup = {
                timestamp: new Date().toISOString(),
                data: contacts
            };

            // Convert to JSON and create downloadable file
            const dataStr = JSON.stringify(backup, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(dataBlob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `birthday_app_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            setSuccessMessage(t('backupSuccess'));
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Error creating backup:', err);
            setError(t('backupError'));
        }
    };

    const handleRestore = async () => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = async (e) => {
                try {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    
                    reader.onload = async (event) => {
                        try {
                            const backup = JSON.parse(event.target.result);
                            
                            // Validate backup format
                            if (!backup.data || !Array.isArray(backup.data)) {
                                throw new Error('Invalid backup format');
                            }

                            // Get existing contacts
                            const querySnapshot = await getDocs(collection(db, 'contacts'));
                            const existingContacts = querySnapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));

                            let added = 0;
                            let skipped = 0;

                            // Restore contacts, checking for duplicates
                            for (const contact of backup.data) {
                                const { id, ...contactData } = contact;
                                
                                // Check for duplicate based on email or name+dob combination
                                const isDuplicate = existingContacts.some(existing => 
                                    (existing.email && existing.email === contactData.email) || 
                                    (existing.name === contactData.name && 
                                     existing.dateOfBirth === contactData.dateOfBirth)
                                );

                                if (!isDuplicate) {
                                    await addDoc(collection(db, 'contacts'), {
                                        ...contactData,
                                        timestamp: new Date()
                                    });
                                    added++;
                                } else {
                                    skipped++;
                                }
                            }

                            setSuccessMessage(t('restoreSuccessWithCount', { 
                                added, 
                                skipped,
                                total: backup.data.length 
                            }));
                            setShowSuccessModal(true);
                        } catch (err) {
                            console.error('Error parsing backup:', err);
                            setError(t('invalidBackupFile'));
                        }
                    };

                    reader.readAsText(file);
                } catch (err) {
                    console.error('Error reading file:', err);
                    setError(t('restoreError'));
                }
            };

            input.click();
        } catch (err) {
            console.error('Error restoring backup:', err);
            setError(t('restoreError'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="settings-modal">
                <div className="modal-header">
                    <h2>{t('settings')}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="settings-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        {t('notifications')}
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'display' ? 'active' : ''}`}
                        onClick={() => setActiveTab('display')}
                    >
                        {t('display')}
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'personalization' ? 'active' : ''}`}
                        onClick={() => setActiveTab('personalization')}
                    >
                        {t('personalization')}
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'backup' ? 'active' : ''}`}
                        onClick={() => setActiveTab('backup')}
                    >
                        {t('backup')}
                    </button>
                </div>

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="settings-section">
                        <h3>{t('notificationSettings')}</h3>
                        <div className="setting-item">
                            <div className="setting-control">
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.emailNotifications}
                                        onChange={() => setSettings({
                                            ...settings,
                                            emailNotifications: !settings.emailNotifications
                                        })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span>{t('emailNotifications')}</span>
                            </div>
                        </div>
                        {settings.emailNotifications && (
                            <div className="setting-item">
                                <label>{t('reminderDaysBefore')}:</label>
                                <select
                                    value={settings.reminderDays}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        reminderDays: parseInt(e.target.value)
                                    })}
                                >
                                    <option value="0">{t('onBirthday')}</option>
                                    <option value="1">{t('dayBefore')}</option>
                                    <option value="3">{t('daysBefore')}</option>
                                    <option value="7">{t('daysBefore')}</option>
                                    <option value="14">{t('daysBefore')}</option>
                                </select>
                            </div>
                        )}
                    </div>
                )}

                {/* Display Tab */}
                {activeTab === 'display' && (
                    <div className="settings-section">
                        <h3>{t('displaySettings')}</h3>
                        <div className="setting-item">
                            <label>{t('theme')}:</label>
                            <select
                                value={settings.theme}
                                onChange={(e) => handleThemeChange(e.target.value)}
                            >
                                <option value="babyOrange">{t('babyOrange')}</option>
                                <option value="babyPink">{t('babyPink')}</option>
                                <option value="dark">{t('dark')}</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Personalization Tab */}
                {activeTab === 'personalization' && (
                    <div className="settings-section">
                        <h3>{t('personalizationSettings')}</h3>
                        <div className="setting-item">
                            <label>{t('language')}:</label>
                            <select
                                value={settings.language}
                                onChange={handleLanguageChange}
                            >
                                <option value="en">{t('english')}</option>
                                <option value="hi">{t('hindi')}</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Backup Tab */}
                {activeTab === 'backup' && (
                    <div className="settings-section">
                        <h3>{t('backupAndRestore')}</h3>
                        {error && <div className="error-message">{error}</div>}
                        <div className="setting-item">
                            <label className="switch-label">
                                <input
                                    type="checkbox"
                                    checked={settings.autoBackup}
                                    onChange={() => setSettings({
                                        ...settings,
                                        autoBackup: !settings.autoBackup
                                    })}
                                />
                                <span>{t('autoBackup')}</span>
                            </label>
                        </div>
                        {settings.autoBackup && (
                            <div className="setting-item">
                                <label>{t('backupFrequency')}:</label>
                                <select
                                    value={settings.backupFrequency}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        backupFrequency: e.target.value
                                    })}
                                >
                                    <option value="daily">{t('daily')}</option>
                                    <option value="weekly">{t('weekly')}</option>
                                    <option value="monthly">{t('monthly')}</option>
                                </select>
                            </div>
                        )}
                        <div className="backup-actions">
                            <button 
                                className="backup-btn" 
                                onClick={handleBackup}
                            >
                                {t('backupNow')}
                            </button>
                            <button 
                                className="restore-btn"
                                onClick={handleRestore}
                            >
                                {t('restoreFromBackup')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Success Modal */}
                <Modal
                    isOpen={showSuccessModal}
                    onClose={() => setShowSuccessModal(false)}
                    onConfirm={() => setShowSuccessModal(false)}
                    title={t('successTitle')}
                    message={successMessage}
                    confirmText={t('ok')}
                />

                <div className="modal-footer">
                    <button className="save-btn" onClick={onClose}>{t('save')}</button>
                    <button className="cancel-btn" onClick={onClose}>{t('cancel')}</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal; 