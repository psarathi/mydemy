const USERS_KEY = 'mydemyPinUsers:v1';
const ACTIVE_USER_KEY = 'mydemyActiveUser:v1';
const FAILED_ATTEMPTS_KEY = 'mydemyPinFailures:v1';
const LOCKOUT_LIMIT = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
let currentActiveUserId = 'guest';

export const GUEST_USER = {
    id: 'guest',
    username: 'guest',
    displayName: 'Guest',
    role: 'guest',
    active: true,
};

const safeParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

const normalizeUsername = (username = '') => username.trim().toLowerCase();

const makeUserId = (username) =>
    normalizeUsername(username).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
    `user-${Date.now()}`;

const getStorage = () => (typeof window === 'undefined' ? null : window.localStorage);

const encodeHex = (buffer) =>
    Array.from(new Uint8Array(buffer))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');

export const hashPin = async (pin, salt) => {
    const value = `${salt}:${pin}`;
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
        const data = new TextEncoder().encode(value);
        return encodeHex(await window.crypto.subtle.digest('SHA-256', data));
    }

    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }
    return `fallback-${Math.abs(hash)}`;
};

export const getPinUsers = () => {
    const storage = getStorage();
    if (!storage) return [];
    return safeParse(storage.getItem(USERS_KEY), []);
};

const savePinUsers = (users) => {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(USERS_KEY, JSON.stringify(users));
    window.dispatchEvent(new CustomEvent('pinUsersUpdated', {detail: {users}}));
};

export const getActiveUserId = () => {
    return currentActiveUserId || GUEST_USER.id;
};

export const hydrateActiveUserFromStorage = () => {
    const storage = getStorage();
    const userId = storage?.getItem(ACTIVE_USER_KEY);
    if (!userId || typeof userId !== 'string' || userId.startsWith('[') || userId.startsWith('{')) {
        currentActiveUserId = GUEST_USER.id;
        return currentActiveUserId;
    }
    currentActiveUserId = userId;
    return currentActiveUserId;
};

export const getActiveUser = () => {
    const userId = getActiveUserId();
    return getPinUsers().find((user) => user.id === userId) || GUEST_USER;
};

export const setActiveUserId = (userId) => {
    const storage = getStorage();
    currentActiveUserId = userId || GUEST_USER.id;
    if (!storage) return GUEST_USER;
    storage.setItem(ACTIVE_USER_KEY, userId || GUEST_USER.id);
    const activeUser = getActiveUser();
    window.dispatchEvent(new CustomEvent('activePinUserUpdated', {detail: {activeUser}}));
    return activeUser;
};

export const hasAdminUser = () => getPinUsers().some((user) => user.role === 'admin');

export const createOrUpdatePinUser = async ({
    id,
    username,
    displayName,
    pin,
    role = 'learner',
    active = true,
}) => {
    const cleanUsername = normalizeUsername(username);
    if (!cleanUsername) throw new Error('Username is required');
    if (pin && pin.length < 4) throw new Error('PIN must be at least 4 digits');

    const users = getPinUsers();
    const existing = users.find((user) => user.id === id || user.username === cleanUsername);
    const now = new Date().toISOString();
    const salt = existing?.salt || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const nextUser = {
        ...(existing || {}),
        id: existing?.id || id || makeUserId(cleanUsername),
        username: cleanUsername,
        displayName: displayName?.trim() || username.trim(),
        role,
        active,
        salt,
        updatedAt: now,
        createdAt: existing?.createdAt || now,
    };

    if (pin) {
        nextUser.pinHash = await hashPin(pin, salt);
    }

    if (!nextUser.pinHash) throw new Error('PIN is required');

    savePinUsers([
        ...users.filter((user) => user.id !== nextUser.id && user.username !== cleanUsername),
        nextUser,
    ]);
    return nextUser;
};

const getFailures = () => {
    const storage = getStorage();
    return safeParse(storage?.getItem(FAILED_ATTEMPTS_KEY), {});
};

const saveFailures = (failures) => {
    const storage = getStorage();
    if (storage) storage.setItem(FAILED_ATTEMPTS_KEY, JSON.stringify(failures));
};

export const loginWithPin = async (username, pin) => {
    const cleanUsername = normalizeUsername(username);
    const user = getPinUsers().find(
        (candidate) => candidate.username === cleanUsername && candidate.active
    );
    if (!user) throw new Error('User not found');

    const failures = getFailures();
    const failure = failures[user.id];
    if (failure?.lockedUntil && Date.now() < failure.lockedUntil) {
        throw new Error('Too many attempts. Try again later.');
    }

    const pinHash = await hashPin(pin, user.salt);
    if (pinHash !== user.pinHash) {
        const attempts = (failure?.attempts || 0) + 1;
        failures[user.id] = {
            attempts,
            lockedUntil: attempts >= LOCKOUT_LIMIT ? Date.now() + LOCKOUT_MS : null,
        };
        saveFailures(failures);
        throw new Error('Incorrect PIN');
    }

    delete failures[user.id];
    saveFailures(failures);
    return setActiveUserId(user.id);
};

export const logoutPinUser = () => setActiveUserId(GUEST_USER.id);

export const importGuestActivityForUser = (userId) => {
    const storage = getStorage();
    if (!storage || !userId || userId === GUEST_USER.id) return;
    [
        'courseHistory',
        'courseFavorites',
        'courseTags',
        'mydemyLessonProgress:v1',
        'lessonProgress',
        'mydemyLessonAnnotations:v1',
        'learningPlaylist',
    ].forEach((key) => {
        const scopedKey = `mydemy:user:${userId}:${key}`;
        if (storage.getItem(key) && !storage.getItem(scopedKey)) {
            storage.setItem(scopedKey, storage.getItem(key));
        }
    });
};

export const getUserScopedStorageKey = (key) => {
    const userId = getActiveUserId();
    if (userId === GUEST_USER.id) return key;
    return `mydemy:user:${userId}:${key}`;
};
