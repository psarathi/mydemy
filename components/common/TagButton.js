import { useState, useEffect } from 'react';
import { addTag, removeTag, getTags } from '../../utils/tagging';

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

    const handleToggleTag = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isTagged) {
            removeTag(course, tag);
        } else {
            addTag(course, tag);
        }
    };

    return (
        <button
            className={`tag-btn ${isTagged ? 'active' : ''} ${className}`}
            onClick={handleToggleTag}
            aria-label={isTagged ? `Remove tag ${tag}` : `Add tag ${tag}`}
            title={isTagged ? `Remove tag ${tag}` : `Add tag ${tag}`}
        >
            #{tag}
        </button>
    );
}