import { addTag, removeTag, getTags, getAllTags, getUniqueTags, getCoursesByTag, clearCourseTags, clearAllTags } from '../../utils/tagging';

describe('Tagging Utility Functions', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('addTag', () => {
        it('should add a tag to a course', () => {
            const course = { name: 'Test Course' };
            addTag(course, 'test-tag');
            expect(getTags('Test Course')).toEqual(['test-tag']);
        });

        it('should normalize tags to lowercase', () => {
            const course = { name: 'Test Course' };
            addTag(course, 'JavaScript');
            expect(getTags('Test Course')).toEqual(['javascript']);
        });

        it('should trim whitespace from tags', () => {
            const course = { name: 'Test Course' };
            addTag(course, '  test-tag  ');
            expect(getTags('Test Course')).toEqual(['test-tag']);
        });

        it('should deduplicate tags', () => {
            const course = { name: 'Test Course' };
            addTag(course, 'test-tag');
            addTag(course, 'test-tag');
            expect(getTags('Test Course')).toEqual(['test-tag']);
        });

        it('should filter out empty tags', () => {
            const course = { name: 'Test Course' };
            addTag(course, 'tag1');
            addTag(course, '');
            addTag(course, '  ');
            expect(getTags('Test Course')).toEqual(['tag1']);
        });

        it('should dispatch courseTagsUpdated event', () => {
            const course = { name: 'Test Course' };
            const eventListener = jest.fn();
            window.addEventListener('courseTagsUpdated', eventListener);
            addTag(course, 'new-tag');
            expect(eventListener).toHaveBeenCalledTimes(1);
            expect(eventListener.mock.calls[0][0].detail.courseName).toBe('Test Course');
            expect(eventListener.mock.calls[0][0].detail.tags).toEqual(['new-tag']);
        });
    });

    describe('removeTag', () => {
        beforeEach(() => {
            const course = { name: 'Test Course' };
            addTag(course, 'tag1');
            addTag(course, 'tag2');
            addTag(course, 'tag3');
        });

        it('should remove a specified tag', () => {
            const course = { name: 'Test Course' };
            removeTag(course, 'tag2');
            expect(getTags('Test Course')).toEqual(['tag1', 'tag3']);
        });

        it('should normalize tags before removing', () => {
            const course = { name: 'Test Course' };
            removeTag(course, 'TAG1');
            expect(getTags('Test Course')).toEqual(['tag2', 'tag3']);
        });

        it('should trim whitespace from tags before removing', () => {
            const course = { name: 'Test Course' };
            removeTag(course, '  tag3  ');
            expect(getTags('Test Course')).toEqual(['tag1', 'tag2']);
        });

        it('should remove course entry when all tags are removed', () => {
            const course = { name: 'Test Course' };
            removeTag(course, 'tag1');
            removeTag(course, 'tag2');
            removeTag(course, 'tag3');
            expect(getAllTags()).toEqual({});
        });

        it('should not remove tags for non-existent course', () => {
            const course = { name: 'Non-existent Course' };
            removeTag(course, 'tag1');
            expect(getTags('Test Course')).toEqual(['tag1', 'tag2', 'tag3']);
        });

        it('should dispatch courseTagsUpdated event', () => {
            const course = { name: 'Test Course' };
            const eventListener = jest.fn();
            window.addEventListener('courseTagsUpdated', eventListener);
            removeTag(course, 'tag1');
            expect(eventListener).toHaveBeenCalledTimes(1);
            expect(eventListener.mock.calls[0][0].detail.courseName).toBe('Test Course');
            expect(eventListener.mock.calls[0][0].detail.tags).toEqual(['tag2', 'tag3']);
        });
    });

    describe('getTags', () => {
        it('should return tags for a course', () => {
            const course = { name: 'Test Course' };
            addTag(course, 'tag1');
            addTag(course, 'tag2');
            expect(getTags('Test Course')).toEqual(['tag1', 'tag2']);
        });

        it('should return empty array for course with no tags', () => {
            expect(getTags('Non-existent Course')).toEqual([]);
        });
    });

    describe('getAllTags', () => {
        it('should return all course tags', () => {
            const course1 = { name: 'Course 1' };
            const course2 = { name: 'Course 2' };
            addTag(course1, 'tagA');
            addTag(course2, 'tagB');
            expect(getAllTags()).toEqual({
                'Course 1': ['taga'],
                'Course 2': ['tagb'],
            });
        });

        it('should return empty object when no tags exist', () => {
            expect(getAllTags()).toEqual({});
        });

        it('should handle corrupted localStorage data', () => {
            localStorage.setItem('courseTags', 'invalid json');
            expect(getAllTags()).toEqual({});
        });
    });

    describe('getUniqueTags', () => {
        it('should return all unique tags sorted alphabetically', () => {
            addTag({ name: 'Course 1' }, 'javascript');
            addTag({ name: 'Course 2' }, 'frontend');
            addTag({ name: 'Course 3' }, 'react');
            addTag({ name: 'Course 4' }, 'javascript');
            expect(getUniqueTags()).toEqual(['frontend', 'javascript', 'react']);
        });

        it('should return empty array when no tags exist', () => {
            expect(getUniqueTags()).toEqual([]);
        });
    });

    describe('getCoursesByTag', () => {
        beforeEach(() => {
            addTag({ name: 'Course A' }, 'frontend');
            addTag({ name: 'Course B' }, 'backend');
            addTag({ name: 'Course C' }, 'frontend');
            addTag({ name: 'Course D' }, 'database');
        });

        it('should return courses with specified tag', () => {
            expect(getCoursesByTag('frontend')).toEqual(['Course A', 'Course C']);
        });

        it('should normalize tag before searching', () => {
            expect(getCoursesByTag('FRONTEND')).toEqual(['Course A', 'Course C']);
        });

        it('should trim whitespace from tag before searching', () => {
            expect(getCoursesByTag('  frontend  ')).toEqual(['Course A', 'Course C']);
        });

        it('should return empty array when tag not found', () => {
            expect(getCoursesByTag('nonexistent')).toEqual([]);
        });
    });

    describe('clearCourseTags', () => {
        beforeEach(() => {
            addTag({ name: 'Course 1' }, 'tag1');
            addTag({ name: 'Course 1' }, 'tag2');
            addTag({ name: 'Course 2' }, 'tagA');
        });

        it('should clear tags for specified course', () => {
            clearCourseTags('Course 1');
            expect(getTags('Course 1')).toEqual([]);
            expect(getAllTags()).toEqual({ 'Course 2': ['taga'] });
        });

        it('should dispatch courseTagsUpdated event', () => {
            const eventListener = jest.fn();
            window.addEventListener('courseTagsUpdated', eventListener);
            clearCourseTags('Course 1');
            expect(eventListener).toHaveBeenCalledTimes(1);
            expect(eventListener.mock.calls[0][0].detail.courseName).toBe('Course 1');
            expect(eventListener.mock.calls[0][0].detail.tags).toEqual([]);
        });
    });

    describe('clearAllTags', () => {
        beforeEach(() => {
            addTag({ name: 'Course 1' }, 'tag1');
            addTag({ name: 'Course 2' }, 'tagA');
        });

        it('should remove all tags from localStorage', () => {
            clearAllTags();
            expect(getAllTags()).toEqual({});
        });

        it('should dispatch courseTagsUpdated event', () => {
            const eventListener = jest.fn();
            window.addEventListener('courseTagsUpdated', eventListener);
            clearAllTags();
            expect(eventListener).toHaveBeenCalledTimes(1);
            expect(eventListener.mock.calls[0][0].detail.allTags).toEqual({});
        });
    });

    describe('Edge Cases', () => {
        it('should handle special characters in tags', () => {
            const course = { name: 'Special Course' };
            addTag(course, 'c++');
            addTag(course, 'c#');
            addTag(course, 'node.js');
            expect(getTags('Special Course')).toEqual(['c++', 'c#', 'node.js']);
        });

        it('should handle very long tag names', () => {
            const course = { name: 'Long Tag Course' };
            const longTag = 'a'.repeat(100);
            addTag(course, longTag);
            expect(getTags('Long Tag Course')).toEqual([longTag]);
        });

        it('should handle empty course name', () => {
            const course = { name: '' };
            addTag(course, 'empty-course-tag');
            expect(getTags('')).toEqual(['empty-course-tag']);
        });
    });
});