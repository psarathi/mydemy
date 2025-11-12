import {
  addTags,
  removeTags,
  getTagsForCourse,
  getCourseTags,
  getAllTags,
  getCoursesByTag,
  clearCourseTags,
  clearAllTags
} from '../../utils/tagging';

describe('Tagging Utility Functions', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear any dispatched events
    jest.clearAllMocks();
  });

  describe('addTags', () => {
    it('should add tags to a course', () => {
      const tags = addTags('React Course', ['javascript', 'frontend']);

      expect(tags).toEqual(['javascript', 'frontend']);

      const stored = JSON.parse(localStorage.getItem('courseTags'));
      expect(stored['React Course']).toEqual(['javascript', 'frontend']);
    });

    it('should normalize tags to lowercase', () => {
      const tags = addTags('React Course', ['JavaScript', 'FRONTEND']);

      expect(tags).toEqual(['javascript', 'frontend']);
    });

    it('should trim whitespace from tags', () => {
      const tags = addTags('React Course', ['  javascript  ', '  frontend  ']);

      expect(tags).toEqual(['javascript', 'frontend']);
    });

    it('should deduplicate tags', () => {
      addTags('React Course', ['javascript']);
      const tags = addTags('React Course', ['javascript', 'frontend']);

      expect(tags).toEqual(['javascript', 'frontend']);
    });

    it('should filter out empty tags', () => {
      const tags = addTags('React Course', ['javascript', '', '  ', 'frontend']);

      expect(tags).toEqual(['javascript', 'frontend']);
    });

    it('should dispatch courseTagsUpdated event', () => {
      const eventListener = jest.fn();
      window.addEventListener('courseTagsUpdated', eventListener);

      addTags('React Course', ['javascript']);

      expect(eventListener).toHaveBeenCalled();
      const event = eventListener.mock.calls[0][0];
      expect(event.detail.courseName).toBe('React Course');
      expect(event.detail.tags).toEqual(['javascript']);

      window.removeEventListener('courseTagsUpdated', eventListener);
    });
  });

  describe('removeTags', () => {
    beforeEach(() => {
      addTags('React Course', ['javascript', 'frontend', 'react']);
    });

    it('should remove specified tags', () => {
      const tags = removeTags('React Course', ['frontend']);

      expect(tags).toEqual(['javascript', 'react']);
    });

    it('should remove multiple tags', () => {
      const tags = removeTags('React Course', ['frontend', 'react']);

      expect(tags).toEqual(['javascript']);
    });

    it('should normalize tags before removing', () => {
      const tags = removeTags('React Course', ['FRONTEND']);

      expect(tags).toEqual(['javascript', 'react']);
    });

    it('should remove course entry when all tags are removed', () => {
      removeTags('React Course', ['javascript', 'frontend', 'react']);

      const stored = JSON.parse(localStorage.getItem('courseTags'));
      expect(stored['React Course']).toBeUndefined();
    });

    it('should return empty array for non-existent course', () => {
      const tags = removeTags('Non-existent Course', ['javascript']);

      expect(tags).toEqual([]);
    });

    it('should dispatch courseTagsUpdated event', () => {
      const eventListener = jest.fn();
      window.addEventListener('courseTagsUpdated', eventListener);

      removeTags('React Course', ['frontend']);

      expect(eventListener).toHaveBeenCalled();
      const event = eventListener.mock.calls[0][0];
      expect(event.detail.courseName).toBe('React Course');
      expect(event.detail.tags).toEqual(['javascript', 'react']);

      window.removeEventListener('courseTagsUpdated', eventListener);
    });
  });

  describe('getTagsForCourse', () => {
    it('should return tags for a course', () => {
      addTags('React Course', ['javascript', 'frontend']);

      const tags = getTagsForCourse('React Course');

      expect(tags).toEqual(['javascript', 'frontend']);
    });

    it('should return empty array for course with no tags', () => {
      const tags = getTagsForCourse('Non-existent Course');

      expect(tags).toEqual([]);
    });
  });

  describe('getCourseTags', () => {
    it('should return all course tags', () => {
      addTags('React Course', ['javascript', 'frontend']);
      addTags('Node Course', ['javascript', 'backend']);

      const allTags = getCourseTags();

      expect(allTags).toEqual({
        'React Course': ['javascript', 'frontend'],
        'Node Course': ['javascript', 'backend']
      });
    });

    it('should return empty object when no tags exist', () => {
      const allTags = getCourseTags();

      expect(allTags).toEqual({});
    });

    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('courseTags', 'invalid json');

      const allTags = getCourseTags();

      expect(allTags).toEqual({});
    });
  });

  describe('getAllTags', () => {
    it('should return all unique tags sorted alphabetically', () => {
      addTags('React Course', ['javascript', 'frontend', 'react']);
      addTags('Node Course', ['javascript', 'backend', 'node']);

      const tags = getAllTags();

      expect(tags).toEqual(['backend', 'frontend', 'javascript', 'node', 'react']);
    });

    it('should deduplicate tags across courses', () => {
      addTags('React Course', ['javascript']);
      addTags('Node Course', ['javascript']);

      const tags = getAllTags();

      expect(tags).toEqual(['javascript']);
    });

    it('should return empty array when no tags exist', () => {
      const tags = getAllTags();

      expect(tags).toEqual([]);
    });
  });

  describe('getCoursesByTag', () => {
    beforeEach(() => {
      addTags('React Course', ['javascript', 'frontend']);
      addTags('Node Course', ['javascript', 'backend']);
      addTags('Vue Course', ['javascript', 'frontend']);
    });

    it('should return courses with specified tag', () => {
      const courses = getCoursesByTag('frontend');

      expect(courses).toEqual(['React Course', 'Vue Course']);
    });

    it('should normalize tag before searching', () => {
      const courses = getCoursesByTag('FRONTEND');

      expect(courses).toEqual(['React Course', 'Vue Course']);
    });

    it('should return empty array when tag not found', () => {
      const courses = getCoursesByTag('python');

      expect(courses).toEqual([]);
    });

    it('should handle whitespace in tag', () => {
      const courses = getCoursesByTag('  frontend  ');

      expect(courses).toEqual(['React Course', 'Vue Course']);
    });
  });

  describe('clearCourseTags', () => {
    beforeEach(() => {
      addTags('React Course', ['javascript', 'frontend']);
      addTags('Node Course', ['javascript', 'backend']);
    });

    it('should clear tags for specified course', () => {
      clearCourseTags('React Course');

      const stored = JSON.parse(localStorage.getItem('courseTags'));
      expect(stored['React Course']).toBeUndefined();
      expect(stored['Node Course']).toEqual(['javascript', 'backend']);
    });

    it('should dispatch courseTagsUpdated event', () => {
      const eventListener = jest.fn();
      window.addEventListener('courseTagsUpdated', eventListener);

      clearCourseTags('React Course');

      expect(eventListener).toHaveBeenCalled();
      const event = eventListener.mock.calls[0][0];
      expect(event.detail.courseName).toBe('React Course');
      expect(event.detail.tags).toEqual([]);

      window.removeEventListener('courseTagsUpdated', eventListener);
    });
  });

  describe('clearAllTags', () => {
    beforeEach(() => {
      addTags('React Course', ['javascript', 'frontend']);
      addTags('Node Course', ['javascript', 'backend']);
    });

    it('should remove all tags from localStorage', () => {
      clearAllTags();

      const stored = localStorage.getItem('courseTags');
      expect(stored).toBeNull();
    });

    it('should dispatch courseTagsUpdated event', () => {
      const eventListener = jest.fn();
      window.addEventListener('courseTagsUpdated', eventListener);

      clearAllTags();

      expect(eventListener).toHaveBeenCalled();
      const event = eventListener.mock.calls[0][0];
      expect(event.detail.courseName).toBeNull();
      expect(event.detail.tags).toEqual([]);

      window.removeEventListener('courseTagsUpdated', eventListener);
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent tag additions', () => {
      addTags('React Course', ['javascript']);
      addTags('React Course', ['frontend']);
      addTags('React Course', ['react']);

      const tags = getTagsForCourse('React Course');

      expect(tags).toEqual(['javascript', 'frontend', 'react']);
    });

    it('should handle special characters in tags', () => {
      const tags = addTags('React Course', ['c++', 'c#', 'node.js']);

      expect(tags).toEqual(['c++', 'c#', 'node.js']);
    });

    it('should handle very long tag names', () => {
      const longTag = 'a'.repeat(100);
      const tags = addTags('React Course', [longTag]);

      expect(tags).toEqual([longTag]);
    });

    it('should handle empty course name', () => {
      const tags = addTags('', ['javascript']);

      expect(tags).toEqual(['javascript']);

      const courseTags = getCourseTags();
      expect(courseTags['']).toEqual(['javascript']);
    });
  });
});
