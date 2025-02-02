import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './AdminStats.css';

const AdminStats = ({ onClose }) => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBirthdays: 0,
        activeUsers: 0,
        todaysBirthdays: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                console.log('Fetching admin stats...');
                
                // Get total users
                const usersSnap = await getDocs(collection(db, 'users'));
                const totalUsers = usersSnap.size;
                console.log('Total users:', totalUsers);

                // Get total birthdays/contacts
                const contactsSnap = await getDocs(collection(db, 'contacts'));
                const totalBirthdays = contactsSnap.size;
                console.log('Total birthdays:', totalBirthdays);

                // Get today's birthdays
                const today = new Date();
                const todayMonth = today.getMonth() + 1;
                const todayDay = today.getDate();
                
                const birthdayQuery = query(
                    collection(db, 'contacts'),
                    where('birthMonth', '==', todayMonth),
                    where('birthDay', '==', todayDay)
                );
                const todaysBirthdaysSnap = await getDocs(birthdayQuery);
                console.log('Today\'s birthdays:', todaysBirthdaysSnap.size);

                // Calculate active users
                const activeUsersSet = new Set();
                contactsSnap.forEach(doc => {
                    activeUsersSet.add(doc.data().userId);
                });
                console.log('Active users:', activeUsersSet.size);

                setStats({
                    totalUsers,
                    totalBirthdays,
                    activeUsers: activeUsersSet.size,
                    todaysBirthdays: todaysBirthdaysSnap.size
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="admin-stats-modal">
                <div className="admin-stats-content">
                    <h2>Loading Statistics...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-stats-modal" onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div className="admin-stats-content">
                <h2>Admin Dashboard</h2>
                {error && <div className="error-message">{error}</div>}
                <div className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Users</h3>
                        <p className="stat-number">{stats.totalUsers}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Total Birthdays</h3>
                        <p className="stat-number">{stats.totalBirthdays}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Users</h3>
                        <p className="stat-number">{stats.activeUsers}</p>
                    </div>
                    <div className="stat-card">
                        <h3>Today's Birthdays</h3>
                        <p className="stat-number">{stats.todaysBirthdays}</p>
                    </div>
                </div>
                <button className="close-btn" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default AdminStats; 