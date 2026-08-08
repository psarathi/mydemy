import React from 'react';

export default function AudioSettings({
    isOpen,
    onClose,
    captionsAvailable,
    captionsEnabled,
    onCaptionsChange,
    audioTracks,
    selectedAudioTrack,
    onAudioTrackChange,
}) {
    if (!isOpen) return null;

    return (
        <div className='audio-settings-popover' role='dialog' aria-label='Audio and subtitles settings'>
            <div className='audio-settings-header'>
                <span>Audio &amp; subtitles</span>
                <button
                    className='audio-settings-close'
                    onClick={onClose}
                    aria-label='Close audio and subtitles settings'
                >
                    ×
                </button>
            </div>
            <div className='audio-settings-section'>
                <label className='audio-settings-label' htmlFor='caption-track'>
                    Subtitles
                </label>
                <select
                    id='caption-track'
                    value={captionsEnabled ? 'on' : 'off'}
                    onChange={(event) => onCaptionsChange(event.target.value === 'on')}
                    disabled={!captionsAvailable}
                >
                    <option value='off'>Off</option>
                    {captionsAvailable && <option value='on'>English</option>}
                </select>
                {!captionsAvailable && (
                    <p className='audio-settings-description'>
                        Subtitles are not available for this lesson.
                    </p>
                )}
            </div>
            <div className='audio-settings-section'>
                <label className='audio-settings-label' htmlFor='audio-track'>
                    Audio language
                </label>
                <select
                    id='audio-track'
                    value={selectedAudioTrack}
                    onChange={(event) => onAudioTrackChange(event.target.value)}
                    disabled={audioTracks.length < 2}
                >
                    {audioTracks.length ? (
                        audioTracks.map((track) => (
                            <option key={track.id} value={track.id}>
                                {track.label}
                            </option>
                        ))
                    ) : (
                        <option value='original'>Original audio</option>
                    )}
                </select>
                {audioTracks.length < 2 && (
                    <p className='audio-settings-description'>
                        This video has one audio track.
                    </p>
                )}
            </div>
        </div>
    );
}
