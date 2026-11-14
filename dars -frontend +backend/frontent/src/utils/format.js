const priceFormatter = new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 0 });

export function formatPrice(value) {
    return `${priceFormatter.format(Number(value))} so'm`;
}

const dateFormatter = new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

export function formatDate(value) {
    return dateFormatter.format(new Date(value));
}
