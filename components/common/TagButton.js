import { useState, useEffect } from 'react';
import { removeTag, getTags } from '../../utils/tagging';

export default function TagButton({ course, tag, className = '' }) {
    const [isTagged, setIsTagged] = useState(false);

    useEffect(() => {
        setIsTagged(getTags(course.name).includes(tag));

        const handleTagUpdate = (event) => {
            if (event.detail.courseName === course.name) {
                setIsTagged(event.detail.tags.includes(tag));
            }
        };

        window.addEventListener('courseTagsUpdated', handleTagUpdate);
        return () => window.removeEventListener('courseTagsUpdated', handleTagUpdate);
    }, [course.name, tag]);

    const handleClick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Dispatch tag click event to trigger search
        window.dispatchEvent(new CustomEvent('tagClicked', { detail: { tag } }));
    };

    const handleRemoveTag = (e) => {
        e.preventDefault();
        e.stopPropagation();

        removeTag(course, tag);
    };

    return (
        <button
            className={`tag-button ${isTagged ? 'active' : ''} ${className}`}
            onClick={handleClick}
            aria-label={`Search for courses with tag ${tag}`}
            title={`Search for courses with tag ${tag}`}
        >
            #{tag}
            <span
                className="tag-remove"
                onClick={handleRemoveTag}
                aria-label={`Remove tag ${tag}`}
                title={`Remove tag ${tag}`}
            >
                ×
            </span>
        </button>
    );
}