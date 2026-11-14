import { useState } from "react";

const EMPTY = { recipient: "", age: "", budget: "" };

function validate(values) {
    const errors = {};
    const age = Number(values.age);
    const budget = Number(values.budget);

    if (!values.recipient) {
        errors.recipient = "Kimga ekanini tanlang.";
    }

    if (values.age === "" || !Number.isInteger(age) || age < 0 || age > 120) {
        errors.age = "Yoshni 0–120 oralig'ida kiriting.";
    }

    if (values.budget === "" || !(budget > 0)) {
        errors.budget = "Budjetni kiriting.";
    }

    return errors;
}

function GiftFinder({ recipients, onFind }) {
    const [values, setValues] = useState(EMPTY);
    const [errors, setErrors] = useState({});

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const nextErrors = validate(values);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) return;

        onFind({
            recipient: values.recipient,
            age: Number(values.age),
            budget: Number(values.budget),
        });
    };

    return (
        <section className="hero" aria-labelledby="finder-title">
            <div className="hero__content">
                <span className="hero__eyebrow">Sovg'a tanlash yordamchisi</span>
                <h1 id="finder-title" className="hero__title">Kimga sovg'a olmoqchisiz?</h1>
                <p className="hero__text">
                    Kimga, uning yoshi va budjetingizni kiriting — mos sovg'alarni darhol topib beramiz.
                </p>
            </div>

            <form className="finder" onSubmit={handleSubmit} noValidate>
                <label className="field finder__recipient">
                    <span className="field__label">Kimga?</span>
                    <select
                        name="recipient"
                        className={`input ${errors.recipient ? "has-error" : ""}`}
                        value={values.recipient}
                        onChange={handleChange}
                    >
                        <option value="">Tanlang</option>
                        {recipients.map((recipient) => (
                            <option key={recipient.value} value={recipient.value}>
                                {recipient.label}
                            </option>
                        ))}
                    </select>
                    {errors.recipient && <span className="field__error">{errors.recipient}</span>}
                </label>

                <label className="field">
                    <span className="field__label">Yoshi</span>
                    <input
                        name="age"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="120"
                        placeholder="Masalan, 30"
                        className={`input ${errors.age ? "has-error" : ""}`}
                        value={values.age}
                        onChange={handleChange}
                    />
                    {errors.age && <span className="field__error">{errors.age}</span>}
                </label>

                <label className="field">
                    <span className="field__label">Budjet (so'm)</span>
                    <input
                        name="budget"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1000"
                        placeholder="Masalan, 500000"
                        className={`input ${errors.budget ? "has-error" : ""}`}
                        value={values.budget}
                        onChange={handleChange}
                    />
                    {errors.budget && <span className="field__error">{errors.budget}</span>}
                </label>

                <button type="submit" className="btn btn--primary finder__submit">
                    Sovg'a topish
                </button>
            </form>
        </section>
    );
}

export default GiftFinder;
