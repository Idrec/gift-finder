import { BagIcon, DashboardIcon, ExternalIcon, GiftIcon, LogoutIcon, TagIcon } from "./Icons";

const SITE_URL = import.meta.env.VITE_SITE_URL ?? "http://localhost:3000/";

const NAV_ITEMS = [
    { page: "dashboard", href: "#/", label: "Bosh panel", Icon: DashboardIcon },
    { page: "orders", href: "#/orders", label: "Buyurtmalar", Icon: BagIcon },
    { page: "gifts", href: "#/gifts", label: "Sovg'alar", Icon: GiftIcon },
    { page: "categories", href: "#/categories", label: "Kategoriyalar", Icon: TagIcon },
];

function Sidebar({ page, user, onLogout }) {
    return (
        <aside className="sidebar">
            <a href="#/" className="brand">
                <span className="brand__logo"><GiftIcon /></span>
                <span className="brand__text">
                    Gift Finder
                    <small>Admin panel</small>
                </span>
            </a>

            <nav className="side-nav" aria-label="Admin menyu">
                {NAV_ITEMS.map(({ page: itemPage, href, label, Icon }) => (
                    <a
                        key={itemPage}
                        href={href}
                        className={`side-nav__link ${page === itemPage ? "is-active" : ""}`}
                        aria-current={page === itemPage ? "page" : undefined}
                    >
                        <Icon />
                        <span>{label}</span>
                    </a>
                ))}
            </nav>

            <div className="sidebar__foot">
                <a className="side-nav__link" href={SITE_URL} target="_blank" rel="noreferrer">
                    <ExternalIcon />
                    <span>Saytni ochish</span>
                </a>
                <div className="user">
                    <span className="user__avatar" aria-hidden="true">
                        {user.username.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="user__name">{user.username}</span>
                    <button type="button" className="icon-btn" onClick={onLogout} aria-label="Chiqish" title="Chiqish">
                        <LogoutIcon />
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
