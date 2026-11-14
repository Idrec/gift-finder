import axios from "axios";
import client, { API_ROOT } from "./client";

function cleanParams(params = {}) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== "" && value !== null && value !== undefined)
    );
}

export function getErrorMessage(error) {
    if (!error.response) {
        return "Server bilan bog'lanib bo'lmadi. Backend ishlayotganini tekshiring.";
    }
    if (error.response.status === 429) {
        return "Juda ko'p urinish. Bir daqiqadan keyin qayta urinib ko'ring.";
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

// AUTH
export const login = (username, password) =>
    client.post("login/", { username, password }).then((res) => res.data);
export const logout = () => client.post("logout/");
export const fetchMe = () => client.get("me/").then((res) => res.data);

// DASHBOARD
export const fetchStats = (signal) => client.get("stats/", { signal }).then((res) => res.data);

// ORDERS
export const fetchOrders = (params, signal) =>
    client.get("orders/", { params: cleanParams(params), signal }).then((res) => res.data);
export const updateOrderStatus = (id, status) =>
    client.patch(`orders/${id}/`, { status }).then((res) => res.data);
export const deleteOrder = (id) => client.delete(`orders/${id}/`);

// GIFTS
export const fetchGifts = (params, signal) =>
    client.get("gifts/", { params: cleanParams(params), signal }).then((res) => res.data);
export const saveGift = (id, formData) =>
    (id ? client.patch(`gifts/${id}/`, formData) : client.post("gifts/", formData)).then((res) => res.data);
export const deleteGift = (id) => client.delete(`gifts/${id}/`);

// CATEGORIES
export const fetchCategories = (signal) => client.get("categories/", { signal }).then((res) => res.data);
export const saveCategory = (id, name) =>
    (id ? client.patch(`categories/${id}/`, { name }) : client.post("categories/", { name })).then((res) => res.data);
export const deleteCategory = (id) => client.delete(`categories/${id}/`);

// "Kimga?" variantlari — ochiq API'dan
export const fetchRecipients = (signal) => axios.get(`${API_ROOT}recipients/`, { signal }).then((res) => res.data);
