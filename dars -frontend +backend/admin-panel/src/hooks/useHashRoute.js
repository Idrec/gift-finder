import { useSyncExternalStore } from "react";

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
