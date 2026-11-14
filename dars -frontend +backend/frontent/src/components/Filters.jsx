function Filters({
    categories,
    category,
    onCategoryChange,
    price,
    onPriceChange,
    priceError,
    canReset,
    onReset,
}) {
    const handlePrice = (event) => {
        onPriceChange({ ...price, [event.target.name]: event.target.value });
    };

    return (
        <aside className="sidebar" aria-label="Filtrlar">
            <div className="filter">
                <h2 className="filter__title">Kategoriya</h2>
                <div className="chips">
                    <button
                        type="button"
                        className={`chip ${category === null ? "is-active" : ""}`}
                        aria-pressed={category === null}
                        onClick={() => onCategoryChange(null)}
                    >
                        Barchasi
                    </button>
                    {categories.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`chip ${category === item.id ? "is-active" : ""}`}
                            aria-pressed={category === item.id}
                            onClick={() => onCategoryChange(item.id)}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="filter">
                <h2 className="filter__title">Narx (so'm)</h2>
                <div className="price-range">
                    <label className="field">
                        <span className="field__label">Min</span>
                        <input
                            name="min"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            step="1000"
                            placeholder="0"
                            className={`input ${priceError ? "has-error" : ""}`}
                            value={price.min}
                            onChange={handlePrice}
                        />
                    </label>
                    <label className="field">
                        <span className="field__label">Max</span>
                        <input
                            name="max"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            step="1000"
                            placeholder="Cheksiz"
                            className={`input ${priceError ? "has-error" : ""}`}
                            value={price.max}
                            onChange={handlePrice}
                        />
                    </label>
                </div>
                {priceError && <p className="field__error">{priceError}</p>}
            </div>

            {canReset && (
                <button type="button" className="btn btn--ghost btn--block" onClick={onReset}>
                    Filtrlarni tozalash
                </button>
            )}
        </aside>
    );
}

export default Filters;
