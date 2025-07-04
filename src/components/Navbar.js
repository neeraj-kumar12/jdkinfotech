'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Navbar.module.css';
import Link from 'next/link';

export default function Navbar() {
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [notifications, setNotifications] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await fetch('/api/auth/current-user', {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const { data } = await response.json();
                setCurrentUser(data);
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, [router]);
    // Function to calculate relative time
    const getRelativeTime = (timestamp) => {
        const now = currentTime;
        const diffInSeconds = Math.floor((now - timestamp) / 1000);

        if (diffInSeconds < 60) {
            return 'just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 604800) {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 2419200) {
            const weeks = Math.floor(diffInSeconds / 604800);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            const months = Math.floor(diffInSeconds / 2419200);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        }
    };

    // Update current time every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isNotificationOpen && !event.target.closest('.notificationBtn') && !event.target.closest('.notificationDropdown')) {
                setIsNotificationOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNotificationOpen]);

    // Get unread notification count
    const unreadCount = notifications.filter(notif => !notif.isRead).length;

    // Handle marking notification as read
    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId ? { ...notif, isRead: true } : notif
            )
        );
    };

    // For testing empty state, uncomment the line below:
    // const notifications = [];

    return (
        <header className={styles.header}>
            <div className={styles.topBar}>
                <div className={styles.container}>
                    <div className={styles.helpLinks}>
                        <a href="/help">Help</a>
                        <a href="/contact">Contact</a>
                        <a href="/faq">FAQ</a>
                    </div>
                    <div className={styles.instituteName}>
                        <Link href="/">
                            JDK Infotech Portal
                        </Link>
                    </div>
                </div>
            </div>
            <div className={styles.mainNav}>
                <div className={styles.container}>
                    <div className={styles.userSection}>
                        <button
                            className={`${styles.notificationBtn} notificationBtn`}
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span className={styles.badge}>{unreadCount}</span>
                            )}
                        </button>
                        {isNotificationOpen && (
                            <div className={`${styles.notificationDropdown} notificationDropdown`}>
                                <div className={styles.notificationHeader}>
                                    <h4>Notifications</h4>
                                    {notifications.length > 0 && unreadCount > 0 && (
                                        <button
                                            className={styles.markAllRead}
                                            onClick={() => setNotifications(prev =>
                                                prev.map(notif => ({ ...notif, isRead: true }))
                                            )}
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                <div className={styles.notificationList}>
                                    {notifications.length === 0 ? (
                                        <div className={styles.noNotifications}>
                                            <div className={styles.noNotifIcon}>📭</div>
                                            <p>No notifications</p>
                                            <span>You&apos;re all caught up!</span>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={`${styles.notificationItem} ${!notif.isRead ? styles.unread : ''}`}
                                                onClick={() => !notif.isRead && markAsRead(notif.id)}
                                            >
                                                <div className={styles.notifContent}>
                                                    <span className={styles.notifTitle}>{notif.title}</span>
                                                    <p className={styles.notifMessage}>{notif.message}</p>
                                                    <span className={styles.notifTime}>{getRelativeTime(notif.timestamp)}</span>
                                                </div>
                                                {!notif.isRead && (
                                                    <div className={styles.unreadDot}></div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{currentUser?.fullName || currentUser?.name || 'User'}</span>
                            <span className={styles.regNumber}> Email: {currentUser?.email || '404'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}