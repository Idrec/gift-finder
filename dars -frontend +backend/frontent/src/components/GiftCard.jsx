import { formatPrice } from "../utils/format";
import GiftImage from "./GiftImage";
import { HeartIcon } from "./Icons";

function GiftCard({ gift, isFavorite, onToggleFavorite, onOrder }) {
    return (
        <article className="card">
            <div className="card__media">
                <GiftImage src={gift.image || gift.image_url} alt={gift.name} />

                <button
                    type="button"
                    className={`heart ${isFavorite ? "is-active" : ""}`}
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
                    title={isFavorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
                    onClick={() => onToggleFavorite(gift)}
                >
                    <HeartIcon filled={isFavorite} />
                </button>
            </div>

            <div className="card__body">
                <span className="card__category">{gift.category_name}</span>
                <h3 className="card__title">{gift.name}</h3>
                {gift.description && <p className="card__desc">{gift.description}</p>}
                <p className="card__meta">
                    {gift.recipient_label} uchun · {gift.min_age}–{gift.max_age} yosh
                </p>

                <div className="card__footer">
                    <p className="card__price">{formatPrice(gift.price)}</p>
                    <button
                        type="button"
                        className="btn btn--soft btn--sm card__order"
                        onClick={() => onOrder(gift)}
                    >
                        Buyurtma berish
                    </button>
                </div>
            </div>
        </article>
    );
}

export default GiftCard;
