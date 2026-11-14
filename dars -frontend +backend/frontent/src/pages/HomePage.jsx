import { isCancel } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchGifts, getErrorMessage } from "../api/gifts";
import Filters from "../components/Filters";
import GiftFinder from "../components/GiftFinder";
import { EmptyState, GiftGrid, GridSkeleton } from "../components/GiftGrid";
import { formatPrice } from "../utils/format";

const EMPTY_PRICE = { min: "", max: "" };

function getPriceError({ min, max }) {
    if ((min !== "" && Number(min) < 0) || (max !== "" && Number(max) < 0)) {
        return "Narx manfiy bo'lmasin.";
    }
    if (min !== "" && max !== "" && Number(min) > Number(max)) {
        return "Min narx max narxdan katta bo'lmasin.";
    }
    return null;
}

function HomePage({ categories, recipients, favoriteIds, onToggleFavorite, onOrder, refreshKey }) {
    const [category, setCategory] = useState(null);
    const [priceInput, setPriceInput] = useState(EMPTY_PRICE);
    const [price, setPrice] = useState(EMPTY_PRICE); // debounced
    const [finder, setFinder] = useState(null);
    const [finderFormKey, setFinderFormKey] = useState(0);
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState({ key: null, gifts: [], error: null });
    const resultsRef = useRef(null);

    // Narx yozilayotganda har bir harfga so'rov yubormaslik uchun
    useEffect(() => {
        const timer = setTimeout(() => setPrice(priceInput), 400);
        return () => clearTimeout(timer);
    }, [priceInput]);

    const priceError = getPriceError(price);

    const params = useMemo(() => ({
        category,
        min_price: price.min,
        max_price: price.max,
        recipient: finder?.recipient,
        age: finder?.age,
        budget: finder?.budget,
    }), [category, price, finder]);

    const requestKey = `${JSON.stringify(params)}|${refreshKey}|${attempt}`;

    useEffect(() => {
        if (priceError) return undefined;

        const controller = new AbortController();

        fetchGifts(params, controller.signal)
            .then((gifts) => setResult({ key: requestKey, gifts, error: null }))
            .catch((error) => {
                if (!isCancel(error)) {
                    setResult({ key: requestKey, gifts: [], error: getErrorMessage(error) });
                }
            });

        return () => controller.abort();
    }, [params, priceError, requestKey]);

    const isFirstLoad = result.key === null;
    const isLoading = !priceError && result.key !== requestKey;
    const hasFilters = category !== null || priceInput.min !== "" || priceInput.max !== "";

    const handleFind = (values) => {
        setFinder(values);
        requestAnimationFrame(() => {
            resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const clearFinder = () => {
        setFinder(null);
        setFinderFormKey((key) => key + 1);
    };

    const resetFilters = () => {
        setCategory(null);
        setPriceInput(EMPTY_PRICE);
        setPrice(EMPTY_PRICE);
    };

    const recipientLabel = finder
        ? recipients.find((item) => item.value === finder.recipient)?.label ?? finder.recipient
        : null;

    let content;

    if (isLoading && (isFirstLoad || result.error)) {
        content = <GridSkeleton />;
    } else if (result.error) {
        content = (
            <EmptyState
                icon="⚠️"
                title="Sovg'alarni yuklab bo'lmadi"
                text={result.error}
                action={(
                    <button type="button" className="btn btn--primary" onClick={() => setAttempt((n) => n + 1)}>
                        Qayta urinish
                    </button>
                )}
            />
        );
    } else if (result.gifts.length === 0) {
        content = (
            <EmptyState
                icon="🔍"
                title="Mos sovg'a topilmadi"
                text={finder
                    ? "Budjetni oshirib yoki filtrlarni o'zgartirib ko'ring."
                    : "Filtrlarni o'zgartirib ko'ring."}
            />
        );
    } else {
        content = (
            <GiftGrid
                gifts={result.gifts}
                favoriteIds={favoriteIds}
                onToggleFavorite={onToggleFavorite}
                onOrder={onOrder}
                busy={isLoading}
            />
        );
    }

    return (
        <main className="container">
            <GiftFinder key={finderFormKey} recipients={recipients} onFind={handleFind} />

            <div className="layout">
                <Filters
                    categories={categories}
                    category={category}
                    onCategoryChange={setCategory}
                    price={priceInput}
                    onPriceChange={setPriceInput}
                    priceError={getPriceError(priceInput) ?? priceError}
                    canReset={hasFilters}
                    onReset={resetFilters}
                />

                <section className="results" ref={resultsRef} aria-labelledby="results-title">
                    {finder && (
                        <div className="finder-banner">
                            <span>
                                <strong>{recipientLabel} uchun</strong> · {finder.age} yosh ·{" "}
                                {formatPrice(finder.budget)}gacha
                            </span>
                            <button type="button" className="btn btn--link" onClick={clearFinder}>
                                Tozalash
                            </button>
                        </div>
                    )}

                    <div className="results__head">
                        <h2 id="results-title" className="results__title">
                            {finder ? "Mos sovg'alar" : "Barcha sovg'alar"}
                        </h2>
                        {!isFirstLoad && !result.error && (
                            <span className="results__count">{result.gifts.length} ta sovg'a</span>
                        )}
                    </div>

                    {content}
                </section>
            </div>
        </main>
    );
}

export default HomePage;
