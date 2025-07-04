'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './dashboard.module.css';
import Navbar from '@/components/Navbar';
import Holidays from 'date-holidays';
import { useRouter } from 'next/navigation';
import DynamicSidebar from '@/components/Sidebar';

export default function StudentDashboard() {
  const [instituteStatus, setInstituteStatus] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [unverifiedStudents, setUnverifiedStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [currentActionStudent, setCurrentActionStudent] = useState(null);
  const router = useRouter();

  // Enhanced API fetch with better error handling
  const apiFetch = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Institute hours management
  const checkInstituteStatus = useCallback((checkTime = new Date()) => {
    const hd = new Holidays('IN');
    const day = checkTime.getDay();
    const hour = checkTime.getHours();
    const minutes = checkTime.getMinutes();
    const currentMinutes = hour * 60 + minutes;

    // Check if it's a holiday
    const holidayInfo = hd.isHoliday(checkTime);
    if (holidayInfo) return { isOpen: false, holiday: holidayInfo };

    // Check if it's Sunday
    if (day === 0) return { isOpen: false };

    // Check working hours (8am to 6pm)
    const isOpen = currentMinutes >= 8 * 60 && currentMinutes < 18 * 60;
    return { isOpen };
  }, []);

  // Time and status updates
  useEffect(() => {
    setIsClient(true);
    const updateStatus = () => {
      const now = new Date();
      setCurrentTime(now);
      const status = checkInstituteStatus(now);
      setInstituteStatus(status.isOpen);
    };
    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [checkInstituteStatus]);

  // Current holiday check
  const getCurrentHoliday = useCallback(() => {
    if (!isClient) return null;
    const hd = new Holidays('IN');
    const holiday = hd.isHoliday(new Date());
    return holiday ? (Array.isArray(holiday) ? holiday[0] : holiday) : null;
  }, [isClient]);

  // Fetch current user with error handling
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const data = await apiFetch('/api/auth/current-user');
        setCurrentUser(data.data);

        if (!data.data || data.data.role !== 'staff') {
          router.replace(data.data?.role === 'student' ? '/student-dashboard' : '/login');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setError('Authentication failed. Redirecting to login...');
        setTimeout(() => router.replace('/login'), 2000);
      }
    };

    fetchCurrentUser();
  }, [router]);

  const fetchUnverifiedStudents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/api/students?isVerified=false&limit=20`);
      setUnverifiedStudents(Array.isArray(data.students) ? data.students.slice(0, 20) : []);
    } catch (err) {
      console.error(`Failed to fetch students:`, err);
      setError(`Failed to load students: ${err.message}`);
      setUnverifiedStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle student acceptance
  const handleAccept = async (studentId) => {
    if (!studentId) {
      setError('Invalid student ID');
      return;
    }

    setActionLoading(prev => ({ ...prev, [studentId]: 'accepting' }));
    setError(null);

    try {
      await apiFetch(`/api/students/${studentId}/verify`, { method: 'PATCH' });
      setUnverifiedStudents(prev => prev.filter(s => s._id !== studentId));
      setSuccessMessage('Student verified successfully!');
      setShowAcceptModal(false);
    } catch (err) {
      console.error('Verification error:', err);
      setError(`Failed to verify student: ${err.message}`);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[studentId];
        return newState;
      });
    }
  };

  // Handle student rejection
  const handleReject = async (studentId) => {
    if (!studentId) {
      setError('Invalid student ID');
      return;
    }

    setActionLoading(prev => ({ ...prev, [studentId]: 'rejecting' }));
    setError(null);

    try {
      await apiFetch(`/api/students/${studentId}`, { method: 'DELETE' });
      setUnverifiedStudents(prev => prev.filter(s => s._id !== studentId));
      setSuccessMessage('Student rejected successfully.');
      setShowRejectModal(false);
    } catch (err) {
      console.error('Rejection error:', err);
      setError(`Failed to reject student: ${err.message}`);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[studentId];
        return newState;
      });
    }
  };

  // Handle view student details
  const handleView = async (student) => {
    if (!student?._id) {
      setError('Invalid student data');
      return;
    }

    setLoadingStudent(true);
    setError(null);

    try {
      const result = await apiFetch(`/api/students/${student._id}`);
      setSelectedStudent(result.data);
    } catch (err) {
      console.error('View student error:', err);
      showError(`Failed to load student: ${err.message}`);
      setSelectedStudent(null);
    } finally {
      setLoadingStudent(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUnverifiedStudents();
  }, [fetchUnverifiedStudents]);

  // Student card component
  const StudentCard = ({ student }) => {
    if (!student) return null;

    return (
      <div className={styles.studentCard}>
        <div className={styles.studentInfo}>
          <h3 className={styles.studentName}>{student.fullName || 'Unknown Name'}</h3>
          <p className={styles.studentEmail}>{student.email || 'No email provided'}</p>
          <p className={styles.studentDetails}>
            {student.course || 'Unknown Course'} - {student.session || ''}, {student.batch || 'Unknown Session'}
          </p>
          {student.instituteId && (
            <p className={styles.instituteId}>ID: {student.instituteId}</p>
          )}
        </div>
        <div className={styles.actionButtons}>
          <button
            className={styles.viewBtn}
            onClick={() => handleView(student)}  // Pass the student object
            disabled={loadingStudent || !student._id}
          >
            {loadingStudent ? 'Loading...' : 'View Details'}
          </button>
          <button
            className={styles.acceptBtn}
            onClick={() => {
              setCurrentActionStudent(student);
              setShowAcceptModal(true);
            }}
            disabled={actionLoading[student._id] || !student._id}
          >
            {actionLoading[student._id] === 'accepting' ? 'Accepting...' : 'Accept'}
          </button>
          <button
            className={styles.rejectBtn}
            onClick={() => {
              setCurrentActionStudent(student);
              setShowRejectModal(true);
            }}
            disabled={actionLoading[student._id] || !student._id}
          >
            {actionLoading[student._id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.dashboardLayout}>
      <Navbar />
      <DynamicSidebar />
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <header className={styles.pageHeader}>
            <div className={styles.userInfo}>
              <h1>Dashboard</h1>
              <p>Welcome, {currentUser?.fullName || currentUser?.name || 'User'}!</p>
              <small className={styles.currentTime}>
                {isClient ? currentTime.toLocaleString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Loading...'}
              </small>
            </div>
            <div className={styles.instituteStatus}>
              <div className={styles.statusContainer}>
                {instituteStatus ? (
                  <span className={styles.open}>Institute Open</span>
                ) : (
                  <span className={styles.closed}>Institute Closed</span>
                )}

              </div>
            </div>
          </header>

          <section>
            <div className={styles.sectionHeader}>
              <h2>Student Verification Requests</h2>
              <button
                className={styles.refreshBtn}
                onClick={fetchUnverifiedStudents}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {successMessage && (
              <div className={styles.messageSuccess}>
                <p>{successMessage}</p>
                <button
                  className={styles.clearMessageBtn}
                  onClick={() => setSuccessMessage(null)}
                >
                  ✕
                </button>
              </div>
            )}

            {error && (
              <div className={styles.messageError}>
                <p>{error}</p>
                <button
                  className={styles.clearMessageBtn}
                  onClick={clearError}
                >
                  ✕
                </button>
              </div>
            )}

            {loading ? (
              <div className={styles.loadingContainer}>
                <p>Loading verification requests...</p>
              </div>
            ) : unverifiedStudents.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No pending verifications.</p>
              </div>
            ) : (
              <div className={styles.studentGrid}>
                {unverifiedStudents.slice(0, 20).map(student => (
                  <StudentCard
                    key={student._id} // Never use Math.random() for keys!
                    student={student}
                    onView={() => handleView(student)}
                    onAccept={() => {
                      setCurrentActionStudent(student);
                      setShowAcceptModal(true);
                    }}
                    onReject={() => {
                      setCurrentActionStudent(student);
                      setShowRejectModal(true);
                    }}
                    loadingState={actionLoading[student._id]}
                  />
                ))}
              </div>
            )}

            {/* Student Details Modal */}
            {selectedStudent && (
              <div className={styles.modalOverlay} onClick={() => setSelectedStudent(null)}>
                <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <h3>{selectedStudent.fullName || 'Student Details'}</h3>
                    <button
                      className={styles.closeBtn}
                      onClick={() => setSelectedStudent(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className={styles.modalContent}>
                    <div className={styles.studentProfileHeader}>
                      <div className={styles.profileSummary}>
                        <div className={styles.profileField}>
                          <span className={styles.fieldLabel}>Course:</span>
                          <span className={styles.fieldValue}>{selectedStudent.course || 'N/A'}</span>
                        </div>
                        <div className={styles.profileField}>
                          <span className={styles.fieldLabel}>Session:</span>
                          <span className={styles.fieldValue}>{selectedStudent.session || ''}, {selectedStudent.batch || 'N/A'}</span>
                        </div>
                        <div className={styles.profileField}>
                          <span className={styles.fieldLabel}>Institute ID:</span>
                          <span className={styles.fieldValue}>{selectedStudent.instituteId || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.infoTabs}>
                      <div className={styles.infoTab}>
                        <h4 className={styles.tabHeader}>Personal Information</h4>
                        <div className={styles.infoGrid}>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Father&apos;s Name:</span>
                            <span className={styles.fieldValue}>{selectedStudent.fatherName || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Mother&apos;s Name:</span>
                            <span className={styles.fieldValue}>{selectedStudent.motherName || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Date of Birth:</span>
                            <span className={styles.fieldValue}>
                              {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'}
                            </span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Gender:</span>
                            <span className={styles.fieldValue}>{selectedStudent.gender || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Category:</span>
                            <span className={styles.fieldValue}>{selectedStudent.category || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Blood Group:</span>
                            <span className={styles.fieldValue}>{selectedStudent.bloodGroup || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Nationality:</span>
                            <span className={styles.fieldValue}>{selectedStudent.nationality || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.infoTab}>
                        <h4 className={styles.tabHeader}>Contact Information</h4>
                        <div className={styles.infoGrid}>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Phone:</span>
                            <span className={styles.fieldValue}>{selectedStudent.phone || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Email:</span>
                            <span className={styles.fieldValue}>{selectedStudent.email || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Emergency Contact:</span>
                            <span className={styles.fieldValue}>{selectedStudent.emergencyContact || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Address:</span>
                            <span className={styles.fieldValue}>{selectedStudent.address || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>State:</span>
                            <span className={styles.fieldValue}>{selectedStudent.state || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>PIN Code:</span>
                            <span className={styles.fieldValue}>{selectedStudent.pinCode || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.infoTab}>
                        <h4 className={styles.tabHeader}>Academic Information</h4>
                        <div className={styles.infoGrid}>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Course:</span>
                            <span className={styles.fieldValue}>{selectedStudent.course || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Session:</span>
                            <span className={styles.fieldValue}>{selectedStudent.session || 'N/A'}</span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Batch:</span>
                            <span className={styles.fieldValue}>{selectedStudent.batch || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.infoTab}>
                        <h4 className={styles.tabHeader}>Status</h4>
                        <div className={styles.infoGrid}>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Verified:</span>
                            <span className={styles.fieldValue}>
                              {selectedStudent.isVerified ? (
                                <span className={styles.verifiedBadge}>Yes</span>
                              ) : (
                                <span className={styles.unverifiedBadge}>No</span>
                              )}
                            </span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Active:</span>
                            <span className={styles.fieldValue}>
                              {selectedStudent.isActive ? (
                                <span className={styles.activeBadge}>Yes</span>
                              ) : (
                                <span className={styles.inactiveBadge}>No</span>
                              )}
                            </span>
                          </div>
                          <div className={styles.infoField}>
                            <span className={styles.fieldLabel}>Registration Date:</span>
                            <span className={styles.fieldValue}>
                              {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Accept Confirmation Modal */}
            {showAcceptModal && currentActionStudent && (
              <div className={styles.confirmModalOverlay}>
                <div className={styles.confirmModal}>
                  <h3>Confirm Verification</h3>
                  <p>
                    Are you sure you want to verify {currentActionStudent.fullName || 'this student'}?
                    This will grant them full access to the system.
                  </p>
                  <div className={styles.confirmButtons}>
                    <button
                      className={styles.confirmCancel}
                      onClick={() => setShowAcceptModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.confirmAccept}
                      onClick={() => handleAccept(currentActionStudent._id)}
                      disabled={actionLoading[currentActionStudent._id]}
                    >
                      {actionLoading[currentActionStudent._id] === 'accepting' ? 'Verifying...' : 'Verify Student'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reject Confirmation Modal */}
            {showRejectModal && currentActionStudent && (
              <div className={styles.confirmModalOverlay}>
                <div className={styles.confirmModal}>
                  <h3>Confirm Rejection</h3>
                  <p>
                    Are you sure you want to reject {currentActionStudent.fullName || 'this student'}?
                    This action cannot be undone and will delete their registration.
                  </p>
                  <div className={styles.confirmButtons}>
                    <button
                      className={styles.confirmCancel}
                      onClick={() => setShowRejectModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.confirmReject}
                      onClick={() => handleReject(currentActionStudent._id)}
                      disabled={actionLoading[currentActionStudent._id]}
                    >
                      {actionLoading[currentActionStudent._id] === 'rejecting' ? 'Rejecting...' : 'Reject Student'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}