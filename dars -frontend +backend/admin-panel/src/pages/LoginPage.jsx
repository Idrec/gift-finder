import { useState } from "react";
import { flattenErrors, getErrorMessage, login } from "../api/admin";
import { GiftIcon } from "../components/Icons";
import { Field } from "../components/ui";

function LoginPage({ onLogin }) {
    const [values, setValues] = useState({ username: "", password: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = {};
        if (!values.username.trim()) nextErrors.username = "Loginni kiriting.";
        if (!values.password) nextErrors.password = "Parolni kiriting.";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        setSubmitting(true);

        try {
            const { token, user } = await login(values.username.trim(), values.password);
            onLogin(token, user);
        } catch (error) {
            const status = error.response?.status;
            setErrors(
                status === 400 && !error.response.data?.detail
                    ? flattenErrors(error.response.data)
                    : { form: getErrorMessage(error) }
            );
            setSubmitting(false);
        }
    };

    return (
        <main className="login">
            <form className="login__card" onSubmit={handleSubmit} noValidate>
                <div className="login__brand">
                    <span className="brand__logo"><GiftIcon /></span>
                    <div>
                        <h1 className="login__title">Admin panel</h1>
                        <p className="login__sub">Gift Finder boshqaruvi</p>
                    </div>
                </div>

                {errors.form && <p className="form-alert" role="alert">{errors.form}</p>}

                <Field label="Login" error={errors.username}>
                    <input
                        name="username"
                        autoComplete="username"
                        autoFocus
                        className={`input ${errors.username ? "has-error" : ""}`}
                        value={values.username}
                        onChange={handleChange}
                    />
                </Field>

                <Field label="Parol" error={errors.password}>
                    <input
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        className={`input ${errors.password ? "has-error" : ""}`}
                        value={values.password}
                        onChange={handleChange}
                    />
                </Field>

                <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                    {submitting ? "Kirilmoqda..." : "Kirish"}
                </button>

                <p className="login__hint">Django admin (superuser) login va parolingiz bilan kiring.</p>
            </form>
        </main>
    );
}

export default LoginPage;
