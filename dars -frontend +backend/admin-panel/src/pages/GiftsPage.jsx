import { useState } from "react";
import { deleteGift, fetchCategories, fetchGifts, fetchRecipients, getErrorMessage } from "../api/admin";
import GiftFormModal from "../components/GiftFormModal";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from "../components/Icons";
import { ConfirmDialog, EmptyState, ErrorState, GiftImage } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { useDebounced } from "../hooks/useDebounced";
import { formatPrice } from "../utils/format";

function GiftsPage({ notify }) {
    const [searchInput, setSearchInput] = useState("");
    const search = useDebounced(searchInput.trim());
    const [category, setCategory] = useState("");
    const [editing, setEditing] = useState(null); // null | "new" | sovg'a
    const [confirm, setConfirm] = useState(null);

    const gifts = useAsync((signal) => fetchGifts({ search, category }, signal), `${search}|${category}`);
    const meta = useAsync(async (signal) => {
        const [categories, recipients] = await Promise.all([fetchCategories(signal), fetchRecipients(signal)]);
        return { categories, recipients };
    }, "meta");

    const categories = meta.data?.categories ?? [];
    const recipients = meta.data?.recipients ?? [];
    const list = gifts.data ?? [];

    const handleSaved = (saved, isEdit) => {
        setEditing(null);
        gifts.reload();
        notify(isEdit ? `"${saved.name}" saqlandi` : `"${saved.name}" qo'shildi`, "success");
    };

    const removeGift = async () => {
        const gift = confirm;

        try {
            await deleteGift(gift.id);
            gifts.setData((prev) => prev.filter((item) => item.id !== gift.id));
            notify(`"${gift.name}" o'chirildi`, "success");
        } catch (error) {
            notify(getErrorMessage(error), "error");
        }
        setConfirm(null);
    };

    let content;

    if (!gifts.data && gifts.error) {
        content = <ErrorState message={gifts.error} onRetry={gifts.reload} />;
    } else if (!gifts.data) {
        content = <div className="skeleton skeleton--table" aria-busy="true" />;
    } else if (list.length === 0) {
        content = (
            <EmptyState
                icon="🎁"
                title={search || category ? "Sovg'a topilmadi" : "Hali sovg'alar yo'q"}
                text={search || category ? "Qidiruv yoki kategoriyani o'zgartirib ko'ring." : "Birinchi sovg'ani qo'shing."}
            />
        );
    } else {
        content = (
            <div className={`table-wrap ${gifts.loading ? "is-busy" : ""}`}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Sovg'a</th>
                            <th>Kategoriya</th>
                            <th>Kimga</th>
                            <th className="num">Yosh</th>
                            <th className="num">Narx</th>
                            <th className="num" title="Sevimlilarga qo'shilgan">Sevimli</th>
                            <th className="num">Buyurtma</th>
                            <th><span className="visually-hidden">Amallar</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((gift) => (
                            <tr key={gift.id}>
                                <td>
                                    <span className="cell-gift">
                                        <span className="thumb"><GiftImage src={gift.image || gift.image_url} /></span>
                                        <span className="cell-stack">
                                            <span className="strong">{gift.name}</span>
                                            {gift.description && <span className="muted clamp">{gift.description}</span>}
                                        </span>
                                    </span>
                                </td>
                                <td className="nowrap">{gift.category_name}</td>
                                <td>{gift.recipient_label}</td>
                                <td className="num nowrap">{gift.min_age}–{gift.max_age}</td>
                                <td className="num nowrap strong">{formatPrice(gift.price)}</td>
                                <td className="num">{gift.favorites_count}</td>
                                <td className="num">{gift.orders_count}</td>
                                <td className="actions">
                                    <button
                                        type="button"
                                        className="icon-btn"
                                        aria-label={`${gift.name}: tahrirlash`}
                                        title="Tahrirlash"
                                        onClick={() => setEditing(gift)}
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        type="button"
                                        className="icon-btn icon-btn--danger"
                                        aria-label={`${gift.name}: o'chirish`}
                                        title="O'chirish"
                                        onClick={() => setConfirm(gift)}
                                    >
                                        <TrashIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <>
            <div className="page-head">
                <div>
                    <h1 className="page-title">Sovg'alar</h1>
                    <p className="page-sub">{gifts.data ? `${list.length} ta sovg'a` : "Katalog"}</p>
                </div>
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setEditing("new")}
                    disabled={!meta.data}
                >
                    <PlusIcon /> Yangi sovg'a
                </button>
            </div>

            <div className="toolbar">
                <label className="search">
                    <SearchIcon />
                    <input
                        type="search"
                        placeholder="Nomi bo'yicha qidirish"
                        aria-label="Sovg'alarni qidirish"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                    />
                </label>

                <select
                    className="input input--auto"
                    aria-label="Kategoriya bo'yicha filtr"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                >
                    <option value="">Barcha kategoriyalar</option>
                    {categories.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
            </div>

            {content}

            {editing && (
                <GiftFormModal
                    gift={editing === "new" ? null : editing}
                    categories={categories}
                    recipients={recipients}
                    onClose={() => setEditing(null)}
                    onSaved={handleSaved}
                />
            )}

            {confirm && (
                <ConfirmDialog
                    title={confirm.orders_count > 0 ? "O'chirib bo'lmaydi" : "Sovg'ani o'chirish"}
                    text={
                        confirm.orders_count > 0
                            ? `"${confirm.name}" sovg'asiga ${confirm.orders_count} ta buyurtma bog'langan. Buyurtmalar tarixi saqlanishi uchun bu sovg'ani o'chirib bo'lmaydi.`
                            : `"${confirm.name}" butunlay o'chiriladi (sevimlilardan ham). Davom etasizmi?`
                    }
                    onConfirm={confirm.orders_count > 0 ? null : removeGift}
                    onClose={() => setConfirm(null)}
                />
            )}
        </>
    );
}

export default GiftsPage;
