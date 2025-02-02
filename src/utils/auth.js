import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup,
    signOut
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc,
    updateDoc
} from 'firebase/firestore';
import { firebaseConfig } from './firebase';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Google Auth Provider with custom parameters
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    // Force account selection even when one account is available
    prompt: 'select_account'
});

export const authService = {
    // Sign in with Google
    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            console.log('User signed in:', user.email);
            
            // Check if user exists in our users collection
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            
            // Force admin for specific email
            const isAdmin = user.email === 'vapmail16@gmail.com';
            console.log('Is admin email?', isAdmin);

            if (!userSnap.exists()) {
                console.log('Creating new user with role:', isAdmin ? 'admin' : 'user');
                
                // Create new user document
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    role: isAdmin ? 'admin' : 'user',
                    createdAt: new Date().toISOString()
                });
            } else {
                const userData = userSnap.data();
                console.log('Existing user data:', userData);
                
                if (isAdmin && userData.role !== 'admin') {
                    console.log('Updating existing user to admin role');
                    await updateDoc(userRef, { 
                        role: 'admin',
                        lastUpdated: new Date().toISOString()
                    });
                }
            }

            // Verify final state
            const finalSnap = await getDoc(userRef);
            const finalData = finalSnap.data();
            console.log('Final user state:', finalData);

            return {
                ...user,
                role: isAdmin ? 'admin' : (finalData?.role || 'user')
            };
        } catch (error) {
            console.error('Google sign-in error:', error);
            throw error;
        }
    },

    // Sign out
    async signOut() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    },

    // Get current user
    getCurrentUser() {
        return auth.currentUser;
    },

    // Auth state observer
    onAuthStateChanged(callback) {
        return auth.onAuthStateChanged(callback);
    },

    async getCurrentUserRole() {
        const user = auth.currentUser;
        if (!user) {
            console.log('No current user found');
            return null;
        }
        
        console.log('Getting role for:', user.email);
        const isAdminEmail = user.email === 'vapmail16@gmail.com';
        
        if (isAdminEmail) {
            console.log('Admin email detected, forcing admin role');
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { 
                role: 'admin',
                lastUpdated: new Date().toISOString()
            });
            return 'admin';
        }
        
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log('User data from DB:', userData);
            return userData.role;
        }
        
        console.log('No user document found');
        return null;
    }
}; 