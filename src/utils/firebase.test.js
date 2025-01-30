import { db } from './firebase';
import { collection, addDoc, getDocs } from '@firebase/firestore';

// Test contact creation
const testContact = {
    name: "Test User",
    email: "test@example.com",
    dateOfBirth: "2000-01-01",
    relationship: "family"
};

// Test adding a contact
const addContact = async () => {
    try {
        const docRef = await addDoc(collection(db, 'contacts'), testContact);
        console.log("Contact added with ID: ", docRef.id);
        return docRef.id;
    } catch (e) {
        console.error("Error adding contact: ", e);
        throw e;
    }
};

// Test fetching contacts
const getContacts = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'contacts'));
        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
        });
    } catch (e) {
        console.error("Error getting contacts: ", e);
        throw e;
    }
};

// Run tests
const runTests = async () => {
    console.log("Starting Firebase integration tests...");
    
    try {
        // Test adding contact
        const contactId = await addContact();
        console.log("Add contact test: PASSED");

        // Test getting contacts
        await getContacts();
        console.log("Get contacts test: PASSED");

    } catch (error) {
        console.error("Tests failed:", error);
    }
};

export { runTests }; 