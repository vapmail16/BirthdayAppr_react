import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Layout/Navigation';
import TopIcons from './components/Layout/TopIcons';
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
import { AuthProvider } from './contexts/AuthContext';
import AuthComponent from './components/Auth/AuthComponent';
import PrivateRoute from './components/Auth/PrivateRoute';
import { UserProvider } from './contexts/UserContext';

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
                    document.documentElement.setAttribute('data-theme', theme || 'babyOrange');
                    i18n.changeLanguage(language || 'en');
                } else {
                    document.documentElement.setAttribute('data-theme', 'babyOrange');
                }
            } catch (err) {
                console.error('Error loading settings:', err);
            }
        };

        loadSettings();
    }, []);

    return (
        <AuthProvider>
            <UserProvider>
                <div className="page-container">
                    <Routes>
                        <Route path="/login" element={<AuthComponent />} />
                        <Route
                            path="/*"
                            element={
                                <PrivateRoute>
                                    <div className="white-container">
                                        <TopIcons onSettingsClick={() => setIsSettingsOpen(true)} />
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
                                            <Route path="/" element={<Calendar />} />
                                            <Route path="/contacts" element={<ContactList />} />
                                            <Route path="/add" element={<ContactForm />} />
                                        </Routes>
                                    </div>
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                    <SettingsModal 
                        isOpen={isSettingsOpen} 
                        onClose={() => setIsSettingsOpen(false)} 
                    />
                </div>
            </UserProvider>
        </AuthProvider>
    );
}

export default App; 