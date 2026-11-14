import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { fetchMe, getErrorMessage, logout } from "./api/admin";
import { getToken, onUnauthorized, setToken } from "./api/client";
import Sidebar from "./components/Sidebar";
import { Toast } from "./components/ui";
import { useHashRoute } from "./hooks/useHashRoute";
import CategoriesPage from "./pages/CategoriesPage";
import DashboardPage from "./pages/DashboardPage";
import GiftsPage from "./pages/GiftsPage";
import LoginPage from "./pages/LoginPage";
import OrdersPage from "./pages/OrdersPage";

const PAGES = {
    "/": ["dashboard", DashboardPage],
    "/orders": ["orders", OrdersPage],
    "/gifts": ["gifts", GiftsPage],
    "/categories": ["categories", CategoriesPage],
};

const ANONYMOUS = { status: "anonymous", user: null, error: null };

function App() {
    const route = useHashRoute();
    const [page, PageComponent] = PAGES[route] ?? PAGES["/"];

    // checking -> authenticated | anonymous | offline
    const [auth, setAuth] = useState(() => (getToken() ? { status: "checking", user: null, error: null } : ANONYMOUS));
    const [toast, setToast] = useState(null);

    const notify = useCallback((message, type = "info") => {
        setToast({ message, type, id: Date.now() });
    }, []);
    const closeToast = useCallback(() => setToast(null), []);

    // Har qanday so'rov 401 qaytarsa — login sahifasiga
    useEffect(() => {
        onUnauthorized(() => setAuth(ANONYMOUS));
        return () => onUnauthorized(null);
    }, []);

    // Saqlangan token hali amal qiladimi?
    useEffect(() => {
        if (auth.status !== "checking") return undefined;
        let ignore = false;

        fetchMe()
            .then((user) => {
                if (!ignore) setAuth({ status: "authenticated", user, error: null });
            })
            .catch((error) => {
                if (ignore || error.response?.status === 401) return;

                if (error.response?.status === 403) {
                    setToken(null);
                    setAuth(ANONYMOUS);
                } else {
                    setAuth({ status: "offline", user: null, error: getErrorMessage(error) });
                }
            });

        return () => {
            ignore = true;
        };
    }, [auth.status]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [route]);

    const handleLogin = (token, user) => {
        setToken(token);
        setAuth({ status: "authenticated", user, error: null });
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch {
            // token baribir o'chiriladi
        }
        setToken(null);
        setAuth(ANONYMOUS);
    };

    if (auth.status === "checking") {
        return <div className="splash">Yuklanmoqda...</div>;
    }

    if (auth.status === "offline") {
        return (
            <div className="splash">
                <p>{auth.error}</p>
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setAuth({ status: "checking", user: null, error: null })}
                >
                    Qayta urinish
                </button>
            </div>
        );
    }

    return (
        <>
            {auth.status === "anonymous" ? (
                <LoginPage onLogin={handleLogin} />
            ) : (
                <div className="shell">
                    <Sidebar page={page} user={auth.user} onLogout={handleLogout} />
                    <main className="main">
                        <PageComponent key={page} notify={notify} />
                    </main>
                </div>
            )}

            {toast && <Toast key={toast.id} toast={toast} onClose={closeToast} />}
        </>
    );
}

export default App;
