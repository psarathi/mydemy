import fs from 'fs/promises';
import path from 'path';

const dataDir = path.join(process.cwd(), 'data');
const usersPath = path.join(dataDir, 'pin-users.json');

const readUsers = async () => {
    try {
        const file = await fs.readFile(usersPath, 'utf-8');
        const users = JSON.parse(file);
        return Array.isArray(users) ? users : [];
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};

const writeUsers = async (users) => {
    await fs.mkdir(dataDir, {recursive: true});
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
};

const sanitizeUser = (user) => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    active: user.active,
    salt: user.salt,
    pinHash: user.pinHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const users = await readUsers();
        res.status(200).json({users});
        return;
    }

    if (req.method === 'PUT') {
        const users = Array.isArray(req.body?.users) ? req.body.users.map(sanitizeUser) : null;
        if (!users) {
            res.status(400).json({error: 'users array is required'});
            return;
        }

        await writeUsers(users);
        res.status(200).json({users});
        return;
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).json({error: `Method ${req.method} not allowed`});
}
