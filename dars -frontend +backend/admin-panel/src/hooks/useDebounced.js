import { useEffect, useState } from "react";

// Qidiruv maydoni: har bir harf uchun so'rov yubormaslik
export function useDebounced(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
