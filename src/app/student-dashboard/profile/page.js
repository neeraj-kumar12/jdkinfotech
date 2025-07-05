'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';
import Navbar from '@/components/Navbar';
import DynamicSidebar from '@/components/Sidebar';

const InfoField = ({ label, value, isEditing = false, onChange, fieldName }) => (
  <div className={styles.infoItem}>
    <label>{label}</label>
    {isEditing ? (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(fieldName, e.target.value)}
        className={styles.editInput}
      />
    ) : (
      <p>{value || 'N/A'}</p>
    )}
  </div>
);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function ProfilePage() {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/student', {
          credentials: 'include',
          cache: 'no-store'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch profile data');
        }

        const result = await response.json();
        
        if (!result.success || !result.data) {
          throw new Error(result.message || 'Invalid data received');
        }

        setStudentData(result.data);
        setEditData({
          phone: result.data.personalInfo.phone || '',
          email: result.data.personalInfo.email || '',
          emergencyContact: result.data.personalInfo.emergencyContact || '',
          address: result.data.address.address || '',
          state: result.data.address.state || '',
          pinCode: result.data.address.pinCode || ''
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.message);
        
        if (err.message.includes('auth') || err.message.includes('session') || err.message.includes('authenticated')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleFieldChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setStudentData(prev => ({
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            phone: result.data.personalInfo.phone,
            email: result.data.personalInfo.email,
            emergencyContact: result.data.personalInfo.emergencyContact
          },
          address: {
            ...prev.address,
            address: result.data.address.address,
            state: result.data.address.state,
            pinCode: result.data.address.pinCode
          }
        }));
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className={styles.errorContainer}>
        <h3>No Profile Data</h3>
        <p>We couldn&apos;t find any profile information.</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardLayout}>
      <Navbar />
      <DynamicSidebar />
      
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <header className={styles.pageHeader}>
            <div className={styles.headerContent}>
              <div className={styles.headerLeft}>
                <h1>My Profile</h1>
                <p>View and manage your profile information</p>
              </div>
            </div>
          </header>

          <div className={styles.profileContent}>
            {/* Personal Information (non-editable) */}
            <section className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <h3>Personal Information</h3>
              </div>
              <div className={styles.infoGrid}>
                <InfoField label="Full Name" value={studentData.personalInfo.fullName} />
                <InfoField label="Father's Name" value={studentData.personalInfo.fatherName} />
                <InfoField label="Mother's Name" value={studentData.personalInfo.motherName} />
                <InfoField label="Date of Birth" value={formatDate(studentData.personalInfo.dateOfBirth)} />
                <InfoField label="Gender" value={studentData.personalInfo.gender} />
                <InfoField label="Category" value={studentData.personalInfo.category} />
                <InfoField label="Blood Group" value={studentData.personalInfo.bloodGroup} />
                <InfoField label="Nationality" value={studentData.personalInfo.nationality} />
              </div>
            </section>

            {/* Contact Information (editable) */}
            <section className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <h3>Contact Information</h3>
              </div>
              <div className={styles.infoGrid}>
                <InfoField 
                  label="Phone" 
                  value={isEditing ? editData.phone : studentData.personalInfo.phone} 
                  isEditing={isEditing}
                  onChange={handleFieldChange}
                  fieldName="phone"
                />
                <InfoField 
                  label="Email" 
                  value={isEditing ? editData.email : studentData.personalInfo.email} 
                  isEditing={isEditing}
                  onChange={handleFieldChange}
                  fieldName="email"
                />
                <InfoField 
                  label="Emergency Contact" 
                  value={isEditing ? editData.emergencyContact : studentData.personalInfo.emergencyContact} 
                  isEditing={isEditing}
                  onChange={handleFieldChange}
                  fieldName="emergencyContact"
                />
              </div>
            </section>

            {/* Academic Information (non-editable) */}
            <section className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <h3>Academic Information</h3>
              </div>
              <div className={styles.infoGrid}>
                <InfoField label="Course" value={studentData.academicInfo.course} />
                <InfoField label="Session" value={studentData.academicInfo.session} />
                <InfoField label="Batch" value={studentData.academicInfo.batch} />
                <InfoField label="Institute ID" value={studentData.accountInfo.instituteId} />
              </div>
            </section>

            {/* Address (editable) */}
            <section className={styles.infoCard}>
              <div className={styles.cardHeader}>
                <h3>Address</h3>
              </div>
              <div className={styles.infoGrid}>
                <InfoField 
                  label="Address" 
                  value={isEditing ? editData.address : studentData.address.address} 
                  isEditing={isEditing}
                  onChange={handleFieldChange}
                  fieldName="address"
                />
                <InfoField 
                  label="State" 
                  value={isEditing ? editData.state : studentData.address.state} 
                  isEditing={isEditing}
                  onChange={handleFieldChange}
                  fieldName="state"
                />
                <InfoField 
                  label="PIN Code" 
                  value={isEditing ? editData.pinCode : studentData.address.pinCode} 
                  isEditing={isEditing}
                  onChange={handleFieldChange}
                  fieldName="pinCode"
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}