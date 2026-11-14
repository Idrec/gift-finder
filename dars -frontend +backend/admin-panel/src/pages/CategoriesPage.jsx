import { useState } from "react";
import { deleteCategory, fetchCategories, flattenErrors, getErrorMessage, saveCategory } from "../api/admin";
import { EditIcon, PlusIcon, TrashIcon } from "../components/Icons";
import { ConfirmDialog, EmptyState, ErrorState } from "../components/ui";
import { useAsync } from "../hooks/useAsync";

const byName = (a, b) => a.name.localeCompare(b.name, "uz");

function errorFrom(error) {
    if (error.response?.status === 400) {
        const errors = flattenErrors(error.response.data);
        return errors.name ?? errors.form ?? getErrorMessage(error);
    }
    return getErrorMessage(error);
}

function CategoriesPage({ notify }) {
    const categories = useAsync((signal) => fetchCategories(signal), "categories");
    const [newName, setNewName] = useState("");
    const [newError, setNewError] = useState(null);
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [editError, setEditError] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const list = categories.data ?? [];

    const addCategory = async (event) => {
        event.preventDefault();
        const name = newName.trim();

        if (!name) {
            setNewError("Kategoriya nomini kiriting.");
            return;
        }

        setAdding(true);
        try {
            const created = await saveCategory(null, name);
            categories.setData((prev) => [...prev, created].sort(byName));
            setNewName("");
            setNewError(null);
            notify(`"${created.name}" kategoriyasi qo'shildi`, "success");
        } catch (error) {
            setNewError(errorFrom(error));
        } finally {
            setAdding(false);
        }
    };

    const startEdit = (category) => {
        setEditingId(category.id);
        setEditName(category.name);
        setEditError(null);
    };

    const saveEdit = async (event) => {
        event.preventDefault();
        const name = editName.trim();

        if (!name) {
            setEditError("Kategoriya nomini kiriting.");
            return;
        }

        try {
            const updated = await saveCategory(editingId, name);
            categories.setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)).sort(byName));
            setEditingId(null);
            notify("Kategoriya nomi saqlandi", "success");
        } catch (error) {
            setEditError(errorFrom(error));
        }
    };

    const removeCategory = async () => {
        const category = confirm;

        try {
            await deleteCategory(category.id);
            categories.setData((prev) => prev.filter((item) => item.id !== category.id));
            notify(`"${category.name}" o'chirildi`, "success");
        } catch (error) {
            notify(getErrorMessage(error), "error");
        }
        setConfirm(null);
    };

    let content;

    if (!categories.data && categories.error) {
        content = <ErrorState message={categories.error} onRetry={categories.reload} />;
    } else if (!categories.data) {
        content = <div className="skeleton skeleton--table" aria-busy="true" />;
    } else if (list.length === 0) {
        content = <EmptyState icon="🏷️" title="Hali kategoriyalar yo'q" text="Yuqoridagi forma orqali qo'shing." />;
    } else {
        content = (
            <div className="table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nomi</th>
                            <th className="num">Sovg'alar</th>
                            <th><span className="visually-hidden">Amallar</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((category) => (
                            <tr key={category.id}>
                                <td>
                                    {editingId === category.id ? (
                                        <form className="inline-form" onSubmit={saveEdit}>
                                            <input
                                                className={`input ${editError ? "has-error" : ""}`}
                                                aria-label="Kategoriya nomi"
                                                maxLength={100}
                                                autoFocus
                                                value={editName}
                                                onChange={(event) => {
                                                    setEditName(event.target.value);
                                                    setEditError(null);
                                                }}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Escape") setEditingId(null);
                                                }}
                                            />
                                            <button type="submit" className="btn btn--primary btn--sm">Saqlash</button>
                                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditingId(null)}>
                                                Bekor
                                            </button>
                                            {editError && <span className="field__error inline-form__error">{editError}</span>}
                                        </form>
                                    ) : (
                                        <span className="strong">{category.name}</span>
                                    )}
                                </td>
                                <td className="num">{category.gift_count}</td>
                                <td className="actions">
                                    {editingId !== category.id && (
                                        <>
                                            <button
                                                type="button"
                                                className="icon-btn"
                                                aria-label={`${category.name}: tahrirlash`}
                                                title="Tahrirlash"
                                                onClick={() => startEdit(category)}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                type="button"
                                                className="icon-btn icon-btn--danger"
                                                aria-label={`${category.name}: o'chirish`}
                                                title="O'chirish"
                                                onClick={() => setConfirm(category)}
                                            >
                                                <TrashIcon />
                                            </button>
                                        </>
                                    )}
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
                    <h1 className="page-title">Kategoriyalar</h1>
                    <p className="page-sub">{categories.data ? `${list.length} ta kategoriya` : "Sovg'a turlari"}</p>
                </div>
            </div>

            <form className="add-row" onSubmit={addCategory} noValidate>
                <div className="field">
                    <input
                        className={`input ${newError ? "has-error" : ""}`}
                        placeholder="Yangi kategoriya nomi"
                        aria-label="Yangi kategoriya nomi"
                        maxLength={100}
                        value={newName}
                        onChange={(event) => {
                            setNewName(event.target.value);
                            setNewError(null);
                        }}
                    />
                    {newError && <span className="field__error">{newError}</span>}
                </div>
                <button type="submit" className="btn btn--primary" disabled={adding}>
                    <PlusIcon /> Qo'shish
                </button>
            </form>

            {content}

            {confirm && (
                <ConfirmDialog
                    title={confirm.gift_count > 0 ? "O'chirib bo'lmaydi" : "Kategoriyani o'chirish"}
                    text={
                        confirm.gift_count > 0
                            ? `"${confirm.name}" kategoriyasida ${confirm.gift_count} ta sovg'a bor. Avval ularni boshqa kategoriyaga o'tkazing yoki o'chiring.`
                            : `"${confirm.name}" kategoriyasi o'chiriladi. Davom etasizmi?`
                    }
                    onConfirm={confirm.gift_count > 0 ? null : removeCategory}
                    onClose={() => setConfirm(null)}
                />
            )}
        </>
    );
}

export default CategoriesPage;
