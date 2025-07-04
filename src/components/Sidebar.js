'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './Sidebar.module.css';
import dashboardStyles from '../app/student-dashboard/dashboard.module.css';
import documentsStyles from '../app/student-dashboard/documents/documents.module.css';
import examsStyles from '../app/student-dashboard/exams/exams.module.css';
import resultsStyles from '../app/student-dashboard/results/results.module.css';
import feesStyles from '../app/student-dashboard/fees/fees.module.css';
import coursesStyles from '../app/student-dashboard/courses/courses.module.css';
import profileStyles from '../app/student-dashboard/profile/profile.module.css';
import announcementsStyles from '../app/student-dashboard/announcements/announcements.module.css';
import dashboardStylesStaff from '../app/staff-dashboard/dashboard.module.css';
import documentsStylesStaff from '../app/staff-dashboard/documents/documents.module.css';
import examsStylesStaff from '../app/staff-dashboard/exams/exams.module.css';
import resultsStylesStaff from '../app/staff-dashboard/results/results.module.css';
import feesStylesStaff from '../app/staff-dashboard/fees/fees.module.css';
import coursesStylesStaff from '../app/staff-dashboard/courses/courses.module.css';
import profileStylesStaff from '../app/staff-dashboard/profile/profile.module.css';
import announcementsStylesStaff from '../app/staff-dashboard/announcements/announcements.module.css';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hasBeenToggled, setHasBeenToggled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    // Fetch current user data
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
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
    }, [router]);

    // Handle logout
    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                window.location.href = '/login';
            } else {
                throw new Error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Get user initials
    const getInitials = (name) => {
        if (!name) return 'U';
        const nameArray = name.trim().split(' ');
        return nameArray.length === 1
            ? nameArray[0].charAt(0).toUpperCase()
            : (nameArray[0].charAt(0) + nameArray.at(-1).charAt(0)).toUpperCase();
    };

    useEffect(() => {
        // Check if mobile on mount and resize
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (mobile && !hasBeenToggled) {
                setIsCollapsed(true);
            } else if (!mobile && !hasBeenToggled) {
                setIsCollapsed(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [hasBeenToggled]);

    useEffect(() => {
        // Update main content class when sidebar state changes
        const mainContents = document.querySelectorAll(
            `.${dashboardStyles.mainContent}, 
             .${documentsStyles.mainContent},
             .${examsStyles.mainContent},
             .${resultsStyles.mainContent},
             .${feesStyles.mainContent},
             .${coursesStyles.mainContent},
             .${profileStyles.mainContent},
             .${announcementsStyles.mainContent},
             .${dashboardStylesStaff.mainContent}, 
             .${documentsStylesStaff.mainContent},
             .${examsStylesStaff.mainContent},
             .${resultsStylesStaff.mainContent},
             .${feesStylesStaff.mainContent},
             .${coursesStylesStaff.mainContent},
             .${profileStylesStaff.mainContent},
             .${announcementsStylesStaff.mainContent}`
        );
        mainContents.forEach(mainContent => {
            if (mainContent) {
                mainContent.classList.toggle(dashboardStyles.mainContentCollapsed, isCollapsed);
            }
        });
    }, [isCollapsed]);

    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
        setHasBeenToggled(true);
    };

    const basePath = currentUser?.role === 'staff' ? '/staff-dashboard' : '/student-dashboard';
    const menuItems = [
        { icon: '🏠', label: 'Dashboard', path: basePath },
        { icon: '📝', label: 'Exams', path: `${basePath}/exams` },
        { icon: '📊', label: 'Results', path: `${basePath}/results` },
        { icon: '📚', label: 'Courses', path: `${basePath}/courses` },
        { icon: '💰', label: 'Fees', path: `${basePath}/fees` },
        { icon: '📄', label: 'Documents', path: `${basePath}/documents` },
        { icon: '👤', label: 'Profile', path: `${basePath}/profile` },
        { icon: '📢', label: 'Announcements', path: `${basePath}/announcements` },
        { icon: '👨‍💻', label: 'Developer', path: 'https://linktr.ee/codewithneeraj' }
    ];

    // Determine the CSS class based on state
    const getSidebarClass = () => {
        if (!hasBeenToggled) {
            if (isMobile) {
                return `${styles.sidebar} ${styles.collapsed}`;
            } else {
                return styles.sidebar;
            }
        }
        return `${styles.sidebar} ${isCollapsed ? styles.collapsed : styles.notCollapsed}`;
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingPlaceholder}>
                    <div className={styles.spinner}></div>
                </div>
            </div>
        );
    }

    return (
        <aside className={getSidebarClass()}>
            <div className={styles.sidebarHeader}>
                <h2 className={styles.logo}>JDK Infotech</h2>
                <button
                    className={styles.collapseBtn}
                    onClick={handleToggleCollapse}
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? '→' : '←'}
                </button>
            </div>

            <nav className={styles.nav}>
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
                        passHref
                    >
                        <span className={styles.icon}>{item.icon}</span>
                        <span className={styles.label}>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className={styles.profile}>
                <div className={styles.profileInfo}>
                    <div className={styles.avatarContainer}>
                        <div
                            className={`${styles.avatar} ${styles.avatarInitials}`}>
                            {getInitials(currentUser?.fullName || currentUser?.name)}
                        </div>
                    </div>
                    <div className={styles.userInfo}>
                        <p className={styles.name}>{currentUser?.fullName || currentUser?.name || 'User'}</p>
                        <p className={styles.role}>{currentUser?.role || 'None'}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className={styles.logoutButton}
                    aria-label="Logout"
                >
                    <span className={styles.icon}>🚪</span>
                    <span className={styles.label}>Logout</span>
                </button>
            </div>
        </aside>
    );
}