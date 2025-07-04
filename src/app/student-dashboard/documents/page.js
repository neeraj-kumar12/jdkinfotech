'use client';

import { useState, useEffect } from 'react';
import styles from './documents.module.css';
import Navbar from '@/components/Navbar';
import DynamicSidebar from '@/components/Sidebar';
import Image from 'next/image';


export default function DocumentsPage() {
    const [instituteId, setInstituteId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadCategory, setUploadCategory] = useState('');
    const [customFileName, setCustomFileName] = useState('');
    const [duplicateInfo, setDuplicateInfo] = useState(null);
    const [error, setError] = useState(null);
    const [documents, setDocuments] = useState({
        personalDocs: [],
        academicDocs: []
    });
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch user and documents data
    useEffect(() => {
        const fetchUserAndDocuments = async () => {
            try {
                const [userRes, docsRes] = await Promise.all([
                    fetch('/api/auth/current-user'),
                    fetch('/api/documents')
                ]);

                if (!userRes.ok || !docsRes.ok) {
                    throw new Error(userRes.ok ? 'Failed to fetch documents' : 'Failed to fetch user data');
                }

                const [userData, docsData] = await Promise.all([
                    userRes.json(),
                    docsRes.json()
                ]);

                setInstituteId(userData.data.instituteId);

                // Create object URLs for preview
                const docsWithUrls = docsData.data.map(doc => ({
                    ...doc,
                    url: doc.data ? `data:${doc.contentType};base64,${doc.data}` : null
                }));

                setDocuments({
                    personalDocs: docsWithUrls.filter(doc => doc.category === 'personal'),
                    academicDocs: docsWithUrls.filter(doc => doc.category === 'academic')
                });
            } catch (error) {
                setError(error.message);
                console.error('Fetch error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserAndDocuments();
    }, []);

    // Clean up object URLs
    useEffect(() => {
        return () => {
            documents.personalDocs.concat(documents.academicDocs).forEach(doc => {
                if (doc.url) URL.revokeObjectURL(doc.url);
            });
        };
    }, [documents]);

    // Check for duplicate documents
    const checkForDuplicate = (file, customName) => {
        const fileExtension = file.name.split('.').pop();
        const proposedName = `${customName.trim()}.${fileExtension}`;
        const fileSize = `${Math.round(file.size / 1024)} KB`;
        const fileType = file.type.includes('pdf') ? 'PDF' : 'Image';

        const allDocs = [...documents.personalDocs, ...documents.academicDocs];

        // Check for exact filename match
        const nameDuplicate = allDocs.find(doc =>
            doc.name.toLowerCase() === proposedName.toLowerCase()
        );

        // Check for similar files (same size and type)
        const similarFiles = allDocs.filter(doc =>
            doc.size === fileSize && doc.type === fileType
        );

        return {
            isExactDuplicate: !!nameDuplicate,
            similarDocuments: similarFiles,
            proposedName
        };
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check file size (1.5MB limit)
            if (file.size > 1.5 * 1024 * 1024) {
                alert('File size must be under 1.5MB');
                return;
            }

            // Check file type - only PDF, JPG, PNG allowed
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('Only PDF, JPG, and PNG files are allowed');
                return;
            }

            setUploadFile(file);
            setCustomFileName(file.name.split('.')[0]);
            setShowUploadModal(true);
        }
    };

    const confirmUpload = () => {
        if (!uploadFile || !uploadCategory || !customFileName.trim()) return;

        const fileExtension = uploadFile.name.split('.').pop();
        const proposedName = `${customFileName.trim()}.${fileExtension}`;

        // Check against all existing documents
        const allDocs = [...documents.personalDocs, ...documents.academicDocs];
        const isDuplicate = allDocs.some(doc =>
            doc.name.toLowerCase() === proposedName.toLowerCase()
        );

        if (isDuplicate) {
            setError('A document with this exact name already exists. Please choose a different name.');
            return;
        }

        // If no duplicates, proceed with upload
        proceedWithUpload();
    };
    const proceedWithUpload = async () => {
        if (!instituteId || !uploadFile) return;
        setError(null); // Clear previous error
        setIsUploading(true);
        try {
            // Convert file to base64
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(uploadFile);
            });

            const fileExtension = uploadFile.name.split('.').pop();
            const finalFileName = `${customFileName.trim()}.${fileExtension}`;
            const now = new Date();

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: finalFileName,
                    type: uploadFile.type.includes('pdf') ? 'PDF' : 'Image',
                    size: `${Math.round(uploadFile.size / 1024)} KB`,
                    data: base64Data,
                    contentType: uploadFile.type,
                    instituteId,
                    category: uploadCategory === 'personalDocs' ? 'personal' : 'academic',
                    updatedAt: now.toISOString()
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                setError(result.message || 'Upload failed');
                return;
            }

            setDocuments(prev => ({
                ...prev,
                [uploadCategory]: [...prev[uploadCategory], {
                    ...result.data,
                    url: URL.createObjectURL(uploadFile),
                    updatedAt: new Date(result.data.updatedAt).toLocaleDateString(),
                    status: "Pending"
                }]
            }));

            setShowUploadModal(false);
            setShowDuplicateModal(false);
            setUploadFile(null);
            setUploadCategory('');
            setCustomFileName('');
            setError(null);
        } catch (error) {
            setError('Failed to upload document');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = (docId, category) => {
        setDeleteTarget({ docId, category });
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/documents/${deleteTarget.docId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setDocuments(prev => ({
                    ...prev,
                    [deleteTarget.category]: prev[deleteTarget.category].filter(doc => doc._id !== deleteTarget.docId)
                }));
            }
        } catch (error) {
            console.error('Delete failed:', error);
            setError('Failed to delete document');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeleteTarget(null);
        }
    };

    const handleView = (doc) => {
        setViewTarget(doc);
        setShowViewModal(true);
    };

    const handleDownload = async (doc) => {
        try {
            const response = await fetch(`/api/documents/${doc._id}`);
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

    const closeModal = (modalSetter) => {
        modalSetter(false);
        if (modalSetter === setShowUploadModal) {
            setUploadFile(null);
            setUploadCategory('');
            setCustomFileName('');
        }
        if (modalSetter === setShowDuplicateModal) {
            setDuplicateInfo(null);
        }
        setError(null);
    };

    // Helper to safely format dates
    function formatDate(dateValue) {
        if (!dateValue) return '';
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? dateValue : date.toLocaleDateString();
    }

    // Document Preview Component
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
                        width={500}  // Required - set to your desired display width
                        height={300} // Required - set to your desired display height
                        className={styles.imagePreview}
                        onError={() => setPreviewError(true)}
                        quality={85} // Optional (default 75)
                        priority={false} // Set true if above the fold
                        unoptimized={process.env.NODE_ENV !== 'production'} // Optional
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

    // Empty State Component
    const EmptyState = ({ category }) => (
        <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📄</div>
            <h3>No {category === 'personal' ? 'Personal' : 'Academic'} Documents</h3>
            <p>Upload your first {category === 'personal' ? 'personal' : 'academic'} document to get started</p>
            <button
                onClick={() => document.getElementById('file-upload').click()}
                className={styles.uploadFromEmpty}
            >
                Upload Document
            </button>
        </div>
    );

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
                        <p>Access and manage your academic documents</p>
                    </header>

                    <div className={styles.uploadSection}>
                        <input
                            type="file"
                            id="file-upload"
                            style={{ display: 'none' }}
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                        />
                        <label htmlFor="file-upload" className={styles.uploadBtn}>
                            <span className={styles.icon}>📤</span>
                            Upload New Document
                        </label>
                        <p className={styles.uploadInfo}>
                            Supported formats: PDF, JPG, PNG (Max size: 1.5MB)
                        </p>
                    </div>

                    <div className={styles.documentsGrid}>
                        <section className={styles.documentSection}>
                            <h2>Personal Documents</h2>
                            <div className={styles.documentList}>
                                {documents.personalDocs.length === 0 ? (
                                    <EmptyState category="personal" />
                                ) : (
                                    documents.personalDocs.map((doc) => (
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
                                                <button
                                                    className={styles.downloadBtn}
                                                    onClick={() => handleDownload(doc)}
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDelete(doc._id, 'personalDocs')}
                                                    title="Delete Document"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className={styles.documentSection}>
                            <h2>Academic Documents</h2>
                            <div className={styles.documentList}>
                                {documents.academicDocs.length === 0 ? (
                                    <EmptyState category="academic" />
                                ) : (
                                    documents.academicDocs.map((doc) => (
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
                                                <button
                                                    className={styles.downloadBtn}
                                                    onClick={() => handleDownload(doc)}
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDelete(doc._id, 'academicDocs')}
                                                    title="Delete Document"
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} ${styles.modalAnimation}`}>
                        <div className={styles.modalHeader}>
                            <h3>Upload Document</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => closeModal(setShowUploadModal)}
                                disabled={isUploading}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.fileInfo}>
                                <p><strong>Original File:</strong> {uploadFile?.name}</p>
                                <p><strong>Size:</strong> {uploadFile && Math.round(uploadFile.size / 1024)} KB</p>
                                <p><strong>Type:</strong> {uploadFile?.type}</p>
                            </div>

                            <div className={styles.nameSection}>
                                <label className={styles.sectionLabel}>Document Name</label>
                                <input
                                    type="text"
                                    className={styles.nameInput}
                                    value={customFileName}
                                    onChange={(e) => setCustomFileName(e.target.value)}
                                    placeholder="Enter document name"
                                    maxLength={100}
                                    disabled={isUploading}
                                />
                                <p className={styles.nameHint}>
                                    File extension will be added automatically
                                </p>

                            </div>
                            {error && (
                                <div className={styles.duplicateError}>
                                    <div className={styles.errorIcon}>⚠️</div>
                                    <div className={styles.errorText}>
                                        <p>{error}</p>
                                    </div>
                                    <button
                                        className={styles.dismissError}
                                        onClick={() => setError(null)}
                                    >
                                        &times;
                                    </button>
                                </div>
                            )}
                            <div className={styles.categorySection}>
                                <label className={styles.sectionLabel}>Document Category</label>
                                <div className={styles.radioGroup}>
                                    <label className={styles.radioLabel}>
                                        <input
                                            type="radio"
                                            name="category"
                                            value="personalDocs"
                                            checked={uploadCategory === 'personalDocs'}
                                            onChange={(e) => setUploadCategory(e.target.value)}
                                            disabled={isUploading}
                                        />
                                        Personal Document
                                    </label>
                                    <label className={styles.radioLabel}>
                                        <input
                                            type="radio"
                                            name="category"
                                            value="academicDocs"
                                            checked={uploadCategory === 'academicDocs'}
                                            onChange={(e) => setUploadCategory(e.target.value)}
                                            disabled={isUploading}
                                        />
                                        Academic Document
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => closeModal(setShowUploadModal)}
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.confirmBtn}
                                onClick={confirmUpload}
                                disabled={!uploadCategory || !customFileName.trim() || isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Duplicate Detection Modal */}
            {showDuplicateModal && duplicateInfo && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} ${styles.modalAnimation}`}>
                        <div className={styles.modalHeader}>
                            <div className={styles.warningIcon}>⚠️</div>
                            <h3>Similar Documents Found</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => closeModal(setShowDuplicateModal)}
                                disabled={isUploading}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.duplicateWarning}>
                                <p className={styles.warningText}>
                                    We found {duplicateInfo.similarDocs.length} similar document(s) in your collection:
                                </p>

                                <div className={styles.duplicateComparison}>
                                    <div className={styles.existingDoc}>
                                        <h4>Existing Document:</h4>
                                        <p><strong>Name:</strong> {duplicateInfo.similarDocs[0].name}</p>
                                        <p><strong>Type:</strong> {duplicateInfo.similarDocs[0].type}</p>
                                        <p><strong>Size:</strong> {duplicateInfo.similarDocs[0].size}</p>
                                        <p><strong>Updated:</strong> {new Date(duplicateInfo.similarDocs[0].updatedAt).toLocaleDateString()}</p>
                                    </div>

                                    <div className={styles.newDoc}>
                                        <h4>New Document:</h4>
                                        <p><strong>Name:</strong> {duplicateInfo.proposedName}</p>
                                        <p><strong>Type:</strong> {duplicateInfo.newFile.type.includes('pdf') ? 'PDF' : 'JPG/PNG'}</p>
                                        <p><strong>Size:</strong> {Math.round(duplicateInfo.newFile.size / 1024)} KB</p>
                                        <p><strong>Category:</strong> {duplicateInfo.category === 'personalDocs' ? 'Personal' : 'Academic'}</p>
                                    </div>
                                </div>

                                <div className={styles.renameOption}>
                                    <label>You can rename your new document:</label>
                                    <div className={styles.renameInputWrapper}>
                                        <input
                                            type="text"
                                            value={customFileName}
                                            onChange={(e) => setCustomFileName(e.target.value)}
                                            disabled={isUploading}
                                            className={styles.renameInput}
                                        />
                                        <span className={styles.fileExtension}>
                                            .{duplicateInfo.newFile.name.split('.').pop()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => closeModal(setShowDuplicateModal)}
                                disabled={isUploading}
                            >
                                Cancel Upload
                            </button>
                            <button
                                className={styles.confirmBtn}
                                onClick={proceedWithUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload Anyway'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} ${styles.modalAnimation}`}>
                        <div className={styles.modalHeader}>
                            <div className={styles.warningIcon}>⚠️</div>
                            <h3>Delete Document</h3>
                            <button
                                className={styles.closeBtn}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                ✕
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.warningText}>
                                Are you sure you want to delete this document? This action cannot be undone and will permanently remove the document from your account.
                            </p>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.deleteConfirmBtn}
                                onClick={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
}