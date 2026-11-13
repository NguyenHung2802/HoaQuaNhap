/*
 * Popup affiliate, banner dính và theo dõi lượt bấm cho trang tin ẩn.
 *
 * Quy tắc (đã chốt với chủ web, theo chính sách Shopee/TikTok Affiliate):
 *  - Popup hiện sau độ trễ MỖI LẦN vào hoặc tải lại trang, luôn ghi "Quảng cáo · Liên kết tiếp thị".
 *  - Bấm vào thân popup / nút CTA: mở link affiliate ở tab MỚI (do người dùng bấm) và đóng popup.
 *  - Bấm nút X, vùng nền mờ hoặc phím Esc: CHỈ đóng popup, không mở link.
 *  - Không tự mở tab, không chuyển hướng.
 */
(function () {
    'use strict';

    var cfgEl = document.getElementById('news-config');
    if (!cfgEl) return;
    var cfg;
    try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
    if (!cfg || !cfg.postId || !cfg.token) return;

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var REL = 'sponsored nofollow noopener noreferrer';
    var safeUrl = typeof cfg.affiliateUrl === 'string' && /^https:\/\//i.test(cfg.affiliateUrl) ? cfg.affiliateUrl : null;
    if (!safeUrl) return;

    /* ---------- Theo dõi ---------- */
    function track(event) {
        try {
            var body = JSON.stringify({ id: cfg.postId, token: cfg.token, event: event });
            if (navigator.sendBeacon && navigator.sendBeacon('/t', new Blob([body], { type: 'application/json' }))) return;
            fetch('/t', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
        } catch (e) { /* thống kê không được làm hỏng trang */ }
    }

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    /* ---------- CTA cuối bài ---------- */
    var inline = document.querySelectorAll('[data-cta="inline"]');
    for (var i = 0; i < inline.length; i++) inline[i].addEventListener('click', function () { track('cta_inline'); });

    /* ---------- Banner dính ---------- */
    var banner = null;
    var bannerShown = false;

    function showBanner() {
        if (bannerShown) return;
        bannerShown = true;
        banner = el('div', 'nb');
        banner.setAttribute('role', 'complementary');
        banner.setAttribute('aria-label', 'Quảng cáo');

        var link = el('a', 'nb-link');
        link.href = safeUrl;
        link.target = '_blank';
        link.rel = REL;
        if (cfg.image) {
            var thumb = el('img', 'nb-img');
            thumb.src = cfg.image;
            thumb.alt = '';
            thumb.loading = 'lazy';
            link.appendChild(thumb);
        }
        var text = el('span', 'nb-text');
        text.appendChild(el('small', null, 'Quảng cáo · Liên kết tiếp thị'));
        text.appendChild(el('b', null, cfg.headline || ''));
        link.appendChild(text);
        link.appendChild(el('span', 'nb-btn', cfg.cta || 'Xem ưu đãi'));
        link.addEventListener('click', function () { track('cta_banner'); });

        var close = el('button', 'nb-x', '×');
        close.type = 'button';
        close.setAttribute('aria-label', 'Ẩn quảng cáo');
        close.addEventListener('click', function () {
            banner.classList.remove('on');
            document.body.classList.remove('has-banner');
            setTimeout(function () { if (banner && banner.parentNode) banner.parentNode.removeChild(banner); }, 300);
        });

        banner.appendChild(link);
        banner.appendChild(close);
        document.body.appendChild(banner);
        document.body.classList.add('has-banner');
        requestAnimationFrame(function () { requestAnimationFrame(function () { banner.classList.add('on'); }); });
    }

    function onScroll() {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        if (max > 0 && window.scrollY / max > 0.35) {
            window.removeEventListener('scroll', onScroll);
            showBanner();
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* ---------- Popup ---------- */
    var overlay = null;
    var prevOverflow = '';

    function closePopup(reason) {
        if (!overlay) return;
        var o = overlay;
        overlay = null;
        document.body.style.overflow = prevOverflow;
        document.removeEventListener('keydown', onKey, true);
        if (reason !== 'cta') track('popup_close');
        o.classList.remove('on');
        setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, reduceMotion ? 0 : 260);
        showBanner();
    }

    function onKey(e) {
        if (!overlay) return;
        if (e.key === 'Escape' || e.key === 'Esc') {
            e.preventDefault();
            closePopup('esc');
            return;
        }
        if (e.key === 'Tab') {
            var focusables = overlay.querySelectorAll('a[href], button');
            if (!focusables.length) return;
            var first = focusables[0];
            var last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    }

    function openPopup() {
        if (overlay) return;
        overlay = el('div', 'np-overlay');
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'np-title');

        var wrap = el('div', 'np-wrap');

        // Toàn bộ thẻ là một liên kết thật: bấm chỗ nào trong thẻ cũng mở link ở tab mới.
        var card = el('a', 'np-card');
        card.href = safeUrl;
        card.target = '_blank';
        card.rel = REL;
        if (cfg.image) {
            var media = el('span', 'np-media');
            var img = el('img');
            img.src = cfg.image;
            img.alt = '';
            media.appendChild(img);
            card.appendChild(media);
        }
        var body = el('span', 'np-body');
        body.appendChild(el('span', 'np-tag', 'Quảng cáo · Liên kết tiếp thị'));
        var title = el('strong', 'np-title', cfg.headline || '');
        title.id = 'np-title';
        body.appendChild(title);
        body.appendChild(el('span', 'np-cta', (cfg.cta || 'Xem ưu đãi') + ' →'));
        card.appendChild(body);
        card.addEventListener('click', function () {
            track('cta_popup');
            // Không preventDefault: trình duyệt mở tab mới; popup đóng ngay sau đó.
            setTimeout(function () { closePopup('cta'); }, 0);
        });

        // Nút X là phần tử riêng, nằm NGOÀI liên kết: chỉ đóng, không mở link.
        var x = el('button', 'np-x', '×');
        x.type = 'button';
        x.setAttribute('aria-label', 'Đóng quảng cáo');
        x.addEventListener('click', function (e) { e.stopPropagation(); closePopup('x'); });

        wrap.appendChild(card);
        wrap.appendChild(x);
        overlay.appendChild(wrap);
        // Vùng nền mờ: chỉ đóng.
        overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup('backdrop'); });

        prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        document.body.appendChild(overlay);
        document.addEventListener('keydown', onKey, true);
        requestAnimationFrame(function () { requestAnimationFrame(function () { overlay.classList.add('on'); card.focus({ preventScroll: true }); }); });
        track('popup_show');
    }

    var delay = typeof cfg.delayMs === 'number' && cfg.delayMs >= 0 ? cfg.delayMs : 1500;
    setTimeout(openPopup, delay);
})();
