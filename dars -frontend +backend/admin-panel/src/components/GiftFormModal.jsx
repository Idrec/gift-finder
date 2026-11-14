import { useEffect, useRef, useState } from "react";
import { flattenErrors, getErrorMessage, saveGift } from "../api/admin";
import Modal from "./Modal";
import { Field } from "./ui";

const FIELDS = ["name", "description", "price", "category", "recipient", "min_age", "max_age"];
const URL_RE = /^https?:\/\/\S+$/i;

function initialValues(gift) {
    return {
        name: gift?.name ?? "",
        description: gift?.description ?? "",
        price: gift ? String(Number(gift.price)) : "",
        category: gift ? String(gift.category) : "",
        recipient: gift?.recipient ?? "",
        min_age: gift ? String(gift.min_age) : "",
        max_age: gift ? String(gift.max_age) : "",
        image_url: gift?.image_url ?? "",
    };
}

function isValidAge(value) {
    const age = Number(value);
    return value !== "" && Number.isInteger(age) && age >= 0 && age <= 120;
}

function validate(values, imageMode) {
    const errors = {};

    if (!values.name.trim()) errors.name = "Sovg'a nomini kiriting.";
    if (values.price === "" || !(Number(values.price) >= 0)) errors.price = "Narxni to'g'ri kiriting.";
    if (!values.category) errors.category = "Kategoriyani tanlang.";
    if (!values.recipient) errors.recipient = "Kimga ekanini tanlang.";
    if (!isValidAge(values.min_age)) errors.min_age = "0–120 oralig'ida kiriting.";
    if (!isValidAge(values.max_age)) {
        errors.max_age = "0–120 oralig'ida kiriting.";
    } else if (!errors.min_age && Number(values.min_age) > Number(values.max_age)) {
        errors.max_age = "Min yoshdan kichik bo'lmasin.";
    }
    if (imageMode === "url" && values.image_url.trim() && !URL_RE.test(values.image_url.trim())) {
        errors.image_url = "To'g'ri URL kiriting (https://...).";
    }

    return errors;
}

function GiftFormModal({ gift, categories, recipients, onClose, onSaved }) {
    const isEdit = Boolean(gift);
    const [values, setValues] = useState(() => initialValues(gift));
    const [imageMode, setImageMode] = useState(gift?.image ? "file" : "url");
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const firstFieldRef = useRef(null);

    useEffect(() => {
        firstFieldRef.current?.focus();
    }, []);

    useEffect(() => () => {
        if (preview) URL.revokeObjectURL(preview);
    }, [preview]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    };

    const handleFile = (event) => {
        const selected = event.target.files?.[0] ?? null;
        setFile(selected);
        setPreview(selected ? URL.createObjectURL(selected) : null);
        setErrors((prev) => ({ ...prev, image: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = validate(values, imageMode);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const data = new FormData();
        for (const field of FIELDS) {
            data.append(field, values[field].trim());
        }

        if (imageMode === "url") {
            data.append("image_url", values.image_url.trim());
            // URL tanlangan bo'lsa, avval yuklangan faylni olib tashlaymiz
            if (gift?.image) data.append("image", "");
        } else if (file) {
            data.append("image", file);
        }

        setSubmitting(true);

        try {
            const saved = await saveGift(gift?.id, data);
            onSaved(saved, isEdit);
        } catch (error) {
            setErrors(
                error.response?.status === 400
                    ? flattenErrors(error.response.data)
                    : { form: getErrorMessage(error) }
            );
            setSubmitting(false);
        }
    };

    const urlPreview = URL_RE.test(values.image_url.trim()) ? values.image_url.trim() : null;
    const previewSrc = imageMode === "file" ? preview ?? gift?.image : urlPreview;
    const inputClass = (name) => `input ${errors[name] ? "has-error" : ""}`;

    return (
        <Modal title={isEdit ? "Sovg'ani tahrirlash" : "Yangi sovg'a"} onClose={onClose} size="lg">
            <form onSubmit={handleSubmit} noValidate>
                <div className="modal__body form-grid">
                    {errors.form && <p className="form-alert">{errors.form}</p>}

                    <Field label="Nomi *" error={errors.name} className="span-2">
                        <input
                            ref={firstFieldRef}
                            name="name"
                            maxLength={200}
                            className={inputClass("name")}
                            value={values.name}
                            onChange={handleChange}
                        />
                    </Field>

                    <Field label="Tavsif" error={errors.description} className="span-2">
                        <textarea
                            name="description"
                            rows={3}
                            className={inputClass("description")}
                            value={values.description}
                            onChange={handleChange}
                        />
                    </Field>

                    <Field label="Narx (so'm) *" error={errors.price}>
                        <input
                            name="price"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            step="1000"
                            className={inputClass("price")}
                            value={values.price}
                            onChange={handleChange}
                        />
                    </Field>

                    <Field label="Kategoriya *" error={errors.category}>
                        <select name="category" className={inputClass("category")} value={values.category} onChange={handleChange}>
                            <option value="">Tanlang</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Kimga? *" error={errors.recipient}>
                        <select name="recipient" className={inputClass("recipient")} value={values.recipient} onChange={handleChange}>
                            <option value="">Tanlang</option>
                            {recipients.map((recipient) => (
                                <option key={recipient.value} value={recipient.value}>{recipient.label}</option>
                            ))}
                        </select>
                    </Field>

                    <div className="form-row">
                        <Field label="Min yosh *" error={errors.min_age}>
                            <input
                                name="min_age"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max="120"
                                className={inputClass("min_age")}
                                value={values.min_age}
                                onChange={handleChange}
                            />
                        </Field>
                        <Field label="Max yosh *" error={errors.max_age}>
                            <input
                                name="max_age"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max="120"
                                className={inputClass("max_age")}
                                value={values.max_age}
                                onChange={handleChange}
                            />
                        </Field>
                    </div>

                    <div className="field span-2">
                        <span className="field__label">Rasm</span>
                        <div className="segmented" role="group" aria-label="Rasm turi">
                            {[["url", "URL orqali"], ["file", "Fayl yuklash"]].map(([mode, label]) => (
                                <button
                                    key={mode}
                                    type="button"
                                    className={imageMode === mode ? "is-active" : ""}
                                    aria-pressed={imageMode === mode}
                                    onClick={() => setImageMode(mode)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="image-input">
                            <div className="image-input__preview">
                                {previewSrc ? <img src={previewSrc} alt="" /> : <span aria-hidden="true">🎁</span>}
                            </div>
                            {imageMode === "url" ? (
                                <input
                                    name="image_url"
                                    type="url"
                                    placeholder="https://..."
                                    aria-label="Rasm URL"
                                    className={inputClass("image_url")}
                                    value={values.image_url}
                                    onChange={handleChange}
                                />
                            ) : (
                                <input
                                    type="file"
                                    accept="image/*"
                                    aria-label="Rasm fayli"
                                    className={`input input--file ${errors.image ? "has-error" : ""}`}
                                    onChange={handleFile}
                                />
                            )}
                        </div>
                        {(errors.image_url || errors.image) && (
                            <span className="field__error">{errors.image_url || errors.image}</span>
                        )}
                    </div>
                </div>

                <div className="modal__foot">
                    <button type="button" className="btn btn--ghost" onClick={onClose}>Bekor qilish</button>
                    <button type="submit" className="btn btn--primary" disabled={submitting}>
                        {submitting ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default GiftFormModal;
