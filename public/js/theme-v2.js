/*
 * Giao diện v2 (S51) — hành vi dùng chung cho mọi trang công khai:
 * thanh tiến độ cuộn, header thu gọn, hiện dần khi cuộn, ngăn kéo giỏ hàng, ảnh bay vào giỏ,
 * tải trước trang khi rê chuột. Mọi thứ là nâng cấp: nếu file này lỗi, trang vẫn dùng bình thường.
 */
(function () {
    'use strict';

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
    var fmt = function (n) { return Math.round(Number(n) || 0).toLocaleString('vi-VN') + 'đ'; };

    /* ---------- Thanh tiến độ + header thu gọn ---------- */
    var bar = $('#tv2-progress');
    var nav = $('#mainNavbar');
    var ticking = false;
    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
            var doc = document.documentElement;
            var max = doc.scrollHeight - window.innerHeight;
            if (bar) bar.style.width = (max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0) + '%';
            if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);
            ticking = false;
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Hiện dần khi cuộn (thay AOS) ----------
     * Không phụ thuộc thư viện nào: chỉ gắn lớp cho phần tử đang nằm DƯỚI màn hình lúc tải, nên nội dung nhìn
     * thấy ngay khi vào trang được hiển thị tức thì (không chờ JS). Nếu IntersectionObserver không có, mọi thứ vẫn hiện sẵn. */
    if (!reduce && 'IntersectionObserver' in window) {
        var all = $$('[data-aos], .fruit-card, .blog-card, .cat-circle-item, .combo-card, .hv2-coll, .why-card, .testimonial-card, main section h2.section-title');
        // Chỉ giữ phần tử ngoài cùng (bỏ phần tử nằm trong một phần tử khác cũng sẽ hiện dần)
        var targets = all.filter(function (el) {
            for (var p = el.parentElement; p; p = p.parentElement) { if (all.indexOf(p) !== -1) return false; }
            return true;
        });
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                io.unobserve(e.target);
                var el = e.target;
                el.classList.add('tv2-in');
                // Gỡ lớp sau khi xong để hiệu ứng hover của thẻ không bị trễ do transition-delay
                setTimeout(function () { el.classList.remove('tv2-reveal', 'tv2-in'); el.style.transitionDelay = ''; }, 800);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
        var seenRows = new Map();
        var vh = window.innerHeight || 800;
        targets.forEach(function (el) {
            if (el.getBoundingClientRect().top < vh * 1.05) return; // đã/sắp thấy được: hiển thị ngay, không hiệu ứng
            var parent = el.parentElement;
            var idx = seenRows.get(parent) || 0;
            seenRows.set(parent, idx + 1);
            el.style.transitionDelay = Math.min(idx * 50, 200) + 'ms';
            el.classList.add('tv2-reveal');
            io.observe(el);
        });
    }

    /* ---------- Huy hiệu giỏ hàng ---------- */
    function setBadges(count) {
        $$('.cart-badge').forEach(function (b) {
            var changed = b.textContent.trim() !== String(count);
            b.textContent = count;
            if (changed && !reduce) {
                b.classList.remove('tv2-bump');
                void b.offsetWidth;
                b.classList.add('tv2-bump');
            }
        });
    }
    function badgeCount() {
        var b = $('.cart-badge');
        return b ? parseInt(b.textContent, 10) || 0 : 0;
    }

    /* ---------- Ngăn kéo giỏ hàng ---------- */
    var drawer = $('#tv2-cart');
    var scrim = $('#tv2-scrim');
    var listEl = $('#tv2-cart-list');
    var lastFocus = null;
    var cartData = null;

    function api(url, body) {
        return fetch(url, {
            method: body ? 'POST' : 'GET',
            headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'same-origin'
        }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text !== undefined) n.textContent = text;
        return n;
    }

    function renderCart(data) {
        cartData = data;
        var items = data.items || [];
        $('#tv2-cart-count').textContent = items.length ? '(' + data.count + ' sản phẩm)' : '';
        $('#tv2-cart-total').textContent = fmt(data.totalAmount);
        setBadges(data.count || 0);

        var ship = $('#tv2-ship');
        if (data.shipping && items.length) {
            ship.hidden = false;
            $('#tv2-ship-msg').textContent = data.shipping.message;
            requestAnimationFrame(function () { $('#tv2-ship-fill').style.width = Math.max(4, data.shipping.progress) + '%'; });
        } else {
            ship.hidden = true;
        }

        var checkout = $('#tv2-checkout');
        var blocked = !items.length || items.some(function (i) { return i.is_out_of_stock; });
        checkout.classList.toggle('is-disabled', blocked);
        checkout.setAttribute('aria-disabled', blocked ? 'true' : 'false');

        listEl.textContent = '';
        if (!items.length) {
            var empty = el('div', 'tv2-empty');
            empty.appendChild(el('i', 'fas fa-shopping-basket'));
            empty.appendChild(document.createTextNode('Giỏ hàng đang trống.'));
            empty.appendChild(document.createElement('br'));
            var shop = el('a', null, 'Chọn trái cây ngon →');
            shop.href = '/products';
            empty.appendChild(shop);
            listEl.appendChild(empty);
            return;
        }
        items.forEach(function (it) {
            var row = el('div', 'tv2-row');
            row.dataset.id = it.product_id;

            var imgLink = el('a');
            imgLink.href = '/product/' + encodeURIComponent(it.slug);
            var img = el('img', 'tv2-row-img');
            img.alt = '';
            img.loading = 'lazy';
            img.src = it.image_url || '/images/favicon.png';
            imgLink.appendChild(img);

            var info = el('div');
            var name = el('a', 'tv2-row-name', it.name);
            name.href = imgLink.href;
            var price = el('div', 'tv2-row-price', fmt(it.price));
            if (it.is_discounted) price.appendChild(el('s', null, fmt(it.original_price)));
            info.appendChild(name);
            info.appendChild(price);
            if (it.is_out_of_stock) info.appendChild(el('div', 'tv2-row-warn', 'Không đủ hàng, vui lòng giảm số lượng'));

            var qty = el('div', 'tv2-qty');
            var minus = el('button', null, '−');
            minus.type = 'button';
            minus.setAttribute('aria-label', 'Giảm số lượng');
            minus.dataset.act = 'dec';
            var num = el('span', null, String(it.quantity));
            var plus = el('button', null, '+');
            plus.type = 'button';
            plus.setAttribute('aria-label', 'Tăng số lượng');
            plus.dataset.act = 'inc';
            if (it.quantity >= it.stock_quantity) plus.disabled = true;
            qty.appendChild(minus); qty.appendChild(num); qty.appendChild(plus);
            info.appendChild(qty);

            var side = el('div', 'tv2-row-side');
            side.appendChild(el('div', 'tv2-row-total', fmt(it.line_total)));
            var del = el('button', 'tv2-del', 'Xóa');
            del.type = 'button';
            del.dataset.act = 'del';
            del.setAttribute('aria-label', 'Xóa ' + it.name + ' khỏi giỏ');
            side.appendChild(del);

            row.appendChild(imgLink); row.appendChild(info); row.appendChild(side);
            listEl.appendChild(row);
        });
    }

    function loadCart() {
        return api('/cart/mini').then(function (d) { if (d && d.success) renderCart(d); return d; });
    }

    function openDrawer() {
        if (!drawer) return Promise.reject(new Error('no drawer'));
        lastFocus = document.activeElement;
        return loadCart().then(function () {
            drawer.hidden = false; scrim.hidden = false;
            drawer.setAttribute('aria-hidden', 'false');
            document.body.classList.add('tv2-lock');
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { drawer.classList.add('open'); scrim.classList.add('open'); var c = $('#tv2-cart-close'); if (c) c.focus({ preventScroll: true }); });
            });
        });
    }
    function closeDrawer() {
        if (!drawer || drawer.hidden) return;
        drawer.classList.remove('open'); scrim.classList.remove('open');
        drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('tv2-lock');
        setTimeout(function () { drawer.hidden = true; scrim.hidden = true; }, reduce ? 0 : 520);
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    if (drawer) {
        $('#tv2-cart-close').addEventListener('click', closeDrawer);
        scrim.addEventListener('click', closeDrawer);
        document.addEventListener('keydown', function (e) {
            if (!drawer.hidden && e.key === 'Escape') closeDrawer();
            if (!drawer.hidden && e.key === 'Tab') {
                var f = $$('a[href], button:not(:disabled)', drawer).filter(function (n) { return n.offsetParent !== null; });
                if (!f.length) return;
                var first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });

        // Thao tác trong ngăn kéo: tăng/giảm/xóa không tải lại trang
        listEl.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-act]');
            if (!btn || !cartData) return;
            var row = btn.closest('.tv2-row');
            var id = parseInt(row.dataset.id, 10);
            var item = cartData.items.filter(function (i) { return i.product_id === id; })[0];
            if (!item) return;
            var act = btn.dataset.act;
            var p;
            if (act === 'del' || (act === 'dec' && item.quantity <= 1)) {
                row.classList.add('is-removing');
                p = new Promise(function (r) { setTimeout(r, reduce ? 0 : 260); }).then(function () { return api('/cart/remove', { product_id: id }); });
            } else {
                var q = item.quantity + (act === 'inc' ? 1 : -1);
                $$('button', row).forEach(function (b) { b.disabled = true; });
                p = api('/cart/update', { product_id: id, quantity: q });
            }
            p.then(function () { return loadCart(); }).catch(function () {
                window.location.href = '/cart'; // lỗi mạng/máy chủ: về trang giỏ hàng đầy đủ
            });
        });
    }

    // Bấm biểu tượng giỏ: mở ngăn kéo (trừ khi đang ở /cart, /checkout hoặc bấm kèm Ctrl/Cmd/chuột giữa)
    document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href="/cart"]');
        if (!a || !drawer || a.closest('#tv2-cart')) return;
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        var path = window.location.pathname;
        if (path === '/cart' || path.indexOf('/checkout') === 0) return;
        if (!a.classList.contains('nav-icon-btn') && !a.closest('.app-bottom-nav')) return; // chỉ biểu tượng giỏ ở header/thanh dưới
        e.preventDefault();
        openDrawer().catch(function () { window.location.href = '/cart'; });
    });

    /* ---------- Ảnh bay vào giỏ khi thêm sản phẩm ---------- */
    var lastAddBtn = null;
    document.addEventListener('click', function (e) {
        var b = e.target.closest('[onclick*="addToCart"]');
        if (b) lastAddBtn = b;
    }, true);

    function cartIconTarget() {
        var cands = $$('.nav-icon-btn[href="/cart"], .app-bottom-nav a[href="/cart"]');
        for (var i = 0; i < cands.length; i++) {
            var r = cands[i].getBoundingClientRect();
            if (r.width > 0 && r.height > 0) return cands[i];
        }
        return null;
    }
    function fly(fromEl) {
        if (reduce || !fromEl || !fromEl.animate) return;
        var card = fromEl.closest('.fruit-card, .card, .col-6, .col-md-3, .product-detail, .row');
        var src = (card && $('img', card)) || $('#mainImage, .main-image img, .product-main-img');
        var target = cartIconTarget();
        if (!src || !src.src || !target) return;
        var a = fromEl.getBoundingClientRect();
        var b = target.getBoundingClientRect();
        var node = document.createElement('img');
        node.className = 'tv2-fly';
        node.src = src.currentSrc || src.src;
        node.alt = '';
        node.style.left = a.left + a.width / 2 - 32 + 'px';
        node.style.top = a.top + a.height / 2 - 32 + 'px';
        document.body.appendChild(node);
        var dx = b.left + b.width / 2 - (a.left + a.width / 2);
        var dy = b.top + b.height / 2 - (a.top + a.height / 2);
        var anim = node.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: 'translate(' + dx * 0.55 + 'px, ' + (dy * 0.55 - 70) + 'px) scale(.8)', opacity: 1, offset: 0.55 },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(.2)', opacity: .35 }
        ], { duration: 780, easing: 'cubic-bezier(.5,0,.75,.4)' });
        anim.onfinish = function () { node.remove(); };
        setTimeout(function () { if (node.parentNode) node.remove(); }, 1500); // phòng khi trình duyệt không phát onfinish (tab nền)
    }

    // cart.js khai báo window.addToCart trong DOMContentLoaded; bọc lại sau đó để thêm hiệu ứng.
    function wrapAddToCart() {
        if (typeof window.addToCart !== 'function' || window.addToCart.__tv2) return;
        var orig = window.addToCart;
        var wrapped = function () {
            var src = lastAddBtn;
            var before = badgeCount();
            var out = orig.apply(this, arguments);
            return Promise.resolve(out).then(function (r) {
                if (badgeCount() > before) {
                    fly(src);
                    if (drawer && !drawer.hidden) loadCart().catch(function () {});
                }
                return r;
            });
        };
        wrapped.__tv2 = true;
        window.addToCart = wrapped;
    }
    // Script defer chạy khi readyState = 'interactive' (trước DOMContentLoaded), nên luôn đăng ký sự kiện
    // (sau trình nghe của cart.js vì cart.js được nạp trước) và thử lại khi trang tải xong.
    if (document.readyState === 'complete') wrapAddToCart();
    else {
        document.addEventListener('DOMContentLoaded', wrapAddToCart);
        window.addEventListener('load', wrapAddToCart);
    }

    /* ---------- Tải trước trang khi rê chuột (chỉ máy có chuột, tối đa 6 trang) ---------- */
    if (fine && !reduce) {
        var prefetched = {};
        var count = 0;
        var timer = null;
        document.addEventListener('pointerover', function (e) {
            var a = e.target.closest && e.target.closest('a[href^="/"]');
            if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
            var url = a.getAttribute('href');
            if (/^\/(cart|checkout|auth|admin|profile|orders|wishlist|api|t$)/.test(url) || url.indexOf('#') === 0 || prefetched[url] || count >= 6) return;
            clearTimeout(timer);
            timer = setTimeout(function () {
                if (prefetched[url]) return;
                prefetched[url] = true; count++;
                var l = document.createElement('link');
                l.rel = 'prefetch';
                l.href = url;
                document.head.appendChild(l);
            }, 120);
        }, { passive: true });
    }

    window.TV2 = { openCart: openDrawer, closeCart: closeDrawer, reloadCart: loadCart };
})();
