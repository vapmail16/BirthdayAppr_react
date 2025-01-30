import React, { useState } from 'react';
import { db } from '../../utils/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

const ContactForm = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        relationship: '',
        notes: '',
        emailNotifications: true,
        reminderDays: 7
    });
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus('');

        try {
            const docRef = await addDoc(collection(db, 'contacts'), {
                ...formData,
                timestamp: new Date()
            });
            
            setStatus('Contact added successfully!');
            setFormData({
                name: '',
                email: '',
                phone: '',
                dateOfBirth: '',
                relationship: '',
                notes: '',
                emailNotifications: true,
                reminderDays: 7
            });
        } catch (error) {
            console.error('Error adding contact:', error);
            setStatus('Error adding contact. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <form id="userForm" onSubmit={handleSubmit}>
                <h2>{t('addContact')}</h2>
                <div className="form-group">
                    <label>{t('fullName')}</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>{t('email')}</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>{t('phone')}</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="1234567890"
                        pattern="[0-9]{10}"
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>{t('dateOfBirth')}</label>
                    <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>{t('relationship')}</label>
                    <select
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleChange}
                        required
                    >
                        <option value="">{t('selectRelationship')}</option>
                        <option value="family">{t('family')}</option>
                        <option value="friend">{t('friend')}</option>
                        <option value="colleague">{t('colleague')}</option>
                        <option value="work">{t('work')}</option>
                        <option value="other">{t('other')}</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>{t('notes')}</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </div>

                <div className="email-notifications">
                    <h3>{t('emailNotifications')}:</h3>
                    <div className="reminder-checkbox">
                        <input
                            type="checkbox"
                            id="emailNotifications"
                            checked={formData.emailNotifications}
                            onChange={handleChange}
                            name="emailNotifications"
                        />
                        <label htmlFor="emailNotifications">
                            {t('sendEmailRemindersForThisContactBirthday')}
                        </label>
                    </div>
                    {formData.emailNotifications && (
                        <select
                            className="reminder-select"
                            name="reminderDays"
                            value={formData.reminderDays}
                            onChange={handleChange}
                        >
                            <option value="7">{t('7DaysBefore')}</option>
                            <option value="3">{t('3DaysBefore')}</option>
                            <option value="1">{t('1DayBefore')}</option>
                            <option value="0">{t('onBirthday')}</option>
                        </select>
                    )}
                </div>

                <button type="submit" className="submit-btn">
                    {t('addContact')}
                </button>
            </form>
        </div>
    );
};

export default ContactForm; 