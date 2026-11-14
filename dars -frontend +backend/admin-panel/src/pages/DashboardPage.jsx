import { fetchOrders, fetchStats } from "../api/admin";
import { ErrorState, GiftImage, StatusBadge } from "../components/ui";
import { useAsync } from "../hooks/useAsync";
import { formatCompactPrice, formatDate, formatNumber, formatPrice } from "../utils/format";
import { STATUS_BY_VALUE } from "../utils/status";

function StatTile({ label, value, title, sub }) {
    return (
        <div className="tile">
            <p className="tile__label">{label}</p>
            <p className="tile__value" title={title}>{value}</p>
            {sub && <p className="tile__sub">{sub}</p>}
        </div>
    );
}

// Bitta butun (barcha buyurtmalar) holatlarga bo'lingan: ingichka bo'lakli chiziq + ro'yxat
function StatusBreakdown({ items, total }) {
    if (total === 0) {
        return <p className="muted">Hali buyurtmalar yo'q.</p>;
    }

    const share = (count) => Math.round((count / total) * 100);

    return (
        <>
            <div
                className="segbar"
                role="img"
                aria-label={items.map((item) => `${item.label}: ${item.count}`).join(", ")}
            >
                {items.filter((item) => item.count > 0).map((item) => (
                    <span
                        key={item.value}
                        className="segbar__part"
                        style={{ flexGrow: item.count, background: STATUS_BY_VALUE[item.value]?.color }}
                        title={`${item.label}: ${item.count} ta (${share(item.count)}%)`}
                    />
                ))}
            </div>

            <ul className="breakdown">
                {items.map((item) => (
                    <li key={item.value}>
                        <span className="status__dot" style={{ background: STATUS_BY_VALUE[item.value]?.color }} aria-hidden="true" />
                        <span className="breakdown__label">{item.label}</span>
                        <span className="breakdown__value">{item.count}</span>
                        <span className="breakdown__share">{share(item.count)}%</span>
                    </li>
                ))}
            </ul>
        </>
    );
}

// Kattadan kichikka tartiblangan gorizontal ustunlar, bitta rang
function RankedBars({ items }) {
    if (items.length === 0) {
        return <p className="muted">Hali hech kim sovg'ani sevimlilarga qo'shmagan.</p>;
    }

    const max = Math.max(...items.map((item) => item.favorites_count));

    return (
        <ol className="ranked">
            {items.map((item) => (
                <li key={item.id} className="ranked__row" title={`${item.name}: ${item.favorites_count} ta`}>
                    <span className="ranked__label">{item.name}</span>
                    <span className="ranked__track">
                        <span className="ranked__bar" style={{ width: `${(item.favorites_count / max) * 100}%` }} />
                    </span>
                    <span className="ranked__value">{item.favorites_count}</span>
                </li>
            ))}
        </ol>
    );
}

function DashboardPage() {
    const { data, error, loading, reload } = useAsync(async (signal) => {
        const [stats, orders] = await Promise.all([fetchStats(signal), fetchOrders({}, signal)]);
        return { stats, recent: orders.slice(0, 5) };
    }, "dashboard");

    if (!data) {
        return (
            <>
                <PageHead />
                {error ? (
                    <ErrorState message={error} onRetry={reload} />
                ) : (
                    <div className="tiles" aria-busy="true">
                        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton skeleton--tile" />)}
                    </div>
                )}
            </>
        );
    }

    const { stats, recent } = data;
    const newOrders = stats.orders_by_status.find((item) => item.value === "new")?.count ?? 0;

    return (
        <>
            <PageHead onRefresh={reload} refreshing={loading} />

            <div className="tiles">
                <StatTile
                    label="Daromad"
                    value={formatCompactPrice(stats.revenue)}
                    title={formatPrice(stats.revenue)}
                    sub="Bekor qilinganlardan tashqari"
                />
                <StatTile label="Buyurtmalar" value={formatNumber(stats.orders)} sub={`${newOrders} ta yangi`} />
                <StatTile label="Sovg'alar" value={formatNumber(stats.gifts)} sub={`${stats.categories} ta kategoriyada`} />
                <StatTile label="Sevimlilar" value={formatNumber(stats.favorites)} sub="Saqlangan sovg'alar" />
            </div>

            <div className="cards">
                <section className="card">
                    <h2 className="card__title">Buyurtma holatlari</h2>
                    <StatusBreakdown items={stats.orders_by_status} total={stats.orders} />
                </section>

                <section className="card">
                    <h2 className="card__title">Eng ko'p sevimliga qo'shilgan</h2>
                    <RankedBars items={stats.top_gifts} />
                </section>

                <section className="card card--wide">
                    <div className="card__head">
                        <h2 className="card__title">So'nggi buyurtmalar</h2>
                        <a href="#/orders" className="link">Barchasi →</a>
                    </div>

                    {recent.length === 0 ? (
                        <p className="muted">Hali buyurtmalar yo'q.</p>
                    ) : (
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Sovg'a</th>
                                        <th>Mijoz</th>
                                        <th className="num">Jami</th>
                                        <th>Holat</th>
                                        <th>Sana</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map((order) => (
                                        <tr key={order.id}>
                                            <td className="mono">#{order.id}</td>
                                            <td>
                                                <span className="cell-gift">
                                                    <span className="thumb"><GiftImage src={order.gift.image || order.gift.image_url} /></span>
                                                    {order.gift.name}
                                                </span>
                                            </td>
                                            <td>{order.customer_name}</td>
                                            <td className="num nowrap">{formatPrice(order.total_price)}</td>
                                            <td><StatusBadge status={order.status} /></td>
                                            <td className="nowrap muted">{formatDate(order.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function PageHead({ onRefresh, refreshing }) {
    return (
        <div className="page-head">
            <div>
                <h1 className="page-title">Bosh panel</h1>
                <p className="page-sub">Do'kon holati bir qarashda</p>
            </div>
            {onRefresh && (
                <button type="button" className="btn btn--ghost" onClick={onRefresh} disabled={refreshing}>
                    {refreshing ? "Yangilanmoqda..." : "Yangilash"}
                </button>
            )}
        </div>
    );
}

export default DashboardPage;
