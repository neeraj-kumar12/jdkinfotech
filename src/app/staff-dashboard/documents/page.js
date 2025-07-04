'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './documents.module.css';
import Navbar from '@/components/Navbar';
import DynamicSidebar from '@/components/Sidebar';
import Image from 'next/image';


export default function DocumentsPage() {
    const [instituteId, setInstituteId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewTarget, setViewTarget] = useState(null);
    const [error, setError] = useState(null);
    const [documents, setDocuments] = useState({
        personalDocs: [],
        academicDocs: []
    });
    const [searchId, setSearchId] = useState('');
    const [searching, setSearching] = useState(false);
    const [studentDocs, setStudentDocs] = useState(null);
    const [studentError, setStudentError] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);
    const [studentsWithPendingDocs, setStudentsWithPendingDocs] = useState([]);
    const [verifyingDocId, setVerifyingDocId] = useState(null);
    const searchInputRef = useRef();

    // Fetch user and pending documents data
    useEffect(() => {
        const fetchUserAndDocuments = async () => {
            try {
                const [userRes, pendingRes] = await Promise.all([
                    fetch('/api/auth/current-user'),
                    fetch('/api/fetch-documents/pending')
                ]);

                if (!userRes.ok || !pendingRes.ok) {
                    throw new Error('Failed to fetch initial data');
                }

                const [userData, pendingData] = await Promise.all([
                    userRes.json(),
                    pendingRes.json()
                ]);

                setInstituteId(userData.data.instituteId);
                setStudentsWithPendingDocs(pendingData.data || []);

            } catch (error) {
                setError(error.message);
                console.error('Fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndDocuments();
    }, []);

    const fetchStudentDocuments = async (studentId) => {
        setStudentError(null);
        setStudentDocs(null);
        setSearching(true);

        // Ensure studentId is a string before trimming
        const id = String(studentId || '').trim();
        setSearchId(id);

        try {
            const res = await fetch(`/api/fetch-documents?studentId=${id}`, {
                credentials: 'include'
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message || 'No documents found');

            const docsWithUrls = {
                personalDocs: result.data.personalDocs.map(doc => ({
                    ...doc,
                    url: doc.data ? `data:${doc.contentType};base64,${doc.data}` : null
                })),
                academicDocs: result.data.academicDocs.map(doc => ({
                    ...doc,
                    url: doc.data ? `data:${doc.contentType};base64,${doc.data}` : null
                }))
            };

            setStudentDocs(docsWithUrls);
        } catch (err) {
            setStudentError(err.message);
        } finally {
            setSearching(false);
        }
    };

    const handleStudentSearch = async (e) => {
        e.preventDefault();
        const trimmedId = String(searchId || '').trim();
        if (!trimmedId) {
            setStudentError('Please enter a student ID');
            return;
        }
        await fetchStudentDocuments(trimmedId);
    };

    const handleStudentClick = (studentId) => {
        const id = String(studentId || '').trim();
        setSearchId(id);
        fetchStudentDocuments(id);
    };

    const handleVerify = async (doc, status) => {
        setVerifyingDocId(doc._id);
        try {
            const response = await fetch(`/api/fetch-documents/${doc._id}/verify`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Verification failed');

            if (searchId) {
                await fetchStudentDocuments(searchId);
            }

            setConfirmAction({
                type: status === 'Approved' ? 'approved' : 'rejected',
                message: `Document has been ${status === 'Approved' ? 'approved' : 'rejected'} successfully`
            });

        } catch (error) {
            setError(error.message);
        } finally {
            setVerifyingDocId(null);
        }
    };

    const handleView = async (doc) => {
        try {
            const response = await fetch(`/api/fetch-documents/${doc._id}`);
            if (!response.ok) throw new Error('Failed to fetch document data');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            setViewTarget({ ...doc, url });
            setShowViewModal(true);
        } catch (error) {
            setError('Preview not available');
            setShowViewModal(true);
        }
    };

    const handleDownload = async (doc) => {
        try {
            const response = await fetch(`/api/fetch-documents/${doc._id}`);
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = doc.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            setError('Failed to download document');
        }
    };

    function formatDate(dateValue) {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? dateValue : date.toLocaleDateString();
    }

    const DocumentPreview = ({ doc }) => {
        const [previewError, setPreviewError] = useState(false);

        if (doc.type === 'PDF') {
            return (
                <div className={styles.previewArea}>
                    <iframe
                        src={doc.url}
                        className={styles.pdfPreview}
                        title={`Preview of ${doc.name}`}
                        onError={() => setPreviewError(true)}
                    />
                    {previewError && (
                        <div className={styles.previewFallback}>
                            <p>PDF preview not available</p>
                            <button onClick={() => handleDownload(doc)}>
                                Download PDF
                            </button>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className={styles.previewArea}>
                {!previewError ? (
                    <Image
                        src={doc.url}
                        alt={`Preview of ${doc.name}`}
                        className={styles.imagePreview}
                        onError={() => setPreviewError(true)}
                        width={500} // Required
                        height={300} // Required
                        unoptimized={true} // Only if using external URLs
                    />
                ) : (
                    <div className={styles.previewFallback}>
                        <div className={styles.previewIcon}>🖼️</div>
                        <p>Image preview not available</p>
                        <button onClick={() => handleDownload(doc)}>
                            Download Image
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderActionButton = (doc, action) => {
        const isVerifying = verifyingDocId === doc._id;
        const isApproved = doc.status === 'Approved';
        const isRejected = doc.status === 'Rejected';

        if (action === 'approve') {
            return (
                <button
                    className={styles.approveBtn}
                    onClick={() => setConfirmAction({
                        type: 'confirm-approve',
                        doc,
                        message: 'Are you sure you want to approve this document?'
                    })}
                    disabled={isApproved || isVerifying}
                >
                    {isVerifying && verifyingDocId === doc._id && action === 'approve' ? (
                        <>
                            <span className={styles.spinner}></span> Processing...
                        </>
                    ) : (
                        '✅ Accept'
                    )}
                </button>
            );
        } else {
            return (
                <button
                    className={styles.rejectBtn}
                    onClick={() => setConfirmAction({
                        type: 'confirm-reject',
                        doc,
                        message: 'Are you sure you want to reject this document?'
                    })}
                    disabled={isRejected || isVerifying}
                >
                    {isVerifying && verifyingDocId === doc._id && action === 'reject' ? (
                        <>
                            <span className={styles.spinner}></span> Processing...
                        </>
                    ) : (
                        '❌ Reject'
                    )}
                </button>
            );
        }
    };

    if (isLoading) {
        return (
            <div className={styles.dashboardLayout}>
                <Navbar />
                <DynamicSidebar />
                <main className={styles.mainContent}>
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner}></div>
                        <p>Loading your documents...</p>
                    </div>
                </main>
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
                        <h1>Documents</h1>
                        <p>Access and manage student academic documents</p>
                    </header>

                    <div className={styles.searchContainer}>
                        <form className={styles.searchForm} onSubmit={handleStudentSearch}>
                            <input
                                type="text"
                                ref={searchInputRef}
                                value={searchId}
                                onChange={e => setSearchId(e.target.value)}
                                placeholder="Enter Student Institute ID"
                                className={styles.searchInput}
                                disabled={searching}
                            />
                            <button
                                type="submit"
                                className={styles.searchButton}
                                disabled={searching}
                            >
                                {searching ? (
                                    <>
                                        <span className={styles.spinner}></span> Searching...
                                    </>
                                ) : 'Search Student'}
                            </button>
                        </form>
                        {studentError && <p className={styles.errorMessage}>{studentError}</p>}
                    </div>

                    {/* Show pending/rejected documents list when no search is performed */}
                    {!studentDocs && studentsWithPendingDocs.length > 0 && (
                        <div className={styles.pendingStudentsSection}>
                            <h2>Students with Pending/Rejected Documents</h2>
                            <div className={styles.studentsGrid}>
                                {studentsWithPendingDocs.map(student => (
                                    <div
                                        key={student.instituteId}
                                        className={`${styles.studentCard} ${styles.clickableCard}`}
                                        onClick={() => handleStudentClick(student.instituteId)}
                                    >
                                        <div className={styles.studentInfo}>
                                            <h3>{student.name}</h3>
                                            <p className={styles.studentId}>ID: {student.instituteId}</p>
                                        </div>
                                        <div className={styles.docStats}>
                                            <div className={`${styles.statItem} ${styles.pendingStat}`}>
                                                <span className={styles.statCount}>{student.documents.pending}</span>
                                                <span className={styles.statLabel}>Pending</span>
                                            </div>
                                            <div className={`${styles.statItem} ${styles.rejectedStat}`}>
                                                <span className={styles.statCount}>{student.documents.rejected}</span>
                                                <span className={styles.statLabel}>Rejected</span>
                                            </div>
                                            <div className={`${styles.statItem} ${styles.approvedStat}`}>
                                                <span className={styles.statCount}>{student.documents.approved}</span>
                                                <span className={styles.statLabel}>Approved</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Show message when no pending/rejected documents exist */}
                    {!studentDocs && studentsWithPendingDocs.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📄</div>
                            <h3>No pending or rejected documents found</h3>
                        </div>
                    )}

                    {/* Show student documents only when searched */}
                    {studentDocs && (
                        <div className={styles.documentsGrid}>
                            <section className={styles.documentSection}>
                                <h2>Personal Documents</h2>
                                <div className={styles.documentList}>
                                    {studentDocs.personalDocs.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <div className={styles.emptyIcon}>📄</div>
                                            <h3>No Personal Documents</h3>
                                        </div>
                                    ) : (
                                        studentDocs.personalDocs.map((doc) => (
                                            <div
                                                key={`personal-${doc._id}-${doc.updatedAt}`}
                                                className={styles.documentCard}
                                            >
                                                <div className={styles.docIcon}>
                                                    {doc.type === 'PDF' ? '📄' : '🖼️'}
                                                </div>
                                                <div className={styles.docInfo}>
                                                    <h3>{doc.name}</h3>
                                                    <div className={styles.docMeta}>
                                                        <span>{doc.type}</span>
                                                        <span>{doc.size}</span>
                                                        <span>Updated: {formatDate(doc.updatedAt)}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.docActions}>
                                                    <span className={`${styles.status} ${styles[doc.status.toLowerCase()]}`}>
                                                        {doc.status}
                                                    </span>
                                                    <button
                                                        className={styles.viewBtn}
                                                        onClick={() => handleView(doc)}
                                                        title="View Document"
                                                    >
                                                        👁️ View
                                                    </button>
                                                    {renderActionButton(doc, 'approve')}
                                                    {renderActionButton(doc, 'reject')}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                            <section className={styles.documentSection}>
                                <h2>Academic Documents</h2>
                                <div className={styles.documentList}>
                                    {studentDocs.academicDocs.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <div className={styles.emptyIcon}>📄</div>
                                            <h3>No Academic Documents</h3>
                                        </div>
                                    ) : (
                                        studentDocs.academicDocs.map((doc) => (
                                            <div
                                                key={`academic-${doc._id}-${doc.updatedAt}`}
                                                className={styles.documentCard}
                                            >
                                                <div className={styles.docIcon}>
                                                    {doc.type === 'PDF' ? '📄' : '🖼️'}
                                                </div>
                                                <div className={styles.docInfo}>
                                                    <h3>{doc.name}</h3>
                                                    <div className={styles.docMeta}>
                                                        <span>{doc.type}</span>
                                                        <span>{doc.size}</span>
                                                        <span>Updated: {formatDate(doc.updatedAt)}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.docActions}>
                                                    <span className={`${styles.status} ${styles[doc.status.toLowerCase()]}`}>
                                                        {doc.status}
                                                    </span>
                                                    <button
                                                        className={styles.viewBtn}
                                                        onClick={() => handleView(doc)}
                                                        title="View Document"
                                                    >
                                                        👁️ View
                                                    </button>
                                                    {renderActionButton(doc, 'approve')}
                                                    {renderActionButton(doc, 'reject')}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>

            {/* View Document Modal */}
            {showViewModal && viewTarget && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} ${styles.viewModal} ${styles.modalAnimation}`}>
                        <div className={styles.modalHeader}>
                            <h3>Document Preview</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowViewModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <h4 className={styles.docTitle}>{viewTarget.name}</h4>
                            <div className={styles.docDetails}>
                                <div className={styles.detailRow}>
                                    <span>Type:</span> <strong>{viewTarget.type}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Size:</span> <strong>{viewTarget.size}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Updated:</span> <strong>{formatDate(viewTarget.updatedAt)}</strong>
                                </div>
                                <div className={styles.detailRow}>
                                    <span>Status:</span>
                                    <span className={`${styles.status} ${styles[viewTarget.status.toLowerCase()]}`}>
                                        {viewTarget.status}
                                    </span>
                                </div>
                            </div>

                            <DocumentPreview doc={viewTarget} />
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowViewModal(false)}
                            >
                                Close
                            </button>
                            <button
                                className={styles.downloadBtn}
                                onClick={() => handleDownload(viewTarget)}
                            >
                                📥 Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} ${styles.modalAnimation}`}>
                        <div className={styles.modalHeader}>
                            <h3>
                                {confirmAction.type === 'confirm-approve' ? 'Approve Document' :
                                    confirmAction.type === 'confirm-reject' ? 'Reject Document' :
                                        confirmAction.type === 'approved' ? 'Document Approved' : 'Document Rejected'}
                            </h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setConfirmAction(null)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <p>{confirmAction.message}</p>
                        </div>

                        <div className={styles.modalFooter}>
                            {confirmAction.type.startsWith('confirm-') ? (
                                <>
                                    <button
                                        className={styles.cancelBtn}
                                        onClick={() => setConfirmAction(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className={confirmAction.type === 'confirm-approve' ? styles.approveBtn : styles.rejectBtn}
                                        onClick={async () => {
                                            await handleVerify(
                                                confirmAction.doc,
                                                confirmAction.type === 'confirm-approve' ? 'Approved' : 'Rejected'
                                            );
                                            setConfirmAction(null);
                                        }}
                                        disabled={verifyingDocId === confirmAction.doc._id}
                                    >
                                        {verifyingDocId === confirmAction.doc._id ? (
                                            <>
                                                <span className={styles.spinner}></span> Processing...
                                            </>
                                        ) : confirmAction.type === 'confirm-approve' ? 'Approve' : 'Reject'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    className={styles.confirmBtn}
                                    onClick={() => setConfirmAction(null)}
                                >
                                    OK
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}