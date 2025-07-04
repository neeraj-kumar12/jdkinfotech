'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './CustomSelect.module.css';

export default function CustomSelect({
    options = [],
    value,
    onChange,
    placeholder = "Select an option",
    name,
    id,
    className = "",
    error = null,
    hasError = false,
    required = false,
    onBlur,
    disabled = false,
    style = {} // Add style prop for inline styles
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState(
        options.find(option => option.value === value) || null
    );
    const [shouldShake, setShouldShake] = useState(false);
    const selectRef = useRef(null);

    // Update selected option when value prop changes
    useEffect(() => {
        const newSelectedOption = options.find(option => option.value === value) || null;
        setSelectedOption(newSelectedOption);
    }, [value, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
                // Trigger onBlur when clicking outside
                if (onBlur) {
                    onBlur({
                        target: {
                            name: name,
                            value: value
                        }
                    });
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onBlur, name, value]);

    // Trigger shake animation when error changes
    useEffect(() => {
        if (hasError && error) {
            setShouldShake(true);
            const timer = setTimeout(() => setShouldShake(false), 600);
            return () => clearTimeout(timer);
        }
    }, [hasError, error]);

    // Handle keyboard navigation
    const handleKeyDown = (event) => {
        if (disabled) return;

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(!isOpen);
        } else if (event.key === 'Escape') {
            setIsOpen(false);
        } else if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault();
            setIsOpen(true);
        } else if (event.key === 'ArrowDown' && isOpen) {
            event.preventDefault();
            // Focus first option logic could be added here
        } else if (event.key === 'ArrowUp' && isOpen) {
            event.preventDefault();
            // Focus last option logic could be added here
        }
    };

    const handleOptionSelect = (option) => {
        if (disabled) return;

        setSelectedOption(option);
        setIsOpen(false);
        if (onChange) {
            onChange({
                target: {
                    name: name,
                    value: option.value
                }
            });
        }
    };

    const handleHeaderClick = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
    };

    // Get validation state
    const getValidationState = () => {
        if (hasError) return 'error';
        if (value && !hasError) return 'success';
        return null;
    };

    const validationState = getValidationState();

    // Build CSS classes
    const selectClasses = [
        styles.customSelect,
        hasError ? styles.hasError : '',
        className
    ].filter(Boolean).join(' ');

    const headerClasses = [
        styles.selectHeader,
        isOpen ? styles.open : '',
        hasError ? styles.errorInput : '',
        validationState === 'success' ? styles.successInput : '',
        shouldShake ? styles.shake : '',
        disabled ? styles.disabled : ''
    ].filter(Boolean).join(' ');

    const dropdownClasses = [
        styles.dropdown,
        hasError ? styles.errorDropdown : ''
    ].filter(Boolean).join(' ');

    // Ensure full width styles
    const containerStyle = {
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        ...style
    };

    return (
        <div
            className={selectClasses}
            ref={selectRef}
            style={containerStyle}
        >
            <div
                className={headerClasses}
                onClick={handleHeaderClick}
                onKeyDown={handleKeyDown}
                tabIndex={disabled ? -1 : 0}
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={`${id}-listbox`}
                aria-invalid={hasError}
                aria-required={required} 
                aria-describedby={error ? `${id}-error` : undefined}
                aria-disabled={disabled}
                id={id}
                style={{
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    ...style
                }}
            >
                <span
                    className={styles.selectedValue}
                    style={{
                        minWidth: 0,
                        flex: '1 1 auto'
                    }}
                    id={`${id}-value`}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <svg
                    className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    style={{ flexShrink: 0 }}
                    aria-hidden="true"
                >
                    <path
                        d="M1 1.5L6 6.5L11 1.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {isOpen && !disabled && (
                <div className={dropdownClasses}>
                    <ul
                        className={styles.optionsList}
                        role="listbox"
                        aria-labelledby={id}
                    >
                        {options.map((option) => (
                            <li
                                key={option.value}
                                className={`${styles.option} ${selectedOption?.value === option.value ? styles.selected : ''
                                    }`}
                                onClick={() => handleOptionSelect(option)}
                                role="option"
                                aria-selected={selectedOption?.value === option.value}
                            >
                                {option.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Error Message */}
            {hasError && error && (
                <div className={styles.fieldError} id={`${id}-error`}>
                    {error}
                </div>
            )}
        </div>
    );
}