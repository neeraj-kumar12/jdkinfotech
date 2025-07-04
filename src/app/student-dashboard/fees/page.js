'use client';
import styles from './fees.module.css';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import DynamicSidebar from '@/components/Sidebar';

export default function FeesPage() {
    // Example of how to handle different fee data scenarios
    const feeDetails = []

    const renderFeeCard = (fee) => (
        <div key={fee.id} className={styles.feeDetailsSection}>
            <h2>{fee.title}</h2>
            <div className={styles.summaryCard}>
                <h3>Fee Amount</h3>
                <span className={styles.amount}>₹{fee.amount}</span>
                <span className={`${styles.status} ${fee.status === 'Paid' ? styles.paid : styles.due}`}>
                    {fee.status}
                </span>
            </div>
        </div>
    );

    const renderEmptyState = () => (
        <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                </svg>
            </div>
            <h3>No Fees Available</h3>
            <p>There are currently no fees to display. All fees may have been settled or no fees have been assigned yet.</p>
        </div>
    );

    return (
        <div className={styles.dashboardLayout}>
            <Navbar />
            <DynamicSidebar />
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    <header className={styles.pageHeader}>
                        <h1>Fee Management</h1>
                        <p>View your fee status</p>
                    </header>

                    {/* Fee Details or Empty State */}
                    {feeDetails && feeDetails.length > 0 ? (
                        <div className={styles.feeContainer}>
                            {feeDetails.map(renderFeeCard)}
                        </div>
                    ) : (
                        renderEmptyState()
                    )}
                </div>
            </main>
        </div>
    );
}