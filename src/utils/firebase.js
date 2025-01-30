import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBo3O7Nb5ghRwB40Ke0VslmrsLjlTh_cws",
    authDomain: "birthdayapp-7d373.firebaseapp.com",
    projectId: "birthdayapp-7d373",
    storageBucket: "birthdayapp-7d373.appspot.com",
    messagingSenderId: "7482442190",
    appId: "1:7482442190:web:38c4dd8573b2578e07eb9f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 