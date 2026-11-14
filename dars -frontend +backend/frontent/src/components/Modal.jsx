import { useEffect, useId } from "react";
import { CloseIcon } from "./Icons";

// Umumiy modal: Esc / fonni bosish bilan yopiladi, orqa fon scroll'i to'xtaydi
function Modal({ title, onClose, children }) {
    const titleId = useId();

    useEffect(() => {
        const handleKey = (event) => {
            if (event.key === "Escape") onClose();
        };
        const previousOverflow = document.body.style.overflow;

        document.addEventListener("keydown", handleKey);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    return (
        <div
            className="modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
                <div className="modal__head">
                    <h2 id={titleId} className="modal__title">{title}</h2>
                    <button type="button" className="icon-btn" onClick={onClose} aria-label="Yopish">
                        <CloseIcon />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default Modal;
