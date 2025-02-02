import React, { useState, useEffect } from 'react';
import { db } from '../../utils/firebase';
import { collection, query, getDocs, orderBy, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import EditContactModal from './EditContactModal';
import Modal from '../common/Modal';
import { useTranslation } from 'react-i18next';
import { ContactManager } from '../../utils/ContactManager';
import './ContactList.css';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';

const ContactList = () => {
    const { t } = useTranslation();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRelationship, setFilterRelationship] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingContact, setEditingContact] = useState(null);
    const [selectedContacts, setSelectedContacts] = useState([]);
    const contactsPerPage = 5;
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const location = useLocation();
    const { userRole } = useUser();

    useEffect(() => {
        console.log('Location state changed:', location.state); // Debug log
        if (location.state?.refresh) {
            loadContacts();
        }
    }, [location.state]);

    useEffect(() => {
        loadContacts();
    }, []); // Initial load

    const loadContacts = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching contacts... User role:', userRole);
            const fetchedContacts = await ContactManager.getContacts();
            console.log('Raw fetched contacts:', fetchedContacts);

            if (Array.isArray(fetchedContacts)) {
                setContacts(fetchedContacts);
                console.log('Contacts set in state:', fetchedContacts.length);
            } else {
                console.error('Invalid contacts data:', fetchedContacts);
                setError(t('invalidContactsData'));
            }
        } catch (err) {
            console.error('Error loading contacts:', err);
            setError(`${t('failedToLoadContacts')}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Add this effect to monitor contacts state changes
    useEffect(() => {
        console.log('Contacts state updated:', contacts);
    }, [contacts]);

    // Filter and sort contacts
    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = !filterRelationship || contact.relationship === filterRelationship;
        return matchesSearch && matchesFilter;
    });

    // Pagination
    const indexOfLastContact = currentPage * contactsPerPage;
    const indexOfFirstContact = indexOfLastContact - contactsPerPage;
    const currentContacts = filteredContacts.slice(indexOfFirstContact, indexOfLastContact);

    // Edit contact
    const handleEdit = (contact) => {
        setEditingContact(contact);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateDoc(doc(db, 'contacts', editingContact.id), editingContact);
            setContacts(contacts.map(c => 
                c.id === editingContact.id ? editingContact : c
            ));
            setEditingContact(null);
        } catch (err) {
            console.error('Error updating contact:', err);
            setError('Failed to update contact');
        }
    };

    // Delete contact(s)
    const handleDelete = async (contactId) => {
        try {
            setError(null);
            await ContactManager.deleteContact(contactId);
            // Update local state after successful deletion
            setContacts(prevContacts => prevContacts.filter(contact => contact.id !== contactId));
            setSuccessMessage(t('contactDeletedSuccess'));
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error deleting contact:', error);
            setError(t('failedToDeleteContact'));
        }
    };

    const handleBulkDelete = () => {
        setDeleteId('bulk');
        setShowDeleteModal(true);
    };

    const confirmBulkDelete = async () => {
        try {
            setError(null);
            await Promise.all(selectedContacts.map(id => ContactManager.deleteContact(id)));
            setContacts(prevContacts => 
                prevContacts.filter(contact => !selectedContacts.includes(contact.id))
            );
            setSelectedContacts([]);
            setShowDeleteModal(false);
            setSuccessMessage(t('bulkDeleteSuccess', { count: selectedContacts.length }));
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Error deleting contacts:', err);
            setError(t('failedToDeleteContacts'));
        }
    };

    // Import/Export
    const handleExport = () => {
        const exportData = contacts.map(({ id, ...contact }) => contact);
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'contacts.json';
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const validateContact = (contact) => {
        const errors = [];
        
        // Required fields
        if (!contact.name) errors.push("Name is required");
        if (!contact.email) errors.push("Email is required");
        if (!contact.dateofbirth && !contact.dateOfBirth) errors.push("Date of Birth is required");
        
        // Email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (contact.email && !emailRegex.test(contact.email)) {
            errors.push("Invalid email format");
        }
        
        // Date format validation
        const dateStr = contact.dateofbirth || contact.dateOfBirth;
        if (dateStr) {
            // Try to parse and format the date
            try {
                let date;
                // Handle different date formats
                if (dateStr.includes('/')) {
                    const [month, day, year] = dateStr.split('/');
                    date = new Date(year, month - 1, day);
                } else if (dateStr.includes('-')) {
                    date = new Date(dateStr);
                } else {
                    throw new Error('Invalid date format');
                }

                // Check if date is valid
                if (isNaN(date.getTime())) {
                    throw new Error('Invalid date');
                }

                // Format date to YYYY-MM-DD
                const formattedDate = date.toISOString().split('T')[0];
                contact.dateOfBirth = formattedDate;
            } catch (err) {
                errors.push("Date must be in YYYY-MM-DD format");
            }
        }
        
        return errors;
    };

    // Add this helper function to check for duplicates
    const isDuplicate = (newContact, existingContacts) => {
        return existingContacts.some(existing => 
            // Check if email matches
            (existing.email.toLowerCase() === newContact.email.toLowerCase()) ||
            // Or if both name and date of birth match
            (existing.name.toLowerCase() === newContact.name.toLowerCase() && 
             existing.dateOfBirth === newContact.dateOfBirth)
        );
    };

    // Update the handleImport function
    const handleImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    let contacts;
                    const fileContent = e.target.result;
                    
                    if (file.name.endsWith('.json')) {
                        contacts = JSON.parse(fileContent);
                    } else if (file.name.endsWith('.csv')) {
                        contacts = parseCSV(fileContent);
                    } else {
                        throw new Error('Unsupported file type');
                    }

                    const validationErrors = [];
                    const validContacts = [];
                    const duplicates = [];

                    contacts.forEach((contact, index) => {
                        // Normalize date field names
                        if (contact.dateofbirth) {
                            contact.dateOfBirth = contact.dateofbirth;
                        }

                        // First check for validation errors
                        const errors = validateContact(contact);
                        if (errors.length > 0) {
                            validationErrors.push(`Row ${index + 1}: ${errors.join(', ')}`);
                            return;
                        }

                        // Then check for duplicates
                        if (isDuplicate(contact, [...validContacts, ...contacts])) {
                            duplicates.push(`Row ${index + 1}: Duplicate entry for ${contact.name} (${contact.email})`);
                            return;
                        }

                        validContacts.push(contact);
                    });

                    // Combine all errors
                    const allErrors = [...validationErrors, ...duplicates];
                    if (allErrors.length > 0) {
                        setError(`Import validation errors:\n${allErrors.join('\n')}`);
                        return;
                    }

                    // Check for duplicates with existing contacts in database
                    const existingContacts = contacts.map(doc => ({
                        ...doc.data()
                    }));

                    const duplicatesWithExisting = validContacts.filter(contact => 
                        isDuplicate(contact, existingContacts)
                    );

                    if (duplicatesWithExisting.length > 0) {
                        const duplicateErrors = duplicatesWithExisting.map(contact => 
                            `Duplicate entry found in database: ${contact.name} (${contact.email})`
                        );
                        setError(`Import validation errors:\n${duplicateErrors.join('\n')}`);
                        return;
                    }

                    // Import valid contacts
                    for (const contact of validContacts) {
                        await addDoc(collection(db, 'contacts'), {
                            name: contact.name,
                            email: contact.email,
                            phone: contact.phone || '',
                            dateOfBirth: contact.dateOfBirth,
                            relationship: contact.relationship || 'other',
                            notes: contact.notes || '',
                            emailNotifications: true,
                            reminderDays: 7,
                            timestamp: new Date()
                        });
                    }
                    
                    loadContacts();
                    setError('');
                    event.target.value = ''; // Reset file input
                    handleImportSuccess(validContacts.length);
                } catch (err) {
                    console.error('Error importing contacts:', err);
                    setError('Failed to import contacts: ' + err.message);
                }
            };
            reader.readAsText(file);
        }
    };

    const parseCSV = (csvText) => {
        const lines = csvText.split('\n');
        const headers = lines[0].toLowerCase().split(',').map(header => header.trim());
        
        return lines.slice(1)
            .filter(line => line.trim()) // Skip empty lines
            .map(line => {
                const values = line.split(',').map(value => value.trim());
                const contact = {};
                headers.forEach((header, index) => {
                    contact[header] = values[index] || '';
                });
                return contact;
            });
    };

    const getZodiacSign = (dateOfBirth) => {
        const date = new Date(dateOfBirth);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
        if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
        if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
        if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
        if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
        if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
        if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
        if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
        if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
        if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
        if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
        return "Pisces";
    };

    const calculateAge = (dateOfBirth) => {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const getDaysUntilBirthday = (dateOfBirth) => {
        const today = new Date();
        const birth = new Date(dateOfBirth);
        
        // Set this year's birthday
        const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        
        // If birthday has passed this year, set to next year
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        // Check if birthday is today
        const isToday = today.getDate() === birth.getDate() && 
                        today.getMonth() === birth.getMonth();
        
        if (isToday) {
            return 0;  // Return 0 if birthday is today
        }
        
        // Calculate days until next birthday
        const diffTime = Math.abs(nextBirthday - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Function to group contacts by month
    const groupContactsByMonth = (contacts) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        // Helper function to determine if a date is in the future
        const isUpcoming = (date) => {
            const month = date.getMonth();
            const day = date.getDate();
            return (month > currentMonth) || 
                   (month === currentMonth && day >= currentDay);
        };

        // Create groups for all months
        const groups = {};

        // Sort contacts into proper order
        contacts.forEach(contact => {
            const birthDate = new Date(contact.dateOfBirth);
            const birthMonth = birthDate.getMonth();
            const monthName = months[birthMonth];
            
            if (!groups[monthName]) {
                groups[monthName] = [];
            }
            groups[monthName].push(contact);
        });

        // Sort contacts within each month by day
        Object.keys(groups).forEach(month => {
            groups[month].sort((a, b) => {
                return new Date(a.dateOfBirth).getDate() - new Date(b.dateOfBirth).getDate();
            });
        });

        // Create ordered months starting from current month
        const upcomingMonths = months.slice(currentMonth).filter(month => groups[month]?.length > 0);
        const pastMonths = months.slice(0, currentMonth).filter(month => groups[month]?.length > 0);

        // Create final ordered groups
        const orderedGroups = {};
        
        // Add upcoming months first
        upcomingMonths.forEach(month => {
            const monthContacts = groups[month].filter(contact => 
                isUpcoming(new Date(contact.dateOfBirth))
            );
            if (monthContacts.length > 0) {
                orderedGroups[month] = monthContacts;
            }
        });

        // Add past months at the end
        [...pastMonths, ...upcomingMonths].forEach(month => {
            const monthContacts = groups[month].filter(contact => 
                !isUpcoming(new Date(contact.dateOfBirth))
            );
            if (monthContacts.length > 0) {
                orderedGroups[`${month} (Next Year)`] = monthContacts;
            }
        });

        return orderedGroups;
    };

    // Update the groupAndPaginateContacts function
    const groupAndPaginateContacts = (contacts) => {
        // First filter contacts
        const filteredContacts = contacts.filter(contact => {
            const matchesSearch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = !filterRelationship || contact.relationship === filterRelationship;
            return matchesSearch && matchesFilter;
        });

        // Group all contacts by month
        const groupedByMonth = groupContactsByMonth(filteredContacts);

        // Flatten the grouped contacts while preserving month info
        const allContactsWithMonth = Object.entries(groupedByMonth).flatMap(([month, contacts]) =>
            contacts.map(contact => ({
                ...contact,
                month
            }))
        );

        // Calculate pagination
        const totalItems = allContactsWithMonth.length;
        const totalPages = Math.ceil(totalItems / contactsPerPage);
        const startIndex = (currentPage - 1) * contactsPerPage;
        const endIndex = startIndex + contactsPerPage;
        const paginatedContacts = allContactsWithMonth.slice(startIndex, endIndex);

        // Regroup paginated contacts by month
        const paginatedGroups = paginatedContacts.reduce((acc, contact) => {
            if (!acc[contact.month]) {
                acc[contact.month] = [];
            }
            acc[contact.month].push(contact);
            return acc;
        }, {});

        return {
            groups: paginatedGroups,
            totalPages,
            totalItems
        };
    };

    // Add success modal for import
    const handleImportSuccess = (count) => {
        setSuccessMessage(`${count} ${t('importSuccess')}`);
        setShowSuccessModal(true);
    };

    if (loading) return <div className="loading">{t('loading')}</div>;
    if (error) return <div className="error-message">{error}</div>;

    const { groups: paginatedGroups, totalPages, totalItems } = groupAndPaginateContacts(contacts);

    return (
        <div className="contacts-container">
            <div className="contacts-controls">
                <input
                    type="text"
                    placeholder={t('searchContacts')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                
                <select
                    value={filterRelationship}
                    onChange={(e) => setFilterRelationship(e.target.value)}
                    className="filter-select"
                >
                    <option value="">{t('allRelationships')}</option>
                    <option value="family">{t('family')}</option>
                    <option value="friend">{t('friend')}</option>
                    <option value="work">{t('work')}</option>
                    <option value="other">{t('other')}</option>
                </select>

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                >
                    <option value="name">{t('sortByName')}</option>
                    <option value="dateOfBirth">{t('sortByDate')}</option>
                    <option value="relationship">{t('sortByRelationship')}</option>
                </select>
            </div>

            <div className="contacts-actions">
                <button 
                    onClick={handleExport} 
                    className="action-btn"
                    style={{ backgroundColor: '#FFB347', color: 'white' }}
                >
                    {t('exportContacts')}
                </button>
                <label 
                    className="action-btn"
                    style={{ display: 'inline-block', cursor: 'pointer' }}
                >
                    {t('importContacts')}
                    <input
                        type="file"
                        accept=".json,.csv"
                        onChange={handleImport}
                        style={{ display: 'none' }}
                    />
                </label>
                {selectedContacts.length > 0 && (
                    <button onClick={handleBulkDelete} className="action-btn delete">
                        {t('deleteSelected')} ({selectedContacts.length})
                    </button>
                )}
            </div>

            {totalItems === 0 ? (
                <div className="no-contacts">
                    {searchTerm || filterRelationship ? 
                        t('noMatchingContacts') : 
                        t('noContacts')}
                </div>
            ) : (
                <>
                    {Object.entries(paginatedGroups).map(([month, monthContacts]) => (
                        <div key={month} className="month-group">
                            <h2 className="month-title">{month}</h2>
                            <div className="contacts-grid">
                                {monthContacts.map(contact => (
                                    <div key={contact.id} className="contact-card">
                                        <input
                                            type="checkbox"
                                            checked={selectedContacts.includes(contact.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedContacts([...selectedContacts, contact.id]);
                                                } else {
                                                    setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                                                }
                                            }}
                                            className="contact-checkbox"
                                        />
                                        <div className="contact-info">
                                            <h3>{contact.name}</h3>
                                            <p>{contact.email}</p>
                                            <div className="contact-details">
                                                <p>
                                                    <i className="fas fa-birthday-cake"></i>
                                                    {new Date(contact.dateOfBirth).toLocaleDateString()}
                                                    <span className="age">
                                                        ({calculateAge(contact.dateOfBirth)} {t('years')})
                                                    </span>
                                                </p>
                                                <p>
                                                    <i className="fas fa-star"></i>
                                                    {t('zodiacSign')}: {getZodiacSign(contact.dateOfBirth)}
                                                </p>
                                                <p>
                                                    <i className="fas fa-clock"></i>
                                                    {getDaysUntilBirthday(contact.dateOfBirth) === 0 
                                                        ? t('birthdayToday') 
                                                        : `${getDaysUntilBirthday(contact.dateOfBirth)} ${t('daysUntil')}`
                                                    }
                                                </p>
                                            </div>
                                            <p className="relationship-tag">
                                                {t(contact.relationship.toLowerCase())}
                                            </p>
                                        </div>
                                        <div className="contact-actions">
                                            <button onClick={() => handleEdit(contact)} className="edit-btn" title={t('edit')}>
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleDelete(contact.id)} className="delete-btn" title={t('delete')}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                            >
                                {t('first')}
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                            >
                                {t('previous')}
                            </button>
                            <span className="page-info">
                                {t('page')} {currentPage} {t('of')} {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="pagination-btn"
                            >
                                {t('next')}
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="pagination-btn"
                            >
                                {t('last')}
                            </button>
                        </div>
                    )}
                </>
            )}

            {editingContact && (
                <EditContactModal
                    contact={editingContact}
                    onSave={handleUpdate}
                    onClose={() => setEditingContact(null)}
                />
            )}

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={deleteId === 'bulk' ? confirmBulkDelete : handleDelete}
                title={t('confirmDeleteTitle')}
                message={deleteId === 'bulk' 
                    ? `Are you sure you want to delete ${selectedContacts.length} contacts?`
                    : t('confirmDeleteMessage')}
                confirmText={t('delete')}
                cancelText={t('cancel')}
            />

            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                onConfirm={() => setShowSuccessModal(false)}
                title={t('successTitle')}
                message={successMessage}
                confirmText={t('ok')}
            />
        </div>
    );
};

export default ContactList; 