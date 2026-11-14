import { useEffect, useRef, useState } from "react";
import { createOrder, flattenErrors, getErrorMessage } from "../api/gifts";
import { formatPrice } from "../utils/format";
import Field from "./Field";
import GiftImage from "./GiftImage";
import { CheckIcon, MinusIcon, PlusIcon } from "./Icons";
import Modal from "./Modal";

const MAX_QUANTITY = 20;

const INITIAL = {
    customer_name: "",
    phone: "",
    address: "",
    quantity: 1,
    note: "",
};

function validate(values) {
    const errors = {};
    const phone = values.phone.trim();
    const digits = phone.replace(/\D/g, "");

    if (values.customer_name.trim().length < 2) {
        errors.customer_name = "Ismingizni kiriting.";
    }

    if (!/^\+?[\d\s\-()]+$/.test(phone) || digits.length < 9 || digits.length > 15) {
        errors.phone = "Telefon raqamini to'g'ri kiriting, masalan: +998 90 123 45 67.";
    }

    if (values.address.trim().length < 5) {
        errors.address = "Yetkazib berish manzilini kiriting.";
    }

    return errors;
}

function GiftSummary({ gift, quantity }) {
    return (
        <div className="order-gift">
            <div className="order-gift__media">
                <GiftImage src={gift.image || gift.image_url} alt={gift.name} />
            </div>
            <div>
                <p className="order-gift__name">{gift.name}</p>
                <p className="order-gift__price">
                    {quantity > 1 ? `${quantity} dona × ` : ""}{formatPrice(gift.price)}
                </p>
            </div>
        </div>
    );
}

function OrderModal({ gift, onClose, onShowOrders }) {
    const [values, setValues] = useState(INITIAL);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState(null); // qabul qilingan buyurtma
    const firstFieldRef = useRef(null);

    useEffect(() => {
        firstFieldRef.current?.focus();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    };

    const changeQuantity = (delta) => {
        setValues((prev) => ({
            ...prev,
            quantity: Math.min(MAX_QUANTITY, Math.max(1, prev.quantity + delta)),
        }));
        setErrors((prev) => ({ ...prev, quantity: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = validate(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);

        try {
            const created = await createOrder({
                gift_id: gift.id,
                customer_name: values.customer_name.trim(),
                phone: values.phone.trim(),
                address: values.address.trim(),
                quantity: values.quantity,
                note: values.note.trim(),
            });
            setOrder(created);
        } catch (error) {
            setErrors(
                error.response?.status === 400
                    ? flattenErrors(error.response.data)
                    : { form: getErrorMessage(error) }
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (order) {
        return (
            <Modal title="Buyurtma qabul qilindi" onClose={onClose}>
                <div className="order-success" role="status">
                    <span className="order-success__icon"><CheckIcon /></span>
                    <p className="order-success__title">Rahmat, {order.customer_name}!</p>
                    <p className="order-success__text">
                        Buyurtmangiz <strong>#{order.id}</strong> qabul qilindi.
                        Tez orada {order.phone} raqamiga qo'ng'iroq qilamiz.
                    </p>
                    <GiftSummary gift={order.gift} quantity={order.quantity} />
                    <p className="order-success__total">
                        Jami: <strong>{formatPrice(order.total_price)}</strong>
                    </p>
                </div>

                <div className="modal__foot">
                    <button type="button" className="btn btn--ghost" onClick={onClose}>
                        Yopish
                    </button>
                    <button type="button" className="btn btn--primary" onClick={onShowOrders}>
                        Buyurtmalarim
                    </button>
                </div>
            </Modal>
        );
    }

    return (
        <Modal title="Buyurtma berish" onClose={onClose}>
            <form onSubmit={handleSubmit} noValidate>
                <div className="modal__body">
                    <GiftSummary gift={gift} quantity={1} />

                    {errors.form && <p className="form-alert">{errors.form}</p>}
                    {errors.gift_id && <p className="form-alert">{errors.gift_id}</p>}

                    <Field label="Ismingiz *" error={errors.customer_name}>
                        <input
                            ref={firstFieldRef}
                            name="customer_name"
                            autoComplete="name"
                            maxLength={100}
                            placeholder="Masalan, Aziza"
                            className={`input ${errors.customer_name ? "has-error" : ""}`}
                            value={values.customer_name}
                            onChange={handleChange}
                        />
                    </Field>

                    <Field label="Telefon *" error={errors.phone}>
                        <input
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            maxLength={20}
                            placeholder="+998 90 123 45 67"
                            className={`input ${errors.phone ? "has-error" : ""}`}
                            value={values.phone}
                            onChange={handleChange}
                        />
                    </Field>

                    <Field label="Yetkazib berish manzili *" error={errors.address} className="span-2">
                        <input
                            name="address"
                            autoComplete="street-address"
                            maxLength={255}
                            placeholder="Shahar, tuman, ko'cha, uy"
                            className={`input ${errors.address ? "has-error" : ""}`}
                            value={values.address}
                            onChange={handleChange}
                        />
                    </Field>

                    <div className="field span-2">
                        <span className="field__label" id="quantity-label">Miqdor</span>
                        <div className="stepper" role="group" aria-labelledby="quantity-label">
                            <button
                                type="button"
                                aria-label="Kamaytirish"
                                disabled={values.quantity <= 1}
                                onClick={() => changeQuantity(-1)}
                            >
                                <MinusIcon />
                            </button>
                            <span className="stepper__value" aria-live="polite">{values.quantity}</span>
                            <button
                                type="button"
                                aria-label="Ko'paytirish"
                                disabled={values.quantity >= MAX_QUANTITY}
                                onClick={() => changeQuantity(1)}
                            >
                                <PlusIcon />
                            </button>
                        </div>
                        {errors.quantity && <span className="field__error">{errors.quantity}</span>}
                    </div>

                    <Field label="Izoh" error={errors.note} className="span-2">
                        <textarea
                            name="note"
                            rows={2}
                            maxLength={500}
                            placeholder="Masalan: sovg'a qog'oziga o'rab bering"
                            className={`input ${errors.note ? "has-error" : ""}`}
                            value={values.note}
                            onChange={handleChange}
                        />
                    </Field>
                </div>

                <div className="modal__foot">
                    <p className="modal__total">
                        <span>Jami</span>
                        <strong>{formatPrice(Number(gift.price) * values.quantity)}</strong>
                    </p>
                    <button type="button" className="btn btn--ghost" onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={submitting}>
                        {submitting ? "Yuborilmoqda..." : "Buyurtma berish"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default OrderModal;
