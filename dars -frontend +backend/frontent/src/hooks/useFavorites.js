import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addFavorite, fetchFavorites, removeFavorite } from "../api/gifts";

export function useFavorites(onError) {
    const [favorites, setFavorites] = useState([]); // sovg'a obyektlari
    const [status, setStatus] = useState("loading"); // loading | ready | error
    const [version, setVersion] = useState(0);
    const pending = useRef(new Set());

    useEffect(() => {
        let ignore = false;

        fetchFavorites()
            .then((data) => {
                if (ignore) return;
                setFavorites(data.map((favorite) => favorite.gift));
                setStatus("ready");
            })
            .catch(() => {
                if (!ignore) setStatus("error");
            });

        return () => {
            ignore = true;
        };
    }, [version]);

    const ids = useMemo(() => new Set(favorites.map((gift) => gift.id)), [favorites]);

    const reload = useCallback(() => {
        setStatus("loading");
        setVersion((v) => v + 1);
    }, []);

    const toggle = useCallback(async (gift) => {
        // Bir sovg'a uchun parallel so'rov yubormaymiz
        if (pending.current.has(gift.id)) return;
        pending.current.add(gift.id);

        const wasFavorite = ids.has(gift.id);
        const withoutGift = (list) => list.filter((item) => item.id !== gift.id);

        // Optimistik yangilash: UI darhol o'zgaradi
        setFavorites((list) => (wasFavorite ? withoutGift(list) : [gift, ...list]));

        try {
            if (wasFavorite) {
                await removeFavorite(gift.id);
            } else {
                await addFavorite(gift.id);
            }
        } catch (error) {
            const alreadyRemoved = wasFavorite && error.response?.status === 404;

            if (!alreadyRemoved) {
                setFavorites((list) => (wasFavorite ? [gift, ...withoutGift(list)] : withoutGift(list)));
                onError?.("Sevimlilarni saqlab bo'lmadi. Qayta urinib ko'ring.", "error");
            }
        } finally {
            pending.current.delete(gift.id);
        }
    }, [ids, onError]);

    return { favorites, ids, status, toggle, reload };
}
