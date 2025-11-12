import React, { useState, useEffect } from 'react';
import TagButton from './TagButton';
import { addTags, removeTags, getTagsForCourse } from '../../utils/tagging';

/**
 * TagList component - displays and manages tags for a course
 * @param {string} courseName - The name of the course
 * @param {Function} onTagClick - Handler when a tag is clicked to search
 * @param {boolean} editable - Whether tags can be added/removed (default: true)
 * @param {string} size - Size of tags: 'small', 'medium', 'large' (default: 'small')
 */
export default function TagList({
  courseName,
  onTagClick,
  editable = true,
  size = 'small'
}) {
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [showInput, setShowInput] = useState(false);

  // Load tags on mount and when course changes
  useEffect(() => {
    loadTags();
  }, [courseName]);

  // Listen for tag updates
  useEffect(() => {
    const handleTagUpdate = (e) => {
      if (e.detail.courseName === courseName) {
        setTags(e.detail.tags);
      }
    };

    window.addEventListener('courseTagsUpdated', handleTagUpdate);
    return () => window.removeEventListener('courseTagsUpdated', handleTagUpdate);
  }, [courseName]);

  const loadTags = () => {
    const courseTags = getTagsForCourse(courseName);
    setTags(courseTags);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      const tagsToAdd = newTag.split(',').map(t => t.trim()).filter(t => t.length > 0);
      addTags(courseName, tagsToAdd);
      setNewTag('');
      setShowInput(false);
    }
  };

  const handleRemoveTag = (tag) => {
    removeTags(courseName, [tag]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setNewTag('');
      setShowInput(false);
    }
  };

  return (
    <div className="tag-list">
      {tags.map((tag) => (
        <TagButton
          key={tag}
          tag={tag}
          onClick={onTagClick}
          onRemove={editable ? handleRemoveTag : null}
          removable={editable}
          size={size}
        />
      ))}

      {editable && (
        <>
          {showInput ? (
            <div className="tag-input-container">
              <input
                type="text"
                className="tag-input"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleAddTag}
                placeholder="Add tag..."
                autoFocus
              />
            </div>
          ) : (
            <button
              className="tag-add-button"
              onClick={() => setShowInput(true)}
              type="button"
              title="Add tag"
            >
              + Add Tag
            </button>
          )}
        </>
      )}
    </div>
  );
}
