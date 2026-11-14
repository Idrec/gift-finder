import { useEffect, useState } from "react";
import { STATUS_BY_VALUE, ORDER_STATUSES } from "../utils/status";
import Modal from "./Modal";

export function Field({ label, error, className = "", children }) {
    return (
        <label className={`field ${className}`}>
            <span className="field__label">{label}</span>
            {children}
            {error && <span className="field__error">{error}</span>}
        </label>
    );
}

export function GiftImage({ src, alt = "" }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return <span className="thumb__placeholder" aria-hidden="true">🎁</span>;
    }

    return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export function StatusBadge({ status }) {
    const meta = STATUS_BY_VALUE[status];

    return (
        <span className="status">
            <span className="status__dot" style={{ background: meta?.color }} aria-hidden="true" />
            {meta?.label ?? status}
        </span>
    );
}

export function StatusSelect({ value, onChange, disabled, label = "Holat" }) {
    return (
        <span className="status-select">
            <span className="status__dot" style={{ background: STATUS_BY_VALUE[value]?.color }} aria-hidden="true" />
            <select
                aria-label={label}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
            >
                {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                ))}
            </select>
        </span>
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

export function ErrorState({ message, onRetry }) {
    return (
        <EmptyState
            icon="⚠️"
            title="Ma'lumotlarni yuklab bo'lmadi"
            text={message}
            action={<button type="button" className="btn btn--primary" onClick={onRetry}>Qayta urinish</button>}
        />
    );
}

export function ConfirmDialog({ title, text, confirmLabel = "O'chirish", onConfirm, onClose }) {
    const [busy, setBusy] = useState(false);

    const handleConfirm = async () => {
        setBusy(true);
        try {
            await onConfirm();
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal title={title} onClose={onClose} size="sm">
            <p className="modal__text">{text}</p>
            <div className="modal__foot">
                {onConfirm ? (
                    <>
                        <button type="button" className="btn btn--ghost" onClick={onClose}>Bekor qilish</button>
                        <button type="button" className="btn btn--danger" onClick={handleConfirm} disabled={busy}>
                            {busy ? "Bajarilmoqda..." : confirmLabel}
                        </button>
                    </>
                ) : (
                    // Amalni bajarib bo'lmaydi — faqat tushuntirish
                    <button type="button" className="btn btn--primary" onClick={onClose}>Tushunarli</button>
                )}
            </div>
        </Modal>
    );
}

export function Toast({ toast, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast--${toast.type}`} role="status">
            {toast.message}
        </div>
    );
}
