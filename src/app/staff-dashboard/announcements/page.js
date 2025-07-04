'use client';

import styles from './announcements.module.css';
import Navbar from '@/components/Navbar';
import dynamic from 'next/dynamic';
import DynamicSidebar from '@/components/Sidebar';

export default function AnnouncementsPage() {
    // Empty announcements array
    const announcements = [];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' });
        return { day, month };
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
                                <h1>Announcements</h1>
                                <p>Latest updates and information</p>
                            </div>
                        </div>
                    </header>

                    <div className={styles.announcementList}>
                        {announcements.length === 0 ? (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    📢
                                </div>
                                <h3 className={styles.emptyTitle}>No Announcements</h3>
                                <p className={styles.emptyMessage}>
                                    There are no announcements available at the moment. Check back later for updates.
                                </p>
                            </div>
                        ) : (
                            announcements.map(announcement => {
                                const { day, month } = formatDate(announcement.date);
                                return (
                                    <div key={announcement.id} className={styles.announcementCard}>
                                        <div className={styles.dateSection}>
                                            <div className={styles.date}>{day}</div>
                                            <div className={styles.month}>{month}</div>
                                        </div>
                                        <div className={styles.contentSection}>
                                            <h3 className={styles.announcementTitle}>{announcement.title}</h3>
                                            <p className={styles.announcementContent}>{announcement.content}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}