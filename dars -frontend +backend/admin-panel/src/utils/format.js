const priceFormatter = new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat("uz-UZ", { notation: "compact", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
});
const fullDateFormatter = new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

export const formatPrice = (value) => `${priceFormatter.format(Number(value))} so'm`;

// 1 350 000 -> "1,4 mln so'm"
export const formatCompactPrice = (value) => `${compactFormatter.format(Number(value))} so'm`;

export const formatNumber = (value) => priceFormatter.format(Number(value));

export const formatDate = (value) => dateFormatter.format(new Date(value));

export const formatFullDate = (value) => fullDateFormatter.format(new Date(value));
