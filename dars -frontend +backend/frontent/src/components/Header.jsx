import { BagIcon, GiftIcon, GridIcon, HeartIcon, PlusIcon } from "./Icons";

const LINKS = [
    { page: "home", href: "#/", label: "Sovg'alar", Icon: GridIcon },
    { page: "favorites", href: "#/favorites", label: "Sevimlilar", Icon: HeartIcon },
    { page: "orders", href: "#/orders", label: "Buyurtmalarim", Icon: BagIcon },
];

function Header({ page, favoritesCount, onAdd }) {
    return (
        <header className="header">
            <div className="container header__inner">
                <a href="#/" className="brand">
                    <span className="brand__logo"><GiftIcon /></span>
                    <span className="brand__name">Gift Finder</span>
                </a>

                <nav className="nav" aria-label="Asosiy menyu">
                    {LINKS.map(({ page: linkPage, href, label, Icon }) => {
                        const isActive = page === linkPage;

                        return (
                            <a
                                key={linkPage}
                                href={href}
                                className={`nav__link ${isActive ? "is-active" : ""}`}
                                aria-current={isActive ? "page" : undefined}
                                title={label}
                            >
                                <Icon filled={isActive} />
                                <span className="nav__label">{label}</span>
                                {linkPage === "favorites" && favoritesCount > 0 && (
                                    <span className="badge">{favoritesCount}</span>
                                )}
                            </a>
                        );
                    })}
                </nav>

                <button
                    type="button"
                    className="btn btn--primary header__add"
                    onClick={onAdd}
                    aria-label="Yangi sovg'a qo'shish"
                >
                    <PlusIcon />
                    <span className="header__add-label">Sovg'a qo'shish</span>
                </button>
            </div>
        </header>
    );
}

export default Header;
