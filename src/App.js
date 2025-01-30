import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Layout/Navigation';
import ContactForm from './components/Contacts/ContactForm';
import ContactList from './components/Contacts/ContactList';
import Calendar from './components/Calendar/Calendar';
import Settings from './components/Settings/Settings';
import SettingsModal from './components/Settings/SettingsModal';
import { db } from './utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import './styles/themes.css';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';

function App() {
    const { t } = useTranslation();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settingsDoc = await getDoc(doc(db, 'settings', 'userSettings'));
                if (settingsDoc.exists()) {
                    const { theme, language } = settingsDoc.data();
                    // Apply theme with babyOrange as default
                    document.documentElement.setAttribute('data-theme', theme || 'babyOrange');
                    console.log('Theme applied:', theme);
                    // Change language for the entire app
                    i18n.changeLanguage(language || 'en');
                } else {
                    // Set default theme if no settings exist
                    document.documentElement.setAttribute('data-theme', 'babyOrange');
                }
            } catch (err) {
                console.error('Error loading settings:', err);
            }
        };

        loadSettings();
    }, []);

    return (
        <div className="page-container">
            <div className="white-container">
                <div className="settings-icon" onClick={() => setIsSettingsOpen(true)}>
                    <i className="fas fa-cog"></i>
                </div>
                <h1>{t('birthdayReminderApp')}</h1>
                <div className="notification-toggle">
                    <label className="switch">
                        <input 
                            type="checkbox" 
                            checked={notificationsEnabled}
                            onChange={(e) => setNotificationsEnabled(e.target.checked)}
                        />
                        <span className="slider round"></span>
                    </label>
                    <span className="notification-status">
                        {notificationsEnabled ? t('birthdayNotificationsEnabled') : t('birthdayNotificationsDisabled')}
                    </span>
                </div>
                <Navigation />
                <Routes>
                    <Route path="/" element={<ContactForm />} />
                    <Route path="/contacts" element={<ContactList />} />
                    <Route path="/calendar" element={<Calendar />} />
                </Routes>
            </div>
            <SettingsModal 
                isOpen={isSettingsOpen} 
                onClose={() => setIsSettingsOpen(false)} 
            />
        </div>
    );
}

export default App; 