import {
    createOrUpdatePinUser,
    getActiveUser,
    getUserScopedStorageKey,
    loginWithPin,
    logoutPinUser,
} from '../../utils/pinAuth';

describe('pinAuth utilities', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.spyOn(Date, 'now').mockReturnValue(1784100000000);
        jest.spyOn(Math, 'random').mockReturnValue(0.123456);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('creates a PIN user and logs in with the correct PIN', async () => {
        const user = await createOrUpdatePinUser({
            username: 'Partha',
            displayName: 'Partha',
            pin: '1234',
            role: 'admin',
        });

        expect(user.pinHash).toBeTruthy();
        expect(user.pinHash).not.toBe('1234');

        const activeUser = await loginWithPin('partha', '1234');
        expect(activeUser.id).toBe(user.id);
        expect(getActiveUser().displayName).toBe('Partha');
    });

    test('rejects bad PIN attempts and keeps the guest user active', async () => {
        await createOrUpdatePinUser({
            username: 'learner',
            displayName: 'Learner',
            pin: '4321',
        });

        await expect(loginWithPin('learner', '1111')).rejects.toThrow('Incorrect PIN');
        expect(getActiveUser().id).toBe('guest');
    });

    test('locks repeated failed attempts temporarily', async () => {
        await createOrUpdatePinUser({
            username: 'learner',
            displayName: 'Learner',
            pin: '4321',
        });

        for (let attempt = 0; attempt < 5; attempt += 1) {
            await expect(loginWithPin('learner', '1111')).rejects.toThrow('Incorrect PIN');
        }

        await expect(loginWithPin('learner', '4321')).rejects.toThrow('Too many attempts');
    });

    test('scopes activity keys to the active PIN user', async () => {
        const user = await createOrUpdatePinUser({
            username: 'student',
            displayName: 'Student',
            pin: '2222',
        });
        await loginWithPin('student', '2222');

        expect(getUserScopedStorageKey('courseHistory')).toBe(
            `mydemy:user:${user.id}:courseHistory`
        );

        logoutPinUser();
        expect(getUserScopedStorageKey('courseHistory')).toBe('courseHistory');
    });
});
