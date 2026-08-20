import {
    createOrUpdatePinUser,
    getActiveUser,
    hydratePinUsersFromDatabase,
    getUserScopedStorageKey,
    loginWithPin,
    logoutPinUser,
} from '../../utils/pinAuth';

describe('pinAuth utilities', () => {
    beforeEach(() => {
        localStorage.clear();
        global.fetch = jest.fn();
        jest.spyOn(Date, 'now').mockReturnValue(1784100000000);
        jest.spyOn(Math, 'random').mockReturnValue(0.123456);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete global.fetch;
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
        expect(fetch).toHaveBeenCalledWith(
            '/api/pin-users',
            expect.objectContaining({
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
            })
        );

        const activeUser = await loginWithPin('partha', '1234');
        expect(activeUser.id).toBe(user.id);
        expect(getActiveUser().displayName).toBe('Partha');
    });

    test('hydrates PIN users from the database endpoint', async () => {
        fetch.mockResolvedValue({
            ok: true,
            json: async () => ({
                users: [
                    {
                        id: 'stored-user',
                        username: 'stored',
                        displayName: 'Stored User',
                        role: 'learner',
                        active: true,
                        salt: 'salt',
                        pinHash: 'hash',
                    },
                ],
            }),
        });

        const users = await hydratePinUsersFromDatabase();

        expect(fetch).toHaveBeenCalledWith('/api/pin-users');
        expect(users).toHaveLength(1);
        expect(JSON.parse(localStorage.getItem('mydemyPinUsers:v1'))[0].id).toBe('stored-user');
    });

    test('keeps cached PIN users when the database is empty', async () => {
        localStorage.setItem(
            'mydemyPinUsers:v1',
            JSON.stringify([
                {
                    id: 'cached-user',
                    username: 'cached',
                    displayName: 'Cached User',
                    role: 'learner',
                    active: true,
                    salt: 'salt',
                    pinHash: 'hash',
                },
            ])
        );
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({users: []}),
        });

        const users = await hydratePinUsersFromDatabase();

        expect(users[0].id).toBe('cached-user');
        expect(fetch).toHaveBeenLastCalledWith(
            '/api/pin-users',
            expect.objectContaining({method: 'PUT'})
        );
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
