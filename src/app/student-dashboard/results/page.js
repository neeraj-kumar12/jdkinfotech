'use client';

import styles from './results.module.css';
import Navbar from '@/components/Navbar';
import DynamicSidebar from '@/components/Sidebar';

export default function ResultsPage() {

    // Empty results array to demonstrate the no results state
    const results = [];

    return (
        <div className={styles.dashboardLayout}>
            <Navbar />
            <DynamicSidebar />
            <main className={styles.mainContent}>
                <div className={styles.contentWrapper}>
                    <header className={styles.pageHeader}>
                        <h1>Result</h1>
                        <p>View your academic result</p>
                    </header>

                    <div className={styles.resultActions}>
                        <button className={styles.primaryBtn} disabled={results.length === 0}>
                            Download Your result
                        </button>
                    </div>

                    <div className={styles.resultsContainer}>
                        {results.length > 0 ? (
                            results.map((course, index) => (
                                <div key={index} className={styles.semesterCard}>
                                    <div className={styles.semesterHeader}>
                                        <div>
                                            <h3>{course.course}</h3>
                                        </div>
                                        <div className={styles.yearDisplay}>
                                            <strong>{course.year}</strong>
                                        </div>
                                    </div>

                                    <div className={styles.resultsTable}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th style={{ textAlign: 'left' }}>Course</th>
                                                    <th>Code</th>
                                                    <th>Session</th>
                                                    <th>Exam Month</th>
                                                    <th>Student ID</th>
                                                    <th>Links</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {course.results.map((result, idx) => (
                                                    <tr key={idx}>
                                                        <td style={{ textAlign: 'left' }}>{result.course}</td>
                                                        <td>{result.code}</td>
                                                        <td>{result.session}</td>
                                                        <td>{result.month}</td>
                                                        <td className={styles.studentId}>{result.studentId}</td>
                                                        <td className={styles.link}>
                                                            <a href={result.link}>Download</a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.noResultsCard}>
                                <div className={styles.noResultsContent}>
                                    <div className={styles.noResultsIcon}>
                                        📄
                                    </div>
                                    <h3>No Results Found</h3>
                                    <p>You don&apos;t have any academic results available at the moment.</p>
                                    <p>Results will appear here once they are published by your institution.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}