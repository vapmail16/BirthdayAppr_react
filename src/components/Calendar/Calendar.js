import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const Calendar = () => {
    const { t } = useTranslation();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [birthdays, setBirthdays] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBirthdays();
    }, []);

    const fetchBirthdays = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'contacts'));
            const birthdayData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBirthdays(birthdayData);
        } catch (error) {
            console.error('Error fetching birthdays:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];
        const weekdays = [
            t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')
        ];

        // Add weekday headers
        weekdays.forEach(day => {
            days.push(
                <div key={`header-${day}`} className="calendar-day header">
                    {day}
                </div>
            );
        });

        // Add blank spaces for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Add the days of the month
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
            <h3>{t('upcomingBirthdays')}</h3>
            {birthdays.length === 0 && <p>{t('noBirthdays')}</p>}
        </div>
    );
};

export default Calendar; 