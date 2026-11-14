import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { fetchCategories, fetchRecipients } from "./api/gifts";
import AddGiftModal from "./components/AddGiftModal";
import Header from "./components/Header";
import OrderModal from "./components/OrderModal";
import Toast from "./components/Toast";
import { useFavorites } from "./hooks/useFavorites";
import { navigate, useHashRoute } from "./hooks/useHashRoute";
import FavoritesPage from "./pages/FavoritesPage";
import HomePage from "./pages/HomePage";
import OrdersPage from "./pages/OrdersPage";

const PAGES = {
    "/favorites": "favorites",
    "/orders": "orders",
};

function App() {
    const route = useHashRoute();
    const page = PAGES[route] ?? "home";

    const [categories, setCategories] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [isAddOpen, setAddOpen] = useState(false);
    const [orderGift, setOrderGift] = useState(null); // buyurtma oynasi ochiq bo'lgan sovg'a
    const [refreshKey, setRefreshKey] = useState(0);
    const [toast, setToast] = useState(null);

    const notify = useCallback((message, type = "info") => {
        setToast({ message, type, id: Date.now() });
    }, []);
    const closeToast = useCallback(() => setToast(null), []);
    const closeAdd = useCallback(() => setAddOpen(false), []);
    const closeOrder = useCallback(() => setOrderGift(null), []);
    const showOrders = useCallback(() => {
        setOrderGift(null);
        navigate("/orders");
    }, []);

    const favorites = useFavorites(notify);

    useEffect(() => {
        Promise.all([fetchCategories(), fetchRecipients()])
            .then(([categoryList, recipientList]) => {
                setCategories(categoryList);
                setRecipients(recipientList);
            })
            .catch(() => notify("Kategoriyalarni yuklab bo'lmadi. Backend ishlayotganini tekshiring.", "error"));
    }, [notify]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [route]);

    const handleCreated = (gift) => {
        setAddOpen(false);
        setRefreshKey((key) => key + 1);
        notify(`"${gift.name}" qo'shildi`, "success");
        navigate("/");
    };

    return (
        <>
            <Header
                page={page}
                favoritesCount={favorites.ids.size}
                onAdd={() => setAddOpen(true)}
            />

            {/* Bosh sahifa yashiriladi, lekin filtrlar holati saqlanib qoladi */}
            <div hidden={page !== "home"}>
                <HomePage
                    categories={categories}
                    recipients={recipients}
                    favoriteIds={favorites.ids}
                    onToggleFavorite={favorites.toggle}
                    onOrder={setOrderGift}
                    refreshKey={refreshKey}
                />
            </div>

            {page === "favorites" && <FavoritesPage {...favorites} onOrder={setOrderGift} />}
            {page === "orders" && <OrdersPage />}

            {isAddOpen && (
                <AddGiftModal
                    categories={categories}
                    recipients={recipients}
                    onClose={closeAdd}
                    onCreated={handleCreated}
                />
            )}

            {orderGift && (
                <OrderModal
                    key={orderGift.id}
                    gift={orderGift}
                    onClose={closeOrder}
                    onShowOrders={showOrders}
                />
            )}

            {toast && <Toast key={toast.id} toast={toast} onClose={closeToast} />}
        </>
    );
}

export default App;
