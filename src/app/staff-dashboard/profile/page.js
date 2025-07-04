'use client';
import { useState } from 'react';
import styles from './profile.module.css';
import Navbar from '@/components/Navbar';
import DynamicSidebar from '@/components/Sidebar';

export default function ProfilePage() {
    const [searchId, setSearchId] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchId.trim()) return;

        setLoading(true);
        setError(null);
        setStudentData(null);

        try {
            const response = await fetch(`/api/students-profile/${searchId}`, {
                cache: 'no-store'
            });

            const result = await response.json();
            
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Student not found');
            }

            setStudentData(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const InfoField = ({ label, value }) => (
        <div className={styles.infoItem}>
            <label>{label}</label>
            <p>{value || 'N/A'}</p>
        </div>
    );

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.dashboardLayout}>
            <Navbar />
            <DynamicSidebar />
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    <header className={styles.pageHeader}>
                        <div className={styles.headerContent}>
                            <div className={styles.headerLeft}>
                                <h1>
                                    {studentData
                                        ? `Student Profile: ${studentData.fullName}`
                                        : 'Search Student Profile'}
                                </h1>
                                <p>Enter student ID to view profile information</p>
                            </div>
                        </div>
                    </header>

                    <div className={styles.searchContainer}>
                        <form className={styles.searchForm} onSubmit={handleSearch}>
                            <input
                                type="text"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                placeholder="Enter Student Institute ID (e.g. 123456)"
                                className={styles.searchInput}
                            />
                            <button
                                type="submit"
                                className={styles.searchButton}
                                disabled={loading}
                            >
                                {loading ? 'Searching...' : 'Search Student'}
                            </button>
                        </form>
                        {error && <p className={styles.errorMessage}>{error}</p>}
                    </div>

                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                            <p>Loading student data...</p>
                        </div>
                    ) : studentData ? (
                        <div className={styles.profileContent}>
                            <section className={styles.infoCard}>
                                <div className={styles.cardHeader}>
                                    <h3>Personal Information</h3>
                                </div>
                                <div className={styles.infoGrid}>
                                    <InfoField label="Full Name" value={studentData.fullName} />
                                    <InfoField label="Father's Name" value={studentData.fatherName} />
                                    <InfoField label="Mother's Name" value={studentData.motherName} />
                                    <InfoField label="Date of Birth" value={formatDate(studentData.dateOfBirth)} />
                                    <InfoField label="Gender" value={studentData.gender} />
                                </div>
                            </section>

                            <section className={styles.infoCard}>
                                <div className={styles.cardHeader}>
                                    <h3>Contact Information</h3>
                                </div>
                                <div className={styles.infoGrid}>
                                    <InfoField label="Phone" value={studentData.phone} />
                                    <InfoField label="Email" value={studentData.email} />
                                    <InfoField label="Emergency Contact" value={studentData.emergencyContact} />
                                </div>
                            </section>

                            <section className={styles.infoCard}>
                                <div className={styles.cardHeader}>
                                    <h3>Academic Information</h3>
                                </div>
                                <div className={styles.infoGrid}>
                                    <InfoField label="Course" value={studentData.course} />
                                    <InfoField label="Session" value={studentData.session} />
                                    <InfoField label="Batch" value={studentData.batch} />
                                    <InfoField label="Institute ID" value={studentData.instituteId} />
                                </div>
                            </section>

                            <section className={styles.infoCard}>
                                <div className={styles.cardHeader}>
                                    <h3>Address</h3>
                                </div>
                                <div className={styles.addressGrid}>
                                    <InfoField label="Address" value={studentData.address} />
                                    <InfoField label="State" value={studentData.state} />
                                    <InfoField label="PIN Code" value={studentData.pinCode} />
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className={styles.noData}>
                            <p>{error ? error : 'No student data found. Please search for a student ID.'}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}