import React, { useState, useEffect } from 'react';

export default function VideoSettings({ isOpen, onClose }) {
    const [countdownDuration, setCountdownDuration] = useState(10);

    useEffect(() => {
        // Load current setting from localStorage
        const savedDuration = localStorage.getItem('autoplayCountdownDuration');
        if (savedDuration) {
            setCountdownDuration(parseInt(savedDuration, 10));
        }
    }, [isOpen]);

    const handleSave = () => {
        localStorage.setItem('autoplayCountdownDuration', countdownDuration.toString());

        // Dispatch event to notify VideoPlayer of the change
        window.dispatchEvent(new CustomEvent('autoplaySettingsUpdated', {
            detail: { countdownDuration }
        }));

        onClose();
    };

    const handleDurationChange = (value) => {
        const duration = parseInt(value, 10);
        if (duration >= 3 && duration <= 60) {
            setCountdownDuration(duration);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="video-settings-overlay" onClick={onClose}>
            <div className="video-settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="settings-header">
                    <h3>Video Player Settings</h3>
                    <button
                        className="settings-close-btn"
                        onClick={onClose}
                        aria-label="Close settings"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="settings-content">
                    <div className="setting-group">
                        <label htmlFor="countdown-duration" className="setting-label">
                            Autoplay Countdown Duration
                        </label>
                        <p className="setting-description">
                            Time before the next video plays automatically (3-60 seconds)
                        </p>
                        <div className="setting-input-group">
                            <input
                                id="countdown-duration"
                                type="range"
                                min="3"
                                max="60"
                                step="1"
                                value={countdownDuration}
                                onChange={(e) => handleDurationChange(e.target.value)}
                                className="setting-slider"
                            />
                            <div className="setting-value-display">
                                <input
                                    type="number"
                                    min="3"
                                    max="60"
                                    value={countdownDuration}
                                    onChange={(e) => handleDurationChange(e.target.value)}
                                    className="setting-number-input"
                                />
                                <span className="setting-unit">seconds</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="settings-footer">
                    <button className="settings-btn settings-cancel-btn" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="settings-btn settings-save-btn" onClick={handleSave}>
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
