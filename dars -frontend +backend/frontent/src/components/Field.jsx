function Field({ label, error, className = "", children }) {
    return (
        <label className={`field ${className}`}>
            <span className="field__label">{label}</span>
            {children}
            {error && <span className="field__error">{error}</span>}
        </label>
    );
}

export default Field;
