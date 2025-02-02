import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navigation = () => {
    const { t } = useTranslation();

    return (
        <nav className="tabs">
            <NavLink 
                to="/" 
                className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
            >
                {t('calendar')}
            </NavLink>
            <NavLink 
                to="/contacts" 
                className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
            >
                {t('viewContacts')}
            </NavLink>
            <NavLink 
                to="/add" 
                className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}
            >
                {t('addContact')}
            </NavLink>
        </nav>
    );
};

export default Navigation; 