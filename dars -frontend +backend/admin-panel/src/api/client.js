import axios from "axios";

export const API_ROOT = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/";

const TOKEN_KEY = "gift-finder-admin-token";

export function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
}

export function setToken(token) {
    try {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    } catch {
        // localStorage yopiq bo'lsa — token faqat shu sahifa ochiq turganida ishlaydi
    }
}

const client = axios.create({ baseURL: `${API_ROOT}admin/` });

client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Token ${token}`;
    }
    return config;
});

// Token eskirsa yoki o'chirilsa — login sahifasiga qaytarish
let unauthorizedHandler = null;

export function onUnauthorized(handler) {
    unauthorizedHandler = handler;
}

client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            setToken(null);
            unauthorizedHandler?.();
        }
        return Promise.reject(error);
    }
);

export default client;
