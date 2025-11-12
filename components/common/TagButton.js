import React from 'react';

/**
 * TagButton component - displays a clickable tag
 * @param {string} tag - The tag text to display
 * @param {Function} onClick - Handler when tag is clicked to search
 * @param {Function} onRemove - Optional handler to remove the tag
 * @param {boolean} removable - Whether to show remove button (default: false)
 * @param {string} size - Size of the tag: 'small', 'medium', 'large' (default: 'medium')
 */
export default function TagButton({
  tag,
  onClick,
  onRemove,
  removable = false,
  size = 'medium'
}) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(tag);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(tag);
    }
  };

  return (
    <button
      className={`tag-button tag-button-${size}`}
      onClick={handleClick}
      type="button"
      title={`Search for: ${tag}`}
    >
      <span className="tag-text">{tag}</span>
      {removable && onRemove && (
        <span
          className="tag-remove"
          onClick={handleRemove}
          title={`Remove tag: ${tag}`}
        >
          ×
        </span>
      )}
    </button>
  );
}
