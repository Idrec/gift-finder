import { useEffect, useState } from "react";
import { fetchOrders, getErrorMessage } from "../api/gifts";
import { EmptyState } from "../components/GiftGrid";
import GiftImage from "../components/GiftImage";
import { formatDate, formatPrice } from "../utils/format";

function OrderItem({ order }) {
    const { gift } = order;

    return (
        <li className="order">
            <div className="order__media">
                <GiftImage src={gift.image || gift.image_url} alt={gift.name} />
            </div>

            <div className="order__info">
                <p className="order__meta">#{order.id} · {formatDate(order.created_at)}</p>
                <h3 className="order__title">{gift.name}</h3>
                <p className="order__line">{order.quantity} dona × {formatPrice(order.unit_price)}</p>
                <p className="order__contact">
                    {order.customer_name} · {order.phone}
                    <br />
                    {order.address}
                </p>
                {order.note && <p className="order__note">Izoh: {order.note}</p>}
            </div>

            <div className="order__side">
                <span className={`status status--${order.status}`}>{order.status_label}</span>
                <p className="order__total">{formatPrice(order.total_price)}</p>
            </div>
        </li>
    );
}

function OrdersPage() {
    const [state, setState] = useState({ status: "loading", orders: [], error: null });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let ignore = false;

        fetchOrders()
            .then((orders) => {
                if (!ignore) setState({ status: "ready", orders, error: null });
            })
            .catch((error) => {
                if (!ignore) setState({ status: "error", orders: [], error: getErrorMessage(error) });
            });

        return () => {
            ignore = true;
        };
    }, [attempt]);

    const retry = () => {
        setState({ status: "loading", orders: [], error: null });
        setAttempt((n) => n + 1);
    };

    let content;

    if (state.status === "loading") {
        content = (
            <div className="orders" aria-busy="true" aria-label="Yuklanmoqda">
                {[0, 1, 2].map((i) => <div key={i} className="skeleton skeleton--row" />)}
            </div>
        );
    } else if (state.status === "error") {
        content = (
            <EmptyState
                icon="⚠️"
                title="Buyurtmalarni yuklab bo'lmadi"
                text={state.error}
                action={<button type="button" className="btn btn--primary" onClick={retry}>Qayta urinish</button>}
            />
        );
    } else if (state.orders.length === 0) {
        content = (
            <EmptyState
                icon="🛍️"
                title="Hali buyurtmalar yo'q"
                text="Yoqqan sovg'a kartochkasidagi «Buyurtma berish» tugmasini bosing."
                action={<a href="#/" className="btn btn--primary">Sovg'alarni ko'rish</a>}
            />
        );
    } else {
        content = (
            <ul className="orders">
                {state.orders.map((order) => <OrderItem key={order.id} order={order} />)}
            </ul>
        );
    }

    return (
        <main className="container page">
            <div className="page-head">
                <h1 className="page-title">Buyurtmalarim</h1>
                {state.status === "ready" && state.orders.length > 0 && (
                    <p className="page-sub">{state.orders.length} ta buyurtma</p>
                )}
            </div>

            {content}
        </main>
    );
}

export default OrdersPage;
