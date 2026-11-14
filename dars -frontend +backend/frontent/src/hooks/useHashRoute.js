import { useSyncExternalStore } from "react";

// Oddiy hash-router: "#/" — bosh sahifa, "#/favorites" — sevimlilar

function subscribe(callback) {
    window.addEventListener("hashchange", callback);
    return () => window.removeEventListener("hashchange", callback);
}

function getRoute() {
    return window.location.hash.replace(/^#/, "") || "/";
}

export function useHashRoute() {
    return useSyncExternalStore(subscribe, getRoute);
}

export function navigate(path) {
    window.location.hash = path;
}
