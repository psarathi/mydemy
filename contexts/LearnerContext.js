import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {
    GUEST_USER,
    createOrUpdatePinUser,
    getActiveUser,
    getPinUsers,
    hasAdminUser,
    hydrateActiveUserFromStorage,
    importGuestActivityForUser,
    loginWithPin,
    logoutPinUser,
    setActiveUserId,
} from '../utils/pinAuth';

const LearnerContext = createContext({
    activeUser: GUEST_USER,
    users: [],
    hasAdmin: false,
    login: async () => GUEST_USER,
    logout: () => GUEST_USER,
    saveUser: async () => null,
    switchUser: () => GUEST_USER,
});

export function LearnerProvider({children}) {
    const [activeUser, setActiveUser] = useState(GUEST_USER);
    const [users, setUsers] = useState([]);

    const refresh = useCallback(() => {
        setUsers(getPinUsers());
        setActiveUser(getActiveUser());
    }, []);

    useEffect(() => {
        hydrateActiveUserFromStorage();
        refresh();
        window.addEventListener('pinUsersUpdated', refresh);
        window.addEventListener('activePinUserUpdated', refresh);
        return () => {
            window.removeEventListener('pinUsersUpdated', refresh);
            window.removeEventListener('activePinUserUpdated', refresh);
        };
    }, [refresh]);

    const login = useCallback(async (username, pin) => {
        const user = await loginWithPin(username, pin);
        refresh();
        return user;
    }, [refresh]);

    const logout = useCallback(() => {
        const user = logoutPinUser();
        refresh();
        return user;
    }, [refresh]);

    const switchUser = useCallback((userId) => {
        const user = setActiveUserId(userId);
        refresh();
        return user;
    }, [refresh]);

    const saveUser = useCallback(async (userData, options = {}) => {
        const user = await createOrUpdatePinUser(userData);
        if (options.importGuestActivity) {
            importGuestActivityForUser(user.id);
        }
        refresh();
        return user;
    }, [refresh]);

    const value = useMemo(
        () => ({
            activeUser,
            users,
            hasAdmin: hasAdminUser(),
            login,
            logout,
            saveUser,
            switchUser,
        }),
        [activeUser, users, login, logout, saveUser, switchUser]
    );

    return (
        <LearnerContext.Provider value={value}>
            {children}
        </LearnerContext.Provider>
    );
}

export const useLearner = () => useContext(LearnerContext);
