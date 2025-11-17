import React, { useState, useEffect, useRef } from 'react';

export default function AutoplayCountdown({
    nextVideoInfo,
    onCancel,
    onPlayNow,
    countdownDuration = 10
}) {
    const [timeRemaining, setTimeRemaining] = useState(countdownDuration);
    const intervalRef = useRef(null);

    useEffect(() => {
        // Start countdown
        intervalRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    onPlayNow();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [onPlayNow]);

    const handleCancel = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        onCancel();
    };

    const handlePlayNow = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        onPlayNow();
    };

    const progress = ((countdownDuration - timeRemaining) / countdownDuration) * 100;
    const circumference = 2 * Math.PI * 54; // radius = 54
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="autoplay-countdown-overlay">
            <div className="autoplay-countdown-container">
                <div className="countdown-header">
                    <h3>Up Next</h3>
                    <button
                        className="countdown-close-btn"
                        onClick={handleCancel}
                        aria-label="Cancel autoplay"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="countdown-content">
                    <div className="countdown-video-info">
                        <div className="countdown-timer-circle">
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                {/* Background circle */}
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    stroke="rgba(255, 255, 255, 0.1)"
                                    strokeWidth="6"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    stroke="var(--primary-color, #007bff)"
                                    strokeWidth="6"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    transform="rotate(-90 60 60)"
                                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                                />
                            </svg>
                            <div className="countdown-timer-number">
                                {timeRemaining}
                            </div>
                        </div>

                        <div className="countdown-video-details">
                            <p className="countdown-label">Up Next</p>
                            {nextVideoInfo?.topic && (
                                <p className="countdown-topic-name">{nextVideoInfo.topic}</p>
                            )}
                            <h4 className="countdown-video-name">{nextVideoInfo?.lesson || 'Next video'}</h4>
                        </div>
                    </div>

                    <div className="countdown-actions">
                        <button
                            className="countdown-btn countdown-cancel-btn"
                            onClick={handleCancel}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Cancel
                        </button>
                        <button
                            className="countdown-btn countdown-play-btn"
                            onClick={handlePlayNow}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Play Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
