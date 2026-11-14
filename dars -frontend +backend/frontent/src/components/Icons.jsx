const base = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
};

export function GiftIcon() {
    return (
        <svg {...base}>
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13" />
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5" />
        </svg>
    );
}

export function HeartIcon({ filled = false }) {
    return (
        <svg {...base} fill={filled ? "currentColor" : "none"}>
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
    );
}

export function PlusIcon() {
    return (
        <svg {...base}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    );
}

export function CloseIcon() {
    return (
        <svg {...base}>
            <path d="M18 6 6 18M6 6l12 12" />
        </svg>
    );
}

export function GridIcon() {
    return (
        <svg {...base}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}

export function BagIcon() {
    return (
        <svg {...base}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    );
}

export function MinusIcon() {
    return (
        <svg {...base}>
            <path d="M5 12h14" />
        </svg>
    );
}

export function CheckIcon() {
    return (
        <svg {...base}>
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}
