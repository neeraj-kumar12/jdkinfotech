'use client';

import { useState, useRef, useEffect } from 'react';
import { GoogleReCaptchaProvider, GoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useRouter } from 'next/navigation';
import styles from './AuthForm.module.css';
import CustomSelect from './CustomSelect';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function AuthForm({ type = 'login' }) {
    const router = useRouter();
    const formRef = useRef(null);
    const [captchaToken, setCaptchaToken] = useState('');
    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        // Login fields
        instituteId: '',
        password: '',
        role: 'student',
        captchaToken: '',

        // Personal Information (for registration)
        ...(type === 'register' && {
            fullName: '',
            fatherName: '',
            motherName: '',
            dateOfBirth: '',
            gender: '',
            category: '',
            bloodGroup: '',
            nationality: 'Indian',
            phone: '',
            email: '',
            emergencyContact: '',

            // Academic Information
            course: '',
            session: '',
            batch: '',

            // Current Address
            address: '',
            state: '',
            pinCode: '',
            captchaToken: ''
        })
    });

    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const roleOptions = type === 'register'
        ? [{ value: 'student', label: 'Student' }]
        : [
            { value: 'student', label: 'Student' },
            { value: 'staff', label: 'Staff' }
        ];

    const genderOptions = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' }
    ];

    const categoryOptions = [
        { value: 'general', label: 'General' },
        { value: 'obc', label: 'OBC' },
        { value: 'sc', label: 'SC' },
        { value: 'st', label: 'ST' },
        { value: 'ews', label: 'EWS' }
    ];

    const bloodGroupOptions = [
        { value: 'A+', label: 'A+' },
        { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' },
        { value: 'B-', label: 'B-' },
        { value: 'AB+', label: 'AB+' },
        { value: 'AB-', label: 'AB-' },
        { value: 'O+', label: 'O+' },
        { value: 'O-', label: 'O-' }
    ];

    const courseOptions = [
        { value: 'DCA', label: 'DCA' },
        { value: 'DMCA', label: 'DMCA' },
        { value: 'PGDMCA', label: 'PGDMCA' },
        { value: 'Stenography', label: 'Stenography' }
    ];

    const stateOptions = [
        { value: 'Himachal Pradesh', label: 'Himachal Pradesh' }
    ];

    const sessionOptions = [
        { value: 'Jan - Dec', label: 'Jan - Dec' },
        { value: 'Jul - Jun', label: 'Jul - Jun' }
    ];

    // Define required fields
    const requiredFields = {
        login: ['password', 'role'],
        register: [
            'fullName', 'fatherName', 'motherName', 'dateOfBirth',
            'gender', 'category', 'nationality', 'phone', 'email', 'course',
            'session', 'batch', 'address', 'state', 'pinCode', 'instituteId', 'password'
        ]
    };

    // Dynamically add required field for login based on role
    if (typeof window !== 'undefined' && formData && formData.role === 'staff') {
        if (!requiredFields.login.includes('email')) requiredFields.login.push('email');
        const idx = requiredFields.login.indexOf('instituteId');
        if (idx !== -1) requiredFields.login.splice(idx, 1);
    } else {
        if (!requiredFields.login.includes('instituteId')) requiredFields.login.push('instituteId');
        const idx = requiredFields.login.indexOf('email');
        if (idx !== -1) requiredFields.login.splice(idx, 1);
    }

    // Scroll to first error field
    const scrollToFirstError = (errors) => {
        const errorFields = Object.keys(errors);
        if (errorFields.length === 0) return;

        const firstErrorField = errorFields[0];
        let element = document.querySelector(`[name="${firstErrorField}"]`) ||
            document.querySelector(`#${firstErrorField}`);

        if (element) {
            element.classList.add(styles.shake);
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });

            setTimeout(() => {
                element.focus();
                element.classList.remove(styles.shake);
            }, 300);
        }
    };

    const highlightErrorFields = (errors) => {
        document.querySelectorAll(`.${styles.errorInput}`).forEach(el => {
            el.classList.remove(styles.errorInput, styles.shake);
        });

        Object.keys(errors).forEach(fieldName => {
            const element = document.querySelector(`[name="${fieldName}"]`);
            if (element) {
                element.classList.add(styles.errorInput);
                setTimeout(() => {
                    element.classList.add(styles.shake);
                    setTimeout(() => element.classList.remove(styles.shake), 500);
                }, 100);
            }

            const customSelectElement = document.querySelector(`#${fieldName}`);
            if (customSelectElement && customSelectElement.classList.contains(styles.selectHeader)) {
                customSelectElement.classList.add(styles.errorInput, styles.shake);
                setTimeout(() => customSelectElement.classList.remove(styles.shake), 500);
            }
        });
    };

    const validateAge = (dateString) => {
        const birthDate = new Date(dateString);
        const currentDate = new Date();

        // Calculate age
        let age = currentDate.getFullYear() - birthDate.getFullYear();
        const monthDiff = currentDate.getMonth() - birthDate.getMonth();

        // Adjust age if birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= 16;
    };

    // Validate individual field
    const validateField = (fieldName, value) => {
        if (isRequired(fieldName) && (!value || value.trim() === '')) {
            return `${getFieldDisplayName(fieldName)} is required`;
        }

        switch (fieldName) {
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return 'Please enter a valid email address';
                }
                break;

            case 'phone':
            case 'emergencyContact':
                if (value && !/^[0-9]{10}$/.test(value)) {  // Exactly 10 digits
                    return 'Phone number must be 10 digits';
                }
                break;

            case 'pinCode':
                if (value && !/^[0-9]{6}$/.test(value)) {
                    return 'Pin code must be 6 digits';
                }
                break;

            case 'password':
                if (value && value.length < 8) {
                    return 'Password must be at least 8 characters long';
                }
                break;

            case 'dateOfBirth':
                if (value && !validateAge(value)) {
                    return 'You must be at least 16 years old';
                }
                break;

            case 'fullName':
            case 'fatherName':
            case 'motherName':
                if (value && !/^[a-zA-Z\s]+$/.test(value)) {
                    return `${getFieldDisplayName(fieldName)} should contain only letters and spaces`;
                }
                break;
        }
        return '';
    };

    // Validate entire form
    const validateForm = () => {
        const required = requiredFields[type];
        const errors = {};
        let hasErrors = false;

        for (const field of required) {
            const error = validateField(field, formData[field]);
            if (error) {
                errors[field] = error;
                hasErrors = true;
            }
        }

        setFieldErrors(errors);

        if (hasErrors) {
            setTimeout(() => {
                scrollToFirstError(errors);
                highlightErrorFields(errors);
            }, 100);
        }

        return !hasErrors;
    };

    const getFieldDisplayName = (fieldName) => {
        const fieldNames = {
            instituteId: 'Institute ID',
            password: 'Password',
            fullName: 'Full Name',
            fatherName: "Father's Name",
            motherName: "Mother's Name",
            dateOfBirth: 'Date of Birth',
            gender: 'Gender',
            category: 'Category',
            nationality: 'Nationality',
            phone: 'Phone Number',
            email: 'Email Address',
            course: 'Course',
            session: 'Session',
            batch: 'Batch',
            address: 'Address',
            state: 'State',
            pinCode: 'Pin Code'
        };
        return fieldNames[fieldName] || fieldName;
    };

    const loginUser = async (loginData) => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        return data;
    };

    const registerUser = async (registrationData) => {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        return data;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // CAPTCHA verification check
        if (!isCaptchaVerified) {
            setError('Please complete the CAPTCHA verification');
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);

        if (!validateForm()) {
            setIsSubmitting(false);
            return;
        }

        try {
            if (type === 'login') {
                let loginData;
                if (formData.role === 'staff') {
                    loginData = {
                        email: formData.email,
                        password: formData.password,
                        role: formData.role,
                        captchaToken
                    };
                } else {
                    loginData = {
                        instituteId: formData.instituteId,
                        password: formData.password,
                        role: formData.role,
                        captchaToken
                    };
                }

                const result = await loginUser(loginData);

                // Redirect based on role
                if (result.user.role === 'student') {
                    window.location.href = '/student-dashboard';
                } else {
                    window.location.href = '/staff-dashboard';
                }
            } else {
                // Registration API call with CAPTCHA
                const registrationData = {
                    fullName: formData.fullName,
                    fatherName: formData.fatherName,
                    motherName: formData.motherName,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    category: formData.category,
                    bloodGroup: formData.bloodGroup || null,
                    nationality: formData.nationality,
                    phone: formData.phone,
                    email: formData.email,
                    emergencyContact: formData.emergencyContact || null,
                    course: formData.course,
                    session: formData.session,
                    batch: parseInt(formData.batch),
                    address: formData.address,
                    state: formData.state,
                    pinCode: formData.pinCode,
                    instituteId: formData.instituteId,
                    password: formData.password,
                    role: formData.role,
                    captchaToken
                };

                const result = await registerUser(registrationData);

                // ADD THIS REDIRECTION AFTER SUCCESSFUL REGISTRATION
                window.location.href = '/login?registration=success';
            }
        } catch (err) {
            console.error('Auth error:', err);

            // Handle CAPTCHA-specific errors
            if (err.message.includes('CAPTCHA')) {
                setIsCaptchaVerified(false);
            }

            // Set user-friendly error message for invalid credentials
            if (err.message.toLowerCase().includes('invalid credentials')) {
                sessionStorage.setItem('loginError', 'Invalid credentials. Please try again.');
            } else {
                sessionStorage.setItem('loginError', err.message || 'Something went wrong');
            }

            // Refresh the page only for login errors
            if (type === 'login') {
                window.location.reload();
            } else {
                // For registration errors, just set the error state
                setError(err.message || 'Something went wrong during registration');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this useEffect at the top of your component to check for stored errors
    useEffect(() => {
        const error = sessionStorage.getItem('loginError');
        if (error) {
            setError(error);
            sessionStorage.removeItem('loginError'); // Clear after displaying
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: ''
            }));

            const element = e.target;
            if (element && element.classList && typeof element.classList.remove === 'function') {
                element.classList.remove(styles.errorInput);
            }

            const customSelectElement = document.querySelector(`#${name}`);
            if (customSelectElement && customSelectElement.classList) {
                customSelectElement.classList.remove(styles.errorInput);
            }
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);

        if (error) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: error
            }));
            e.target.classList.add(styles.errorInput);
        } else {
            e.target.classList.remove(styles.errorInput);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();

            const form = e.target.form;
            const formElements = Array.from(form.elements);
            const currentIndex = formElements.indexOf(e.target);

            for (let i = currentIndex + 1; i < formElements.length; i++) {
                const nextElement = formElements[i];
                if (nextElement.type !== 'hidden' && !nextElement.disabled && nextElement.type !== 'submit') {
                    nextElement.focus();
                    return;
                }
            }

            form.requestSubmit();
        }
    };

    const isRequired = (fieldName) => {
        return requiredFields[type].includes(fieldName);
    };

    const getInputClassName = (fieldName) => {
        let className = '';
        if (fieldErrors[fieldName]) {
            className += ` ${styles.errorInput}`;
        }
        return className.trim();
    };

    const renderLoginForm = () => (
        <>
            <div className={styles.formGroup}>
                <label htmlFor={formData.role === 'staff' ? 'email' : 'instituteId'}>
                    {formData.role === 'staff' ? 'Email' : 'Institute ID'} <span className={styles.required}>*</span>
                </label>
                <input
                    type={formData.role === 'staff' ? 'email' : 'number'}
                    id={formData.role === 'staff' ? 'email' : 'instituteId'}
                    name={formData.role === 'staff' ? 'email' : 'instituteId'}
                    value={formData.role === 'staff' ? (formData.email || '') : formData.instituteId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={formData.role === 'staff' ? 'Enter your staff email' : 'Enter your institute ID'}
                    className={getInputClassName(formData.role === 'staff' ? 'email' : 'instituteId')}
                    autoComplete="username"
                    style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
                />
                {formData.role === 'staff' && fieldErrors.email && (
                    <span className={styles.fieldError}>{fieldErrors.email}</span>
                )}
                {formData.role !== 'staff' && fieldErrors.instituteId && (
                    <span className={styles.fieldError}>{fieldErrors.instituteId}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="password">
                    Password <span className={styles.required}>*</span>
                </label>
                <div className={styles.passwordInputContainer}>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your password"
                        className={getInputClassName('password')}
                        autoComplete="current-password"
                        style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
                    />
                    <button
                        type="button"
                        className={styles.showPasswordButton}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
                {fieldErrors.password && (
                    <span className={styles.fieldError}>{fieldErrors.password}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="role">Role</label>
                <CustomSelect
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    options={roleOptions}
                    placeholder="Select your role"
                    hasError={!!fieldErrors.role}
                    errorMessage={fieldErrors.role}
                    style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}
                />
            </div>
        </>
    );

    const renderRegistrationForm = () => (
        <>
            {/* Personal Information Section */}
            <div className={styles.sectionTitle}>Personal Information</div>

            <div className={styles.formGroup}>
                <label htmlFor="fullName">
                    Full Name <span className={styles.required}>*</span>
                </label>
                <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your full name"
                    className={fieldErrors.fullName ? styles.errorInput : ''}
                />
                {fieldErrors.fullName && (
                    <span className={styles.fieldError}>{fieldErrors.fullName}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="fatherName">
                    Father&apos;s Name <span className={styles.required}>*</span>
                </label>
                <input
                    type="text"
                    id="fatherName"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your father's name"
                    className={fieldErrors.fatherName ? styles.errorInput : ''}
                />
                {fieldErrors.fatherName && (
                    <span className={styles.fieldError}>{fieldErrors.fatherName}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="motherName">
                    Mother&apos;s Name <span className={styles.required}>*</span>
                </label>
                <input
                    type="text"
                    id="motherName"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your mother's name"
                    className={fieldErrors.motherName ? styles.errorInput : ''}
                />
                {fieldErrors.motherName && (
                    <span className={styles.fieldError}>{fieldErrors.motherName}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="dateOfBirth">
                    Date of Birth <span className={styles.required}>*</span>
                </label>
                <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={fieldErrors.dateOfBirth ? styles.errorInput : ''}
                />
                {fieldErrors.dateOfBirth && (
                    <span className={styles.fieldError}>{fieldErrors.dateOfBirth}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="gender">
                    Gender <span className={styles.required}>*</span>
                </label>
                <CustomSelect
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    options={genderOptions}
                    placeholder="Select your gender"
                    hasError={!!fieldErrors.gender}
                    errorMessage={fieldErrors.gender}
                />
                {fieldErrors.gender && (
                    <span className={styles.fieldError}>{fieldErrors.gender}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="category">
                    Category <span className={styles.required}>*</span>
                </label>
                <CustomSelect
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={categoryOptions}
                    placeholder="Select your category"
                    hasError={!!fieldErrors.category}
                    errorMessage={fieldErrors.category}
                />
                {fieldErrors.category && (
                    <span className={styles.fieldError}>{fieldErrors.category}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="bloodGroup">Blood Group</label>
                <CustomSelect
                    id="bloodGroup"
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    options={bloodGroupOptions}
                    placeholder="Select your blood group"
                    hasError={!!fieldErrors.bloodGroup}
                    errorMessage={fieldErrors.bloodGroup}
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="nationality">
                    Nationality <span className={styles.required}>*</span>
                </label>
                <input
                    type="text"
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your nationality"
                    className={fieldErrors.nationality ? styles.errorInput : ''}
                />
                {fieldErrors.nationality && (
                    <span className={styles.fieldError}>{fieldErrors.nationality}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="phone">
                    Phone Number <span className={styles.required}>*</span>
                </label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="+91 98765 43210"
                    className={fieldErrors.phone ? styles.errorInput : ''}
                />
                {fieldErrors.phone && (
                    <span className={styles.fieldError}>{fieldErrors.phone}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="email">
                    Email Address <span className={styles.required}>*</span>
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your email address"
                    className={fieldErrors.email ? styles.errorInput : ''}
                />
                {fieldErrors.email && (
                    <span className={styles.fieldError}>{fieldErrors.email}</span>
                )}
            </div>

            {/* Academic Information Section */}
            <div className={styles.sectionTitle}>Academic Information</div>

            <div className={styles.formGroup}>
                <label htmlFor="course">
                    Course <span className={styles.required}>*</span>
                </label>
                <CustomSelect
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    options={courseOptions}
                    placeholder="Select your course"
                    hasError={!!fieldErrors.course}
                    errorMessage={fieldErrors.course}
                />
                {fieldErrors.course && (
                    <span className={styles.fieldError}>{fieldErrors.course}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="session">
                    Session <span className={styles.required}>*</span>
                </label>
                <CustomSelect
                    id="session"
                    name="session"
                    value={formData.session}
                    onChange={handleChange}
                    options={sessionOptions}
                    placeholder="Select your session"
                    hasError={!!fieldErrors.session}
                    errorMessage={fieldErrors.session}
                />
                {fieldErrors.session && (
                    <span className={styles.fieldError}>{fieldErrors.session}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="batch">
                    Batch <span className={styles.required}>*</span>
                </label>
                <input
                    type="number"
                    id="batch"
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g., 2025"
                    className={fieldErrors.batch ? styles.errorInput : ''}
                />
                {fieldErrors.batch && (
                    <span className={styles.fieldError}>{fieldErrors.batch}</span>
                )}
            </div>

            {/* Current Address Section */}
            <div className={styles.sectionTitle}>Current Address</div>

            <div className={styles.formGroup}>
                <label htmlFor="address">
                    Address <span className={styles.required}>*</span>
                </label>
                <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your complete address (House/Street, Village, Post Office, Sub-District, Tehsil, District)"
                    rows="4"
                    className={fieldErrors.address ? styles.errorInput : ''}
                />
                {fieldErrors.address && (
                    <span className={styles.fieldError}>{fieldErrors.address}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="state">
                    State <span className={styles.required}>*</span>
                </label>
                <CustomSelect
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    options={stateOptions}
                    placeholder="Select your state"
                    hasError={!!fieldErrors.state}
                    errorMessage={fieldErrors.state}
                />
                {fieldErrors.state && (
                    <span className={styles.fieldError}>{fieldErrors.state}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="pinCode">
                    Pin Code <span className={styles.required}>*</span>
                </label>
                <input
                    type="number"
                    id="pinCode"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your pin code"
                    min="100000"
                    max="999999"
                    className={fieldErrors.pinCode ? styles.errorInput : ''}
                />
                {fieldErrors.pinCode && (
                    <span className={styles.fieldError}>{fieldErrors.pinCode}</span>
                )}
            </div>

            {/* Login Credentials Section */}
            <div className={styles.sectionTitle}>Login Credentials</div>

            <div className={styles.formGroup}>
                <label htmlFor="instituteId">
                    Institute ID <span className={styles.required}>*</span>
                </label>
                <input
                    type="number"
                    id="instituteId"
                    name="instituteId"
                    value={formData.instituteId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Enter your institute ID"
                    className={fieldErrors.instituteId ? styles.errorInput : ''}
                />
                {fieldErrors.instituteId && (
                    <span className={styles.fieldError}>{fieldErrors.instituteId}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="password">
                    Password <span className={styles.required}>*</span>
                </label>
                <div className={styles.passwordInputContainer}>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Enter your password"
                        minLength="8"
                        className={fieldErrors.password ? styles.errorInput : ''}
                    />
                    <button
                        type="button"
                        className={styles.showPasswordButton}
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
                {fieldErrors.password && (
                    <span className={styles.fieldError}>{fieldErrors.password}</span>
                )}
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="role">Role</label>
                <CustomSelect
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    options={roleOptions}
                    placeholder="Select your role"
                    hasError={!!fieldErrors.role}
                    errorMessage={fieldErrors.role}
                />
            </div>
        </>
    );

    return (
        <GoogleReCaptchaProvider
            reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
            scriptProps={{
                async: true,
                defer: true,
                appendTo: 'body'
            }}
        >
            <div className={styles.formCard}>

                <h1 className={styles.title}>
                    {type === 'login' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p className={styles.subtitle}>
                    {type === 'login'
                        ? 'Enter your credentials to access your account'
                        : 'Fill in the details to create your account'}
                </p>

                <form ref={formRef} onSubmit={handleSubmit} className={styles.form} noValidate>
                    {type === 'login' ? renderLoginForm() : renderRegistrationForm()}
                    {/* Add CAPTCHA component */}
                    <div className={styles.captchaContainer}>
                        <GoogleReCaptcha
                            onVerify={(token) => {
                                setCaptchaToken(token);
                                setIsCaptchaVerified(true);
                            }}
                            refreshInterval={300} // Refresh token every 5 minutes
                        />
                        {!isCaptchaVerified && (
                            <div className={styles.captchaMessage}>
                                Completing CAPTCHA verification...
                            </div>
                        )}
                    </div>
                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        type="submit"
                        className={`${styles.submitButton} ${isSubmitting ? styles.loading : ''}`}
                        disabled={isSubmitting}  // Only disable when submitting
                    >
                        {isSubmitting
                            ? (type === 'login' ? 'Signing In...' : 'Creating Account...')
                            : (type === 'login' ? 'Sign In' : 'Create Account')
                        }
                    </button>

                    <p className={styles.switchText}>
                        {type === 'login' ? (
                            <>
                                Don&apos;t have an account?{' '}
                                <a href="/register">Register here</a>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <a href="/login">Sign in here</a>
                            </>
                        )}
                    </p>
                </form>
            </div>
        </GoogleReCaptchaProvider>
    );
}