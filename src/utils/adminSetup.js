import { db } from './firebase';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const setAdminByEmail = async (adminEmail) => {
    try {
        // Query users collection to find user by email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', adminEmail));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            // Update user role to admin
            await updateDoc(doc(db, 'users', userDoc.id), {
                role: 'admin'
            });
            console.log('Admin role set successfully for:', adminEmail);
        } else {
            console.log('No user found with email:', adminEmail);
        }
    } catch (error) {
        console.error('Error setting admin role:', error);
    }
};

// Call this function once to set your email as admin
// setAdminByEmail('vapmail16@gmail.com'); 