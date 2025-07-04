'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import styles from './login.module.css';

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        // Check if already logged in
        fetch('/api/auth/current-user')
            .then(res => res.json())
            .then(data => {
                if (data?.success && data?.data?.role === 'staff') {
                    router.push('/staff-dashboard');
                } else if (data?.success && data?.data?.role === 'student') {
                    router.push('/student-dashboard');
                }
            });
    }, [router]);  // Safe to keep empty if using router.push

    // Notice data array
    const notices = [
    ];

    return (
        <div className={styles.loginContainer}>
            <div className={styles.header}>
                <div className={styles.logoSection}>
                    <h1>BCEI Institute Portal</h1>
                </div>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.loginBox}>
                    <h2>Sign Into Student Portal</h2>
                    <AuthForm type="login" />
                    <div className={styles.helpLinks}>
                        <a href="/forgot-password">Forgot Password?</a>
                        <a href="/register">New Registration</a>
                    </div>
                    <div className={styles.notice}>
                        Note: Students must log in with their registration number and password.
                    </div>
                </div>

                <div className={styles.announcements}>
                    <h3>Important Notices</h3>
                    {notices.length > 0 ? (
                        <div className={styles.noticeList}>
                            {notices.map((notice) => (
                                <div key={notice.id} className={styles.noticeItem}>
                                    <span className={styles.date}>{notice.date}</span>
                                    <p>{notice.message}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📢</div>
                            <p>No notices available at the moment</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}