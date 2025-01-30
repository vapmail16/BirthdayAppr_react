import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { doc, getDoc, setDoc } from '@firebase/firestore';
import '../../styles/components/Settings.css';

const Settings = () => {
    const [settings, setSettings] = useState({
        // Notification Settings
        emailNotifications: true,
        reminderDays: 3,
        
        // Display Settings
        theme: 'light',
        dateFormat: 'MM/DD/YYYY',
        
        // Personalization Settings
        language: 'en',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        
        // Backup Settings
        autoBackup: false,
        backupFrequency: 'weekly'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saveStatus, setSaveStatus] = useState('');

    // Load settings from Firebase
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'userSettings'));
                if (settingsDoc.exists()) {
                    setSettings(settingsDoc.data());
                } else {
                    // Create default settings if none exist
                    await setDoc(doc(db, 'settings', 'userSettings'), settings);
                }
            } catch (err) {
                console.error('Error loading settings:', err);
                setError('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Save settings to Firebase
    const saveSettings = async (newSettings) => {
        try {
            await setDoc(doc(db, 'settings', 'userSettings'), newSettings);
            setSettings(newSettings);
            setSaveStatus('Settings saved successfully!');
            setTimeout(() => setSaveStatus(''), 3000); // Clear status after 3 seconds
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings');
        }
    };

    const handleNotificationToggle = () => {
        const newSettings = {
            ...settings,
            emailNotifications: !settings.emailNotifications
        };
        saveSettings(newSettings);
    };

    const handleReminderDaysChange = (e) => {
        const newSettings = {
            ...settings,
            reminderDays: parseInt(e.target.value)
        };
        saveSettings(newSettings);
    };

    const handleThemeChange = async (theme) => {
        console.log('Changing theme to:', theme); // Debug log
        try {
            // Update settings in state and Firebase
            const newSettings = {
                ...settings,
                theme
            };
            
            // Apply theme directly to document
            document.documentElement.setAttribute('data-theme', theme);
            
            // Save to Firebase
            await setDoc(doc(db, 'settings', 'userSettings'), newSettings);
            setSettings(newSettings);
            setSaveStatus('Theme updated successfully!');
            setTimeout(() => setSaveStatus(''), 3000);
            console.log('Theme applied successfully'); // Debug log
        } catch (err) {
            console.error('Error applying theme:', err);
            setError('Failed to update theme');
        }
    };

    const handleDateFormatChange = (format) => {
        const newSettings = {
            ...settings,
            dateFormat: format
        };
        saveSettings(newSettings);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Apply theme change immediately
        if (name === 'theme') {
            document.documentElement.setAttribute('data-theme', value);
        }
    };

    if (loading) return <div className="loading">Loading settings...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="settings-container">
            {/* Notification Settings */}
            <section className="settings-section">
                <h2>Notification Settings</h2>
                <div className="settings-group">
                    <div className="setting-item">
                        <div className="setting-control">
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={settings.emailNotifications}
                                    onChange={handleNotificationToggle}
                                />
                                <span className="slider round"></span>
                            </label>
                            <span>Email Notifications</span>
                        </div>
                        {settings.emailNotifications && (
                            <div className="reminder-days">
                                <label>Notification Days Before:</label>
                                <select
                                    value={settings.reminderDays}
                                    onChange={handleReminderDaysChange}
                                >
                                    <option value="0">On birthday</option>
                                    <option value="1">1 day before</option>
                                    <option value="3">3 days before</option>
                                    <option value="7">7 days before</option>
                                    <option value="14">14 days before</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Display Settings */}
            <section className="settings-section">
                <h2>Display Settings</h2>
                <div className="settings-group">
                    <div className="setting-item">
                        <label>Theme:</label>
                        <select
                            name="theme"
                            value={settings.theme}
                            onChange={(e) => handleThemeChange(e.target.value)}
                        >
                            <option value="babyOrange">Baby Orange</option>
                            <option value="babyPink">Baby Pink</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                    <div className="setting-item">
                        <label>Date Format:</label>
                        <select
                            name="dateFormat"
                            value={settings.dateFormat}
                            onChange={(e) => handleDateFormatChange(e.target.value)}
                        >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Personalization Settings */}
            <section className="settings-section">
                <h2>Personalization</h2>
                <div className="settings-group">
                    <div className="setting-item">
                        <label>Language:</label>
                        <select
                            name="language"
                            value={settings.language}
                            onChange={handleChange}
                        >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                        </select>
                    </div>
                    <div className="setting-item">
                        <label>Time Zone:</label>
                        <select
                            name="timeZone"
                            value={settings.timeZone}
                            onChange={handleChange}
                        >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Backup Settings */}
            <section className="settings-section">
                <h2>Backup & Restore</h2>
                <div className="settings-group">
                    <label className="switch-label">
                        <input
                            type="checkbox"
                            name="autoBackup"
                            checked={settings.autoBackup}
                            onChange={handleChange}
                        />
                        <span>Auto Backup</span>
                    </label>
                    {settings.autoBackup && (
                        <div className="setting-item">
                            <label>Backup Frequency:</label>
                            <select
                                name="backupFrequency"
                                value={settings.backupFrequency}
                                onChange={handleChange}
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    )}
                    <div className="backup-actions">
                        <button className="backup-btn">Backup Now</button>
                        <button className="restore-btn">Restore from Backup</button>
                    </div>
                </div>
            </section>

            <div className="settings-actions">
                <button 
                    onClick={() => saveSettings(settings)} 
                    disabled={loading}
                    className="btn-primary"
                >
                    {loading ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

            {saveStatus && <div className="save-status success">{saveStatus}</div>}
        </div>
    );
};

export default Settings; 