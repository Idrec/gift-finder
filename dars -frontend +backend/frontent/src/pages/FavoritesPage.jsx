import { EmptyState, GiftGrid, GridSkeleton } from "../components/GiftGrid";

function FavoritesPage({ favorites, ids, status, toggle, reload, onOrder }) {
    let content;

    if (status === "loading") {
        content = <GridSkeleton count={4} />;
    } else if (status === "error") {
        content = (
            <EmptyState
                icon="⚠️"
                title="Sevimlilarni yuklab bo'lmadi"
                text="Server bilan bog'lanib bo'lmadi. Backend ishlayotganini tekshiring."
                action={(
                    <button type="button" className="btn btn--primary" onClick={reload}>
                        Qayta urinish
                    </button>
                )}
            />
        );
    } else if (favorites.length === 0) {
        content = (
            <EmptyState
                icon="💝"
                title="Hali sevimli sovg'alar yo'q"
                text="Yoqqan sovg'adagi yurakcha tugmasini bosing — u shu yerda saqlanadi."
                action={<a href="#/" className="btn btn--primary">Sovg'alarni ko'rish</a>}
            />
        );
    } else {
        content = (
            <GiftGrid gifts={favorites} favoriteIds={ids} onToggleFavorite={toggle} onOrder={onOrder} />
        );
    }

    return (
        <main className="container page">
            <div className="page-head">
                <h1 className="page-title">Sevimlilar</h1>
                {status === "ready" && favorites.length > 0 && (
                    <p className="page-sub">{favorites.length} ta saqlangan sovg'a</p>
                )}
            </div>

            {content}
        </main>
    );
}

export default FavoritesPage;
