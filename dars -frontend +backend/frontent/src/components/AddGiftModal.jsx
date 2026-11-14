import { useEffect, useRef, useState } from "react";
import { createGift, flattenErrors, getErrorMessage } from "../api/gifts";
import Field from "./Field";
import Modal from "./Modal";

const INITIAL = {
    name: "",
    description: "",
    price: "",
    category: "",
    recipient: "",
    min_age: "",
    max_age: "",
    image_url: "",
};

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

    const url = values.image_url.trim();
    if (imageMode === "url" && url && !/^https?:\/\/\S+$/i.test(url)) {
        errors.image_url = "To'g'ri URL kiriting (https://...).";
    }

    return errors;
}

function AddGiftModal({ categories, recipients, onClose, onCreated }) {
    const [values, setValues] = useState(INITIAL);
    const [imageMode, setImageMode] = useState("url"); // url | file
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const firstFieldRef = useRef(null);

    useEffect(() => {
        firstFieldRef.current?.focus();
    }, []);

    // Fayl preview URL'ini tozalash
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
        for (const field of ["name", "description", "price", "category", "recipient", "min_age", "max_age"]) {
            data.append(field, values[field].trim());
        }
        if (imageMode === "url" && values.image_url.trim()) {
            data.append("image_url", values.image_url.trim());
        }
        if (imageMode === "file" && file) {
            data.append("image", file);
        }

        setSubmitting(true);

        try {
            const gift = await createGift(data);
            onCreated(gift);
        } catch (error) {
            setErrors(
                error.response?.status === 400
                    ? flattenErrors(error.response.data)
                    : { form: getErrorMessage(error) }
            );
            setSubmitting(false);
        }
    };

    const urlPreview = imageMode === "url" && /^https?:\/\/\S+$/i.test(values.image_url.trim())
        ? values.image_url.trim()
        : null;
    const previewSrc = imageMode === "file" ? preview : urlPreview;

    return (
        <Modal title="Yangi sovg'a qo'shish" onClose={onClose}>
            <form onSubmit={handleSubmit} noValidate>
                <div className="modal__body">
                    {errors.form && <p className="form-alert">{errors.form}</p>}

                    <Field label="Nomi *" error={errors.name} className="span-2">
                        <input
                            ref={firstFieldRef}
                            name="name"
                            maxLength={200}
                            placeholder="Masalan, Simsiz quloqchinlar"
                            className={`input ${errors.name ? "has-error" : ""}`}
                            value={values.name}
                            onChange={handleChange}
                        />
                    </Field>

                    <Field label="Tavsif" error={errors.description} className="span-2">
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Qisqacha tavsif"
                            className={`input ${errors.description ? "has-error" : ""}`}
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
                            placeholder="250000"
                            className={`input ${errors.price ? "has-error" : ""}`}
                            value={values.price}
                            onChange={handleChange}
                        />
                    </Field>

                    <Field label="Kategoriya *" error={errors.category}>
                        <select
                            name="category"
                            className={`input ${errors.category ? "has-error" : ""}`}
                            value={values.category}
                            onChange={handleChange}
                        >
                            <option value="">Tanlang</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Kimga? *" error={errors.recipient} className="span-2">
                        <select
                            name="recipient"
                            className={`input ${errors.recipient ? "has-error" : ""}`}
                            value={values.recipient}
                            onChange={handleChange}
                        >
                            <option value="">Tanlang</option>
                            {recipients.map((recipient) => (
                                <option key={recipient.value} value={recipient.value}>{recipient.label}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Minimal yosh *" error={errors.min_age}>
                        <input
                            name="min_age"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            max="120"
                            placeholder="0"
                            className={`input ${errors.min_age ? "has-error" : ""}`}
                            value={values.min_age}
                            onChange={handleChange}
                        />
                    </Field>

                    <Field label="Maksimal yosh *" error={errors.max_age}>
                        <input
                            name="max_age"
                            type="number"
                            inputMode="numeric"
                            min="0"
                            max="120"
                            placeholder="100"
                            className={`input ${errors.max_age ? "has-error" : ""}`}
                            value={values.max_age}
                            onChange={handleChange}
                        />
                    </Field>

                    <div className="field span-2">
                        <span className="field__label">Rasm</span>
                        <div className="segmented" role="group" aria-label="Rasm turi">
                            <button
                                type="button"
                                className={imageMode === "url" ? "is-active" : ""}
                                aria-pressed={imageMode === "url"}
                                onClick={() => setImageMode("url")}
                            >
                                URL orqali
                            </button>
                            <button
                                type="button"
                                className={imageMode === "file" ? "is-active" : ""}
                                aria-pressed={imageMode === "file"}
                                onClick={() => setImageMode("file")}
                            >
                                Fayl yuklash
                            </button>
                        </div>

                        {imageMode === "url" ? (
                            <input
                                name="image_url"
                                type="url"
                                placeholder="https://..."
                                aria-label="Rasm URL"
                                className={`input ${errors.image_url ? "has-error" : ""}`}
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
                        {(errors.image_url || errors.image) && (
                            <span className="field__error">{errors.image_url || errors.image}</span>
                        )}

                        {previewSrc && (
                            <div className="image-preview">
                                <img src={previewSrc} alt="Rasm ko'rinishi" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal__foot">
                    <button type="button" className="btn btn--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={submitting}>
                        {submitting ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default AddGiftModal;
