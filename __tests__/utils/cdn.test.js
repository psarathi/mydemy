import { getCdnPath } from '../../utils/cdn';
import { BASE_CDN_PATH } from '../../constants';

describe('getCdnPath', () => {
    it('should return BASE_CDN_PATH when window is undefined (server-side mock)', () => {
        expect(getCdnPath(null)).toBe(BASE_CDN_PATH);
    });

    it('should return URL with current hostname and port 5555 for given window object', () => {
        const mockWindow = {
            location: {
                hostname: 'my-local-machine.local'
            }
        };

        expect(getCdnPath(mockWindow)).toBe('http://my-local-machine.local:5555');
    });

    it('should return BASE_CDN_PATH when hostname is localhost', () => {
        const mockWindow = {
            location: {
                hostname: 'localhost'
            }
        };

        expect(getCdnPath(mockWindow)).toBe(BASE_CDN_PATH);
    });

    // Optional: Test default behavior if possible, but testing the logic via injection is sufficient.
});
