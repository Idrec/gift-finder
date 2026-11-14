import GiftCard from "./GiftCard";

export function GiftGrid({ gifts, favoriteIds, onToggleFavorite, onOrder, busy = false }) {
    return (
        <div className={`grid ${busy ? "is-busy" : ""}`} aria-busy={busy}>
            {gifts.map((gift) => (
                <GiftCard
                    key={gift.id}
                    gift={gift}
                    isFavorite={favoriteIds.has(gift.id)}
                    onToggleFavorite={onToggleFavorite}
                    onOrder={onOrder}
                />
            ))}
        </div>
    );
}

export function GridSkeleton({ count = 8 }) {
    return (
        <div className="grid" aria-busy="true" aria-label="Yuklanmoqda">
            {Array.from({ length: count }, (_, index) => (
                <div key={index} className="skeleton" />
            ))}
        </div>
    );
}

export function EmptyState({ icon, title, text, action }) {
    return (
        <div className="empty">
            <span className="empty__icon" aria-hidden="true">{icon}</span>
            <p className="empty__title">{title}</p>
            {text && <p className="empty__text">{text}</p>}
            {action}
        </div>
    );
}
