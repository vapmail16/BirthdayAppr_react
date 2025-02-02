import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { authService } from '../utils/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const { user } = useAuth();
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserRole = async () => {
            if (user) {
                console.log('Loading role for user:', user.email);
                // Force refresh the role from Firestore
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                const role = userSnap.data()?.role || 'user';
                console.log('Loaded role:', role);
                setUserRole(role);
            } else {
                console.log('No user found, setting role to null');
                setUserRole(null);
            }
            setLoading(false);
        };

        loadUserRole();
    }, [user]);

    const value = {
        userRole,
        loading,
        setUserRole // Export this in case we need to update the role
    };

    return (
        <UserContext.Provider value={value}>
            {!loading && children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext); 