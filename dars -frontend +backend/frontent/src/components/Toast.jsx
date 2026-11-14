import { useEffect } from "react";

function Toast({ toast, onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3200);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast--${toast.type}`} role="status">
            {toast.message}
        </div>
    );
}

export default Toast;
