import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../api/admin";

// Ma'lumot yuklash: { data, error, loading, reload }.
// `key` o'zgarsa (masalan, filtr) — qayta yuklanadi; eski so'rov bekor qilinadi.
export function useAsync(load, key) {
    const [state, setState] = useState({ key: null, data: null, error: null });
    const [version, setVersion] = useState(0);
    const requestKey = `${key}|${version}`;

    useEffect(() => {
        const controller = new AbortController();

        load(controller.signal)
            .then((data) => setState({ key: requestKey, data, error: null }))
            .catch((error) => {
                if (!controller.signal.aborted) {
                    setState((prev) => ({ key: requestKey, data: prev.data, error: getErrorMessage(error) }));
                }
            });

        return () => controller.abort();
        // `load` har renderda yangi bo'ladi; qayta yuklash faqat `requestKey` bo'yicha
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestKey]);

    const reload = useCallback(() => setVersion((v) => v + 1), []);

    return {
        data: state.data,
        error: state.error,
        loading: state.key !== requestKey,
        reload,
        setData: (updater) => setState((prev) => ({ ...prev, data: updater(prev.data) })),
    };
}
