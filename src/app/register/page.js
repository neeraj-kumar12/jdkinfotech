'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import Image from 'next/image';
import styles from './register.module.css';

export default function RegisterPage() {
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/current-user');
                const data = await res.json();

                if (data?.success) {
                    window.location.href = data.data.role === 'staff'
                        ? '/staff-dashboard'
                        : '/student-dashboard';
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            }
        };

        checkAuth();
    }, []); // No dependencies needed with window.location approach

    // Notice data array for registration-specific information
    const registrationInfo = [
        {
            id: 1,
            date: "Required Documents",
            message: "Keep your academic certificates, ID proof, and address proof ready for verification."
        },
        {
            id: 2,
            date: "Registration Process",
            message: "Complete all sections carefully. Incomplete forms will be rejected."
        },
        {
            id: 3,
            date: "Contact Support",
            message: "For assistance, contact the admission office during working hours (9 AM - 5 PM)."
        }
    ];

    return (
        <div className={styles.registerContainer}>
            <div className={styles.header}>
                <div className={styles.logoSection}>
                    <h1>BCEI Institute Portal</h1>
                </div>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.registerBox}>
                    <h2>Student Registration Portal</h2>
                    <AuthForm type="register" />
                    <div className={styles.helpLinks}>
                        <a href="/login">Already Registered? Sign In</a>
                        <a href="/contact-support">Need Help?</a>
                    </div>
                    <div className={styles.notice}>
                        Note: After successful registration, you will receive login credentials via email.
                    </div>
                </div>

                <div className={styles.registrationGuide}>
                    <h3>Registration Guidelines</h3>
                    {registrationInfo.length > 0 ? (
                        <div className={styles.guideList}>
                            {registrationInfo.map((info) => (
                                <div key={info.id} className={styles.guideItem}>
                                    <span className={styles.badge}>{info.date}</span>
                                    <div className={styles.guideContent}>
                                        <h4>{info.message}</h4>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📋</div>
                            <p>No registration guidelines available</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}