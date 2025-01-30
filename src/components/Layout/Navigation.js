import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navigation = () => {
    const { t } = useTranslation();

    return (
        <nav className="nav-container">
            <NavLink to="/" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                {t('addContact')}
            </NavLink>
            <NavLink to="/contacts" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                {t('viewContacts')}
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}>
                {t('calendar')}
            </NavLink>
        </nav>
    );
};

export default Navigation; 