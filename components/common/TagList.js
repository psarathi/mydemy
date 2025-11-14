import { useState, useEffect } from 'react';
import { getUniqueTags } from '@/lib/tags/tagging';

export default function TagList({ onTagClick }) {
    const [uniqueTags, setUniqueTags] = useState([]);

    useEffect(() => {
        setUniqueTags(getUniqueTags());

        const handleTagUpdate = () => {
            setUniqueTags(getUniqueTags());
        };

        window.addEventListener('courseTagsUpdated', handleTagUpdate);
        return () => window.removeEventListener('courseTagsUpdated', handleTagUpdate);
    }, []);

    return (
        <div className="tag-list">
            <h3>Tags</h3>
            {uniqueTags.length > 0 ? (
                <ul>
                    {uniqueTags.map(tag => (
                        <li key={tag}>
                            <button onClick={() => onTagClick(tag)}>#{tag}</button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No tags yet.</p>
            )}
        </div>
    );
}