import { BASE_CDN_PATH } from '../constants';

export const isLocalhost = (win = (typeof window !== 'undefined' ? window : undefined)) => {
    if (win && win.location && win.location.hostname) {
        return win.location.hostname === 'localhost' || win.location.hostname === '127.0.0.1';
    }
    return false;
};

export const getCdnPath = (win = (typeof window !== 'undefined' ? window : undefined)) => {
    // If NEXT_PUBLIC_BASE_CDN_PATH is explicitly set in env, use it (it will be in BASE_CDN_PATH)
    // However, BASE_CDN_PATH has a default value, so we need to be careful.
    // The requirement is: "uses the full URL... Can we make it relative to the top level domain... The CDN is always going to be on port 5555"

    // If we are on the client side (or a mock window is provided)
    if (win && win.location && win.location.hostname) {
        // If the env var is NOT set (checking process.env directly might be tricky due to inlining, 
        // but let's assume if the user wants to override, they set the env var).
        // A safer bet based on user request: Prefer the current hostname, port 5555.

        // However, if we strictly want to support an ENV override, we should check if it was provided.
        // But constants.js has a default. 
        // Let's implement the logic:
        // Use win.location.hostname + port 5555.

        const hostname = win.location.hostname;
        // If the hostname is localhost, it means we are running locally (npm run dev)
        // In this case, we want to use the BASE_CDN_PATH which points to the actual CDN server (e.g. 192.168.1.141)
        // instead of localhost:5555 where nothing is running.
        if (isLocalhost(win)) {
            return BASE_CDN_PATH;
        }

        return `http://${hostname}:5555`;
    }

    // Fallback for server-side or if window is undefined
    return BASE_CDN_PATH;
};
