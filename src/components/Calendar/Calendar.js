import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { useUser } from '../../contexts/UserContext';
import { ContactManager } from '../../utils/ContactManager';

const Calendar = () => {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contacts, setContacts] = useState([]);
    const { userRole } = useUser();

    const loadContacts = async () => {
        try {
            setLoading(true);
            const fetchedContacts = await ContactManager.getContacts();
            setBirthdays(fetchedContacts);
            console.log('Calendar contacts loaded:', fetchedContacts);
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const formatMonth = (date) => {
        return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const getBirthdaysForDate = (day) => {
        return birthdays.filter(birthday => {
            const bDate = new Date(birthday.dateOfBirth);
            return bDate.getDate() === day && 
                   bDate.getMonth() === currentDate.getMonth();
        });
    };

    const getUpcomingBirthdays = () => {
        if (!birthdays.length) return [];

        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();

        const birthdaysWithDates = birthdays.map(birthday => {
            const birthMonth = birthday.birthMonth;
            const birthDay = birthday.birthDay;
            let nextBirthdayYear = today.getFullYear();

            if (birthMonth < currentMonth || 
                (birthMonth === currentMonth && birthDay < currentDay)) {
                nextBirthdayYear++;
            }

            const nextBirthday = new Date(nextBirthdayYear, birthMonth - 1, birthDay);
            const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

            return {
                ...birthday,
                nextBirthday,
                daysUntil
            };
        });

        return birthdaysWithDates
            .sort((a, b) => a.daysUntil - b.daysUntil)
            .slice(0, 2);
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];
        const weekdays = [
            t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')
        ];

        weekdays.forEach(day => {
            days.push(
                <div key={`header-${day}`} className="calendar-day header">
                    {day}
                </div>
            );
        });

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const birthdaysToday = getBirthdaysForDate(day);
            const hasBirthday = birthdaysToday.length > 0;

            days.push(
                <div 
                    key={day} 
                    className={`calendar-day ${hasBirthday ? 'has-birthday' : ''}`}
                >
                    <span className="day-number">{day}</span>
                    {hasBirthday && (
                        <span className="birthday-count">{birthdaysToday.length}</span>
                    )}
                </div>
            );
        }

        return days;
    };

    if (loading) return <div className="loading">{t('loading')}</div>;

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <button onClick={previousMonth} className="nav-btn">
                    <i className="fas fa-chevron-left"></i>
                </button>
                <h2>{formatMonth(currentDate)}</h2>
                <button onClick={nextMonth} className="nav-btn">
                    <i className="fas fa-chevron-right"></i>
                </button>
            </div>
            <div className="calendar-grid">
                {renderCalendar()}
            </div>
            <div className="upcoming-birthdays">
                <h3>{t('upcomingBirthdays')}</h3>
                {birthdays.length === 0 ? (
                    <p>{t('noBirthdays')}</p>
                ) : (
                    <div className="upcoming-list">
                        {getUpcomingBirthdays().map(birthday => (
                            <div key={birthday.id} className="upcoming-birthday-card">
                                <div className="birthday-info">
                                    <h4>{birthday.name}</h4>
                                    <p>
                                        <span className="date-section">
                                            <i className="fas fa-birthday-cake"></i>
                                            {new Date(birthday.dateOfBirth).toLocaleDateString()}
                                        </span>
                                        <span className={`days-until ${
                                            birthday.daysUntil === 0 ? 'today' : 
                                            birthday.daysUntil === 1 ? 'tomorrow' : ''
                                        }`}>
                                            {birthday.daysUntil === 0 
                                                ? t('birthdayToday')
                                                : birthday.daysUntil === 1
                                                ? t('birthdayTomorrow')
                                                : t('daysUntilBirthday', { count: birthday.daysUntil })}
                                        </span>
                                    </p>
                                    {birthday.relationship && (
                                        <span className="relationship-tag">
                                            {t(birthday.relationship.toLowerCase())}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Calendar; 