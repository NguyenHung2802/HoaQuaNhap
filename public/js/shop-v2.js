/*
 * Trang shop giao diện v2 (S53): lọc/sắp xếp/phân trang không tải lại trang, bộ lọc gập trên điện thoại.
 * Là NÂNG CẤP: mọi thao tác vẫn là form/link thường. Nếu fetch lỗi hoặc cấu trúc trang không khớp,
 * script tự chuyển sang tải trang đầy đủ như bản cũ.
 */
(function () {
    'use strict';

    var results = document.getElementById('shopResults');
    var side = document.getElementById('shopSidebar');
    var sideCol = document.getElementById('shopSidebarCol');
    if (!results || !side) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var controller = null;
    var seq = 0;

    function stripAos(root) {
        [].slice.call(root.querySelectorAll('[data-aos]')).forEach(function (el) {
            [].slice.call(el.attributes).forEach(function (a) { if (a.name.indexOf('data-aos') === 0) el.removeAttribute(a.name); });
        });
    }

    function formUrl() {
        var form = document.getElementById('filterForm');
        var params = new URLSearchParams();
        new FormData(form).forEach(function (v, k) { if (v !== '') params.append(k, v); });
        var qs = params.toString();
        return '/products' + (qs ? '?' + qs : '');
    }

    function load(url, push) {
        if (controller) controller.abort();
        controller = window.AbortController ? new AbortController() : null;
        var mine = ++seq;
        results.classList.remove('tv2-enter');
        results.classList.add('tv2-loading');
        results.setAttribute('aria-busy', 'true');

        fetch(url, { headers: { 'X-Requested-With': 'tv2-shop', Accept: 'text/html' }, credentials: 'same-origin', signal: controller ? controller.signal : undefined })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .then(function (html) {
                if (mine !== seq) return; // đã có yêu cầu mới hơn
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var nr = doc.getElementById('shopResults');
                var ns = doc.getElementById('shopSidebar');
                if (!nr || !ns) throw new Error('layout');
                stripAos(nr); stripAos(ns);

                var keepScroll = window.scrollY;
                results.innerHTML = nr.innerHTML;
                side.innerHTML = ns.innerHTML;
                document.title = doc.title || document.title;
                if (push) history.pushState({ tv2shop: 1 }, '', url);

                results.classList.remove('tv2-loading');
                results.removeAttribute('aria-busy');
                if (!reduce) {
                    void results.offsetWidth;
                    results.classList.add('tv2-enter');
                    setTimeout(function () { results.classList.remove('tv2-enter'); }, 900);
                }
                var bar = results.querySelector('.shop-toolbar');
                if (bar) bar.setAttribute('aria-live', 'polite');
                // Chỉ cuộn lên đầu danh sách khi người dùng đang ở xa phía dưới (phân trang)
                var top = results.getBoundingClientRect().top;
                if (top < 0 || (window.innerWidth < 992 && top > window.innerHeight * 0.6)) {
                    window.scrollTo({ top: Math.max(0, results.getBoundingClientRect().top + window.scrollY - 90), behavior: reduce ? 'auto' : 'smooth' });
                } else {
                    window.scrollTo(0, keepScroll);
                }
                if (window.innerWidth < 992 && sideCol) { sideCol.classList.remove('is-open'); syncToggle(); }
            })
            .catch(function (e) {
                if (e && e.name === 'AbortError') return;
                window.location.href = url; // dự phòng: tải trang đầy đủ như bản cũ
            });
    }

    /* Chọn danh mục/nguồn gốc/trạng thái/sắp xếp: chặn form.submit() nội tuyến, dùng tải nhẹ */
    document.addEventListener('change', function (e) {
        var t = e.target;
        if (!t || !t.matches) return;
        var inFilter = t.form && t.form.id === 'filterForm' && (t.type === 'radio' || t.type === 'checkbox');
        var isSort = t.matches('#sortForm select[name="sort"]');
        if (!inFilter && !isSort) return;
        e.stopPropagation(); // không để onchange="...submit()" nội tuyến chạy
        if (isSort) {
            var hidden = document.getElementById('hiddenSort');
            if (hidden) hidden.value = t.value;
        }
        load(formUrl(), true);
    }, true);

    /* Tìm kiếm / áp dụng khoảng giá */
    document.addEventListener('submit', function (e) {
        if (!e.target || e.target.id !== 'filterForm') return;
        e.preventDefault();
        load(formUrl(), true);
    }, true);

    /* Phân trang, "Xóa bộ lọc", "Xem tất cả" */
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.cat-expand-btn');
        if (btn) { // mở/đóng danh mục con (xử lý tại đây để dùng được cả với nội dung vừa thay)
            e.stopPropagation();
            var wrapper = btn.closest('.cat-filter-wrapper');
            var open = wrapper.classList.toggle('expanded');
            btn.setAttribute('aria-expanded', String(open));
            return;
        }
        var a = e.target.closest && e.target.closest('#shopResults a[href], #shopSidebar a[href]');
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
        var href = a.getAttribute('href');
        if (!/^(\?|\/products(\?|$))/.test(href) || a.closest('.page-item.disabled')) return;
        e.preventDefault();
        load(href.charAt(0) === '?' ? '/products' + href : href, true);
    }, true);

    window.addEventListener('popstate', function () {
        if (/^\/products/.test(location.pathname)) load(location.pathname + location.search, false);
    });

    /* Bộ lọc gập trên điện thoại */
    var toggle = null;
    function syncToggle() {
        if (toggle && sideCol) toggle.setAttribute('aria-expanded', sideCol.classList.contains('is-open') ? 'true' : 'false');
    }
    if (sideCol) {
        sideCol.classList.add('tv2-collapsible');
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'tv2-filter-toggle';
        toggle.setAttribute('aria-controls', 'shopSidebarCol');
        toggle.innerHTML = '<span><i class="fas fa-sliders-h me-2" aria-hidden="true"></i>Bộ lọc &amp; danh mục</span><i class="fas fa-chevron-down" aria-hidden="true"></i>';
        sideCol.parentNode.insertBefore(toggle, sideCol);
        toggle.addEventListener('click', function () {
            sideCol.classList.toggle('is-open');
            syncToggle();
        });
        syncToggle();
    }
})();
