import { useState } from "react";

// Rasm bo'lmasa yoki yuklanmasa — 🎁 belgisi
function GiftImage({ src, alt }) {
    const [failed, setFailed] = useState(false);

    if (!src || failed) {
        return <div className="gift-placeholder" aria-hidden="true">🎁</div>;
    }

    return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}

export default GiftImage;
