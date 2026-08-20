jest.mock('fs/promises', () => ({
    readFile: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
}));

import fs from 'fs/promises';
import handler from '../../../pages/api/pin-users';

const createResponse = () => {
    const res = {
        statusCode: 200,
        headers: {},
        body: null,
        status: jest.fn((code) => {
            res.statusCode = code;
            return res;
        }),
        json: jest.fn((body) => {
            res.body = body;
            return res;
        }),
        setHeader: jest.fn((name, value) => {
            res.headers[name] = value;
        }),
    };
    return res;
};

describe('/api/pin-users', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns persisted PIN users', async () => {
        const users = [{id: 'learner', username: 'learner', pinHash: 'hash'}];
        fs.readFile.mockResolvedValue(JSON.stringify(users));
        const res = createResponse();

        await handler({method: 'GET'}, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.body).toEqual({users});
    });

    test('returns an empty user list before the database file exists', async () => {
        fs.readFile.mockRejectedValue(Object.assign(new Error('missing'), {code: 'ENOENT'}));
        const res = createResponse();

        await handler({method: 'GET'}, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.body).toEqual({users: []});
    });

    test('persists sanitized PIN users', async () => {
        const res = createResponse();

        await handler(
            {
                method: 'PUT',
                body: {
                    users: [
                        {
                            id: 'admin',
                            username: 'admin',
                            displayName: 'Admin',
                            role: 'admin',
                            active: true,
                            salt: 'salt',
                            pinHash: 'hash',
                            ignored: 'not persisted',
                        },
                    ],
                },
            },
            res
        );

        expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('data'), {recursive: true});
        expect(fs.writeFile).toHaveBeenCalledWith(
            expect.stringContaining('pin-users.json'),
            expect.not.stringContaining('not persisted')
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.body.users[0]).not.toHaveProperty('ignored');
    });

    test('rejects malformed PUT payloads', async () => {
        const res = createResponse();

        await handler({method: 'PUT', body: {users: {id: 'bad'}}}, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(fs.writeFile).not.toHaveBeenCalled();
    });
});
