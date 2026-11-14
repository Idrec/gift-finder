// Login o'rniga: har bir brauzer uchun anonim kalit localStorage'da saqlanadi.
// Sevimlilar shu kalitga bog'lanadi.

const STORAGE_KEY = "gift-finder-session";

let sessionKey = null;

function generateKey() {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    // randomUUID faqat xavfsiz kontekstda (https yoki localhost) bor
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const random = (Math.random() * 16) | 0;
        return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
    });
}

export function getSessionKey() {
    if (sessionKey) {
        return sessionKey;
    }

    try {
        sessionKey = localStorage.getItem(STORAGE_KEY);

        if (!sessionKey) {
            sessionKey = generateKey();
            localStorage.setItem(STORAGE_KEY, sessionKey);
        }
    } catch {
        // localStorage yopiq bo'lsa (masalan, maxfiy rejim) — faqat shu tab uchun
        sessionKey = sessionKey || generateKey();
    }

    return sessionKey;
}
