'use client';

import styles from './exams.module.css';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import DynamicSidebar from '@/components/Sidebar';

export default function ExamsPage() {
    const examData = []; // Empty array - no exams to show

    return (
        <div className={styles.dashboardLayout}>
            <Navbar />
            <DynamicSidebar />
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    <header className={styles.pageHeader}>
                        <h1>Examination Schedule</h1>
                        <p>View your upcoming examinations and submit exam forms</p>
                    </header>

                    <div className={styles.examGrid}>
                        {examData.length > 0 ? (
                            examData.map(exam => (
                                <div key={exam.id} className={styles.examCard}>
                                    <div className={styles.examHeader}>
                                        <h3>{exam.subject}</h3>
                                        <span className={styles.examCode}>{exam.code}</span>
                                    </div>
                                    <div className={styles.examDetails}>
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>Date:</span>
                                            <span className={styles.value}>{exam.date}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>Time:</span>
                                            <span className={styles.value}>{exam.time}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>Duration:</span>
                                            <span className={styles.value}>{exam.duration}</span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>Venue:</span>
                                            <span className={styles.value}>{exam.venue}</span>
                                        </div>
                                    </div>
                                    <div className={styles.examStatus}>
                                        <span className={styles.status}>{exam.status}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>📋</div>
                                <h3>No Exams Scheduled</h3>
                                <p>There are currently no examinations scheduled. Check back later for updates.</p>
                            </div>
                        )}
                    </div>

                    <div className={styles.infoSection}>
                        <h2>Important Instructions</h2>
                        <ul className={styles.instructionList}>
                            <li>Carry your Admit Card and Student ID to the examination center</li>
                            <li>Report to the examination hall 40 minutes before the scheduled time</li>
                            <li>Electronic devices are not allowed in the examination hall</li>
                            <li>Read all questions carefully before attempting</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}