import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, orderBy, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { authService } from './auth';

export const ContactManager = {
    async saveContact(formData) {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) throw new Error('User not authenticated');

        try {
            console.log('Saving contact for user:', user.uid);
            
            // Ensure date is properly formatted
            const birthDate = new Date(formData.dateOfBirth);
            if (isNaN(birthDate.getTime())) {
                throw new Error('Invalid date format');
            }

            // Create a standardized contact structure
            const contactData = {
                name: formData.name,
                email: user.email,  // Save the creator's email
                userId: user.uid,   // Save the creator's uid
                dateOfBirth: birthDate.toISOString().split('T')[0],
                birthMonth: birthDate.getMonth() + 1,
                birthDay: birthDate.getDate(),
                relationship: formData.relationship || 'other',
                notes: formData.notes || '',
                createdAt: new Date().toISOString(),
                createdBy: {
                    uid: user.uid,
                    email: user.email
                }
            };
            
            console.log('Contact data to save:', contactData);

            const docRef = await addDoc(collection(db, 'contacts'), contactData);
            console.log('Contact saved with ID:', docRef.id);
            
            const savedContact = {
                id: docRef.id,
                ...contactData,
                isOwnContact: true
            };
            
            return savedContact;
        } catch (error) {
            console.error('Error saving contact:', error);
            throw error;
        }
    },

    async getContacts() {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) throw new Error('User not authenticated');

        try {
            console.log('Getting contacts for user:', user.uid);
            const userRole = await authService.getCurrentUserRole();
            console.log('User role:', userRole);
            let contactsQuery;

            if (userRole === 'admin') {
                console.log('Admin user, fetching all contacts');
                contactsQuery = query(
                    collection(db, 'contacts')
                );
            } else {
                console.log('Regular user, fetching user contacts');
                // Log the exact userId we're querying for
                console.log('Querying for userId:', user.uid);
                
                // First, let's get all contacts to debug
                const allContacts = await getDocs(collection(db, 'contacts'));
                const userContacts = allContacts.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }))
                    .filter(contact => contact.email === user.email || contact.userId === user.uid);
                
                console.log('Filtered user contacts:', userContacts);
                return userContacts;
            }

            const snapshot = await getDocs(contactsQuery);
            const contacts = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    isOwnContact: data.userId === user.uid || data.email === user.email
                };
            });
            
            console.log('Processed contacts:', contacts);
            return contacts;
        } catch (error) {
            console.error('Error fetching contacts:', error);
            throw error;
        }
    },

    async deleteContact(contactId) {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) throw new Error('User not authenticated');

        try {
            // First, verify that the contact belongs to the user or user is admin
            const userRole = await authService.getCurrentUserRole();
            const contactRef = doc(db, 'contacts', contactId);
            const contactSnap = await getDoc(contactRef);

            if (!contactSnap.exists()) {
                throw new Error('Contact not found');
            }

            const contactData = contactSnap.data();
            if (userRole !== 'admin' && contactData.userId !== user.uid) {
                throw new Error('Not authorized to delete this contact');
            }

            await deleteDoc(contactRef);
            console.log('Contact deleted successfully:', contactId);
            return true; // Return success
        } catch (error) {
            console.error('Error deleting contact:', error);
            throw error;
        }
    }
}; 