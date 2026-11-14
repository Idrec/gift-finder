// Buyurtma holatlari. Ranglar rang ko'rlikka tekshirilgan (dataviz validator);
// rang hech qachon yolg'iz ishlatilmaydi — yonida doim nomi yoziladi.
export const ORDER_STATUSES = [
    { value: "new", label: "Yangi", color: "#2a64d6" },
    { value: "confirmed", label: "Tasdiqlangan", color: "#e8a20f" },
    { value: "delivered", label: "Yetkazildi", color: "#1f8a3a" },
    { value: "cancelled", label: "Bekor qilingan", color: "#b9b2ab" },
];

export const STATUS_BY_VALUE = Object.fromEntries(ORDER_STATUSES.map((status) => [status.value, status]));
