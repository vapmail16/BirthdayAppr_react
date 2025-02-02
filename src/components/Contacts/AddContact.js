import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContactManager } from '../../utils/ContactManager';

const AddContact = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialFormState);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            console.log('Submitting form data:', formData);

            const savedContact = await ContactManager.saveContact(formData);
            console.log('Contact added successfully:', savedContact);

            // Clear form and show success message
            setFormData(initialFormState);
            setSuccessMessage(t('contactAddedSuccess'));

            // Navigate immediately with refresh state
            navigate('/contacts', { 
                state: { 
                    refresh: true,
                    newContactId: savedContact.id 
                }
            });

        } catch (error) {
            console.error('Error adding contact:', error);
            setError(t('failedToAddContact'));
        }
    };

    // Rest of the component...
}; 