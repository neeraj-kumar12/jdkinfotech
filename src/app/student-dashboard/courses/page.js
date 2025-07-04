'use client';

import styles from './courses.module.css';
import { BookOpenIcon, UserGroupIcon, CalendarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useState } from 'react';

export default function Page() {
    // Only one enrolled course that user is currently taking
    const [enrolledCourse] = useState({
        id: 1,
        code: "CS301",
        name: "Diploma of Multingual Computer Application",
        instructor: "Dharmendnder Thakur",
        schedule: "10:00 AM - 06:00 PM",
        status: "In Progress",
        assignments: 3,
        topics: [
            { id: 1, name: "Introduction to Programming"},
            { id: 2, name: "Variables and Data Types"},
            { id: 3, name: "Control Structures"},
            { id: 4, name: "Functions and Methods"},
            { id: 5, name: "Arrays and Lists"},
            { id: 6, name: "Object-Oriented Programming"},
            { id: 7, name: "Data Structures"},
            { id: 8, name: "Algorithms"},
            { id: 9, name: "Recursion"},
            { id: 10, name: "File Handling"}
        ]
    });

    return (
        <div className={styles.dashboardLayout}>
            <Navbar />
            <Sidebar />
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    <header className={styles.pageHeader}>
                        <div className={styles.headerContent}>
                            <div className={styles.headerLeft}>
                                <h1>My Course</h1>
                                <p>Track your learning progress</p>
                            </div>
                        </div>
                    </header>

                    <div className={styles.courseGrid}>
                        <div className={styles.courseCard}>
                            <div className={styles.courseHeader}>
                                <div className={styles.courseIcon}>
                                    <BookOpenIcon className="w-4 h-4" />
                                </div>
                                <span className={`${styles.courseStatus} ${styles.enrolled}`}>
                                    {enrolledCourse.status}
                                </span>
                            </div>
                            
                            <div className={styles.courseTitle}>
                                <h3>{enrolledCourse.name}</h3>
                                <p className={styles.courseCode}>{enrolledCourse.code}</p>
                            </div>

                            <div className={styles.courseInfo}>
                                <div className={styles.infoItem}>
                                    <UserGroupIcon className="w-4 h-4" />
                                    <span>{enrolledCourse.instructor}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>{enrolledCourse.schedule}</span>
                                </div>
                            </div>
                            <div className={styles.topicsSection}>
                                <h4>Course Topics</h4>
                                <ul className={styles.topicsList}>
                                    {enrolledCourse.topics.map(topic => (
                                        <li key={topic.id} className={styles.topicItem}>
                                            <CheckCircleIcon className={styles.tickIcon} />
                                            <span>{topic.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}