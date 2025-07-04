'use client';

import { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import Navbar from '@/components/Navbar';
import Holidays from 'date-holidays';
import { useRouter } from 'next/navigation';
import DynamicSidebar from '@/components/Sidebar';



export default function StudentDashboard() {
  const [instituteStatus, setInstituteStatus] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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

        // Role-based access control
        if (!data) {
          router.replace('/login');
        } else if (data.role === 'staff') {
          router.replace('/staff-dashboard');
        }
        // If student, do nothing (stay on page)
      } catch (error) {
        router.replace('/login');
      }
    };

    fetchCurrentUser();
  }, [router]);

  const hd = new Holidays('IN'); // IN for India

  // Function to check if a given date is a holiday
  const isHoliday = (date = new Date()) => {
    const holiday = hd.isHoliday(date);
    return holiday !== null && holiday !== false;
  };

  // Function to determine if the institute is open
  const isInstituteOpen = (checkTime = new Date()) => {
    const day = checkTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = checkTime.getHours(); // 24-hour format
    const minutes = checkTime.getMinutes();

    const openHour = 8; // 8 AM
    const closeHour = 18; // 6 PM

    // Convert current time to minutes for more precise comparison
    const currentMinutes = hour * 60 + minutes;
    const openMinutes = openHour * 60;
    const closeMinutes = closeHour * 60;

    // Closed on Sundays
    if (day === 0) {
      return false;
    }

    // Closed on holidays
    if (isHoliday(checkTime)) {
      return false;
    }

    // Closed outside working hours
    if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
      return false;
    }

    return true;
  };

  // Function to get the next opening time
  const getNextOpeningTime = () => {
    const now = new Date();
    let nextOpening = new Date(now);

    // If it's Sunday, move to Monday
    if (now.getDay() === 0) {
      nextOpening.setDate(now.getDate() + 1);
    }
    // If it's after closing time, move to next day
    else if (now.getHours() >= 18) {
      nextOpening.setDate(now.getDate() + 1);
    }

    // Keep checking until we find a non-holiday weekday
    while (nextOpening.getDay() === 0 || isHoliday(nextOpening)) {
      nextOpening.setDate(nextOpening.getDate() + 1);
    }

    // Set time to 8 AM
    nextOpening.setHours(8, 0, 0, 0);

    return nextOpening;
  };


useEffect(() => {
    // Set client-side flag
    setIsClient(true);

    // Function to update both time and institute status
    const updateStatus = () => {
      const now = new Date();
      setCurrentTime(now);
      setInstituteStatus(isInstituteOpen(now)); // Now uses the stable function
    };

    // Move isInstituteOpen inside useEffect to make it stable
    const isInstituteOpen = (time) => {
      // Your institute opening hours logic here
      const hours = time.getHours();
      return hours >= 8 && hours < 18; // Example: 8AM to 6PM
    };

    // Set initial status
    updateStatus();

    // Update every second for more responsive updates
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
}, []); // Empty dependencies now safe

  const currentHoliday = isClient && isHoliday() ? hd.isHoliday(new Date()) : null;

  return (
    <div className={styles.dashboardLayout}>
      <Navbar />
      <DynamicSidebar />
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <header className={styles.pageHeader}>
            <div className={styles.userInfo}>
              <h1>Dashboard</h1>
              <p>Welcome, {currentUser?.fullName || currentUser?.name || 'User'}!</p>
              <small className={styles.currentTime}>
                {isClient ? currentTime.toLocaleString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Loading...'}
              </small>
            </div>
            <div className={styles.instituteStatus}>
              <div className={styles.statusContainer}>
                {instituteStatus ? (
                  <span className={styles.open}>
                    Institute Open
                  </span>
                ) : (
                  <span className={styles.closed}>
                    Institute Closed
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className={styles.quickAccessGrid}>
            <a
              href="/student-dashboard/exams"
              className={`${styles.quickAccessCard} ${!instituteStatus ? styles.disabled : ''}`}
            >
              <div className={styles.quickAccessIcon}>📝</div>
              <div className={styles.quickAccessContent}>
                <h3>Exams</h3>
                <p>View exam schedule and results</p>
              </div>
            </a>

            <a
              href="/student-dashboard/results"
              className={`${styles.quickAccessCard} ${!instituteStatus ? styles.disabled : ''}`}
            >
              <div className={styles.quickAccessIcon}>📊</div>
              <div className={styles.quickAccessContent}>
                <h3>Results</h3>
                <p>Check your academic performance</p>
              </div>
            </a>

            <a
              href="/student-dashboard/courses"
              className={`${styles.quickAccessCard} ${!instituteStatus ? styles.disabled : ''}`}
            >
              <div className={styles.quickAccessIcon}>📚</div>
              <div className={styles.quickAccessContent}>
                <h3>Courses</h3>
                <p>Access course materials and schedules</p>
              </div>
            </a>

            <a
              href="/student-dashboard/fees"
              className={`${styles.quickAccessCard} ${!instituteStatus ? styles.disabled : ''}`}
            >
              <div className={styles.quickAccessIcon}>💰</div>
              <div className={styles.quickAccessContent}>
                <h3>Fees</h3>
                <p>View and pay your fees</p>
              </div>
            </a>

            <a href="/student-dashboard/documents" className={styles.quickAccessCard}>
              <div className={styles.quickAccessIcon}>📄</div>
              <div className={styles.quickAccessContent}>
                <h3>Documents</h3>
                <p>Access and submit important documents</p>
              </div>
            </a>

            <a href="/student-dashboard/profile" className={styles.quickAccessCard}>
              <div className={styles.quickAccessIcon}>👤</div>
              <div className={styles.quickAccessContent}>
                <h3>Profile</h3>
                <p>Update your personal information</p>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}