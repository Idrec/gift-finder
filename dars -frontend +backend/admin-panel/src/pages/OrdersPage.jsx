import { useState } from "react";
import { deleteOrder, fetchOrders, fetchStats, getErrorMessage, updateOrderStatus } from "../api/admin";
import { SearchIcon, TrashIcon } from "../components/Icons";
import Modal from "../components/Modal";
import { ConfirmDialog, EmptyState, ErrorState, GiftImage, StatusSelect } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { useDebounced } from "../hooks/useDebounced";
import { formatDate, formatFullDate, formatPrice } from "../utils/format";
import { ORDER_STATUSES } from "../utils/status";

function OrderDetailModal({ order, updating, onStatusChange, onDelete, onClose }) {
    const { gift } = order;

    return (
        <Modal title={`Buyurtma #${order.id}`} onClose={onClose}>
            <div className="modal__body">
                <div className="detail-gift">
                    <span className="thumb thumb--lg"><GiftImage src={gift.image || gift.image_url} /></span>
                    <div>
                        <p className="detail-gift__name">{gift.name}</p>
                        <p className="muted">{gift.category_name} · {order.quantity} dona × {formatPrice(order.unit_price)}</p>
                    </div>
                </div>

                <dl className="detail-list">
                    <div><dt>Sana</dt><dd>{formatFullDate(order.created_at)}</dd></div>
                    <div><dt>Mijoz</dt><dd>{order.customer_name}</dd></div>
                    <div><dt>Telefon</dt><dd><a className="link" href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}>{order.phone}</a></dd></div>
                    <div><dt>Manzil</dt><dd>{order.address}</dd></div>
                    {order.note && <div><dt>Izoh</dt><dd>{order.note}</dd></div>}
                    <div><dt>Jami</dt><dd className="strong">{formatPrice(order.total_price)}</dd></div>
                    <div>
                        <dt>Holat</dt>
                        <dd>
                            <StatusSelect
                                value={order.status}
                                disabled={updating}
                                onChange={(value) => onStatusChange(order, value)}
                            />
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="modal__foot">
                <button type="button" className="btn btn--danger-ghost" onClick={() => onDelete(order)}>
                    <TrashIcon /> O'chirish
                </button>
                <span className="spacer" />
                <button type="button" className="btn btn--ghost" onClick={onClose}>Yopish</button>
            </div>
        </Modal>
    );
}

function OrdersPage({ notify }) {
    const [status, setStatus] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const search = useDebounced(searchInput.trim());
    const [selectedId, setSelectedId] = useState(null);
    const [confirm, setConfirm] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const orders = useAsync((signal) => fetchOrders({ status, search }, signal), `${status}|${search}`);
    const stats = useAsync((signal) => fetchStats(signal), "stats");

    const list = orders.data ?? [];
    const selected = list.find((order) => order.id === selectedId) ?? null;
    const countFor = (value) => stats.data?.orders_by_status.find((item) => item.value === value)?.count;

    const tabs = [
        { value: "", label: "Barchasi", count: stats.data?.orders },
        ...ORDER_STATUSES.map((item) => ({ ...item, count: countFor(item.value) })),
    ];

    const changeStatus = async (order, value) => {
        setUpdatingId(order.id);

        try {
            const updated = await updateOrderStatus(order.id, value);
            orders.setData((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
            stats.reload();
            notify(`#${updated.id}: ${updated.status_label}`, "success");
        } catch (error) {
            notify(getErrorMessage(error), "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const askDelete = (order) => {
        setSelectedId(null);
        setConfirm(order);
    };

    const removeOrder = async () => {
        const order = confirm;

        try {
            await deleteOrder(order.id);
            orders.setData((prev) => prev.filter((item) => item.id !== order.id));
            stats.reload();
            notify(`#${order.id} buyurtma o'chirildi`, "success");
        } catch (error) {
            notify(getErrorMessage(error), "error");
        }
        setConfirm(null);
    };

    let content;

    if (!orders.data && orders.error) {
        content = <ErrorState message={orders.error} onRetry={orders.reload} />;
    } else if (!orders.data) {
        content = <div className="skeleton skeleton--table" aria-busy="true" />;
    } else if (list.length === 0) {
        content = (
            <EmptyState
                icon="🛍️"
                title={status || search ? "Buyurtma topilmadi" : "Hali buyurtmalar yo'q"}
                text={status || search ? "Filtr yoki qidiruvni o'zgartirib ko'ring." : "Mijozlar saytdan buyurtma bergach, shu yerda ko'rinadi."}
            />
        );
    } else {
        content = (
            <div className={`table-wrap ${orders.loading ? "is-busy" : ""}`}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Sana</th>
                            <th>Sovg'a</th>
                            <th>Mijoz</th>
                            <th className="num">Miqdor</th>
                            <th className="num">Jami</th>
                            <th>Holat</th>
                            <th><span className="visually-hidden">Amallar</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((order) => (
                            <tr key={order.id}>
                                <td className="mono">#{order.id}</td>
                                <td className="nowrap muted">{formatDate(order.created_at)}</td>
                                <td>
                                    <span className="cell-gift">
                                        <span className="thumb"><GiftImage src={order.gift.image || order.gift.image_url} /></span>
                                        {order.gift.name}
                                    </span>
                                </td>
                                <td>
                                    <span className="cell-stack">
                                        <span>{order.customer_name}</span>
                                        <span className="muted">{order.phone}</span>
                                    </span>
                                </td>
                                <td className="num">{order.quantity}</td>
                                <td className="num nowrap strong">{formatPrice(order.total_price)}</td>
                                <td>
                                    <StatusSelect
                                        label={`#${order.id} holati`}
                                        value={order.status}
                                        disabled={updatingId === order.id}
                                        onChange={(value) => changeStatus(order, value)}
                                    />
                                </td>
                                <td className="actions">
                                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSelectedId(order.id)}>
                                        Batafsil
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <>
            <div className="page-head">
                <div>
                    <h1 className="page-title">Buyurtmalar</h1>
                    <p className="page-sub">Holatni ro'yxatning o'zidan o'zgartirish mumkin</p>
                </div>
            </div>

            <div className="toolbar">
                <div className="tabs" role="group" aria-label="Holat bo'yicha filtr">
                    {tabs.map((tab) => (
                        <button
                            key={tab.value || "all"}
                            type="button"
                            className={`tab ${status === tab.value ? "is-active" : ""}`}
                            aria-pressed={status === tab.value}
                            onClick={() => setStatus(tab.value)}
                        >
                            {tab.color && <span className="status__dot" style={{ background: tab.color }} aria-hidden="true" />}
                            {tab.label}
                            {tab.count !== undefined && <span className="tab__count">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                <label className="search">
                    <SearchIcon />
                    <input
                        type="search"
                        placeholder="Ism, telefon, sovg'a yoki #raqam"
                        aria-label="Buyurtmalarni qidirish"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                    />
                </label>
            </div>

            {content}

            {selected && (
                <OrderDetailModal
                    order={selected}
                    updating={updatingId === selected.id}
                    onStatusChange={changeStatus}
                    onDelete={askDelete}
                    onClose={() => setSelectedId(null)}
                />
            )}

            {confirm && (
                <ConfirmDialog
                    title="Buyurtmani o'chirish"
                    text={`#${confirm.id} buyurtma (${confirm.customer_name}, ${confirm.gift.name}) butunlay o'chiriladi. Davom etasizmi?`}
                    onConfirm={removeOrder}
                    onClose={() => setConfirm(null)}
                />
            )}
        </>
    );
}

export default OrdersPage;
