import api from "./axios";
import { getSessionKey } from "./session";

const sessionHeaders = () => ({ "X-Session-Key": getSessionKey() });

// Bo'sh filtrlarni so'rovga qo'shmaymiz
function cleanParams(params) {
    return Object.fromEntries(
        Object.entries(params).filter(
            ([, value]) => value !== "" && value !== null && value !== undefined
        )
    );
}

export function getErrorMessage(error) {
    if (!error.response) {
        return "Server bilan bog'lanib bo'lmadi. Backend ishlayotganini tekshiring.";
    }

    return error.response.data?.detail ?? "Kutilmagan xatolik yuz berdi.";
}

// DRF xatolari: { field: ["xabar"] } -> { field: "xabar" }
export function flattenErrors(data) {
    const errors = {};

    for (const [field, messages] of Object.entries(data ?? {})) {
        const message = Array.isArray(messages) ? messages[0] : String(messages);
        errors[field === "non_field_errors" || field === "detail" ? "form" : field] = message;
    }

    return errors;
}

export const fetchGifts = (params, signal) =>
    api.get("gifts/", { params: cleanParams(params), signal }).then((res) => res.data);

export const fetchCategories = () =>
    api.get("categories/").then((res) => res.data);

export const fetchRecipients = () =>
    api.get("recipients/").then((res) => res.data);

export const createGift = (formData) =>
    api.post("gifts/", formData).then((res) => res.data);

export const fetchFavorites = () =>
    api.get("favorites/", { headers: sessionHeaders() }).then((res) => res.data);

export const addFavorite = (giftId) =>
    api.post("favorites/", { gift_id: giftId }, { headers: sessionHeaders() });

export const removeFavorite = (giftId) =>
    api.delete(`favorites/${giftId}/`, { headers: sessionHeaders() });

export const fetchOrders = () =>
    api.get("orders/", { headers: sessionHeaders() }).then((res) => res.data);

export const createOrder = (data) =>
    api.post("orders/", data, { headers: sessionHeaders() }).then((res) => res.data);
