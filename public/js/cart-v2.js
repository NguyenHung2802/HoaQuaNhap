/*
 * Trang giỏ hàng giao diện v2 (S54): đổi số lượng / xóa sản phẩm KHÔNG tải lại trang.
 * Vẫn dùng đúng các API hiện có (POST /cart/update, POST /cart/remove); tổng tiền, freeship, hết hàng
 * do SERVER tính lại (lấy HTML trang /cart mới rồi thay vùng #cartRoot) nên không có logic tính tiền ở trình duyệt.
 * Mọi lỗi (mạng, cấu trúc trang) đều dùng lại hàm gốc của cart.js (tải lại trang như bản cũ).
 */
(function () {
    'use strict';

    var root = document.getElementById('cartRoot');
    if (!root) return;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var origUpdate = null;
    var origRemove = null;
    var inflight = 0;

    function toast(icon, title) {
        if (window.Swal && Swal.fire) {
            Swal.fire({ toast: true, position: 'bottom-end', icon: icon, title: title, showConfirmButton: false, timer: 2500, timerProgressBar: true });
        }
    }

    function post(url, body) {
        return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin' })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }

    function setBadges(text) {
        [].slice.call(document.querySelectorAll('.cart-badge')).forEach(function (b) { b.textContent = text; });
    }

    /** Lấy lại trang /cart từ server và thay vùng #cartRoot. */
    function refresh() {
        return fetch('/cart', { headers: { 'X-Requested-With': 'tv2-cart', Accept: 'text/html' }, credentials: 'same-origin' })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                var next = doc.getElementById('cartRoot');
                if (!next) throw new Error('layout');
                [].slice.call(next.querySelectorAll('[data-aos]')).forEach(function (el) { el.removeAttribute('data-aos'); });
                root.innerHTML = next.innerHTML;
                var badge = doc.querySelector('.cart-badge');
                if (badge) setBadges(badge.textContent.trim());
                if (!reduce) {
                    root.classList.remove('tv2-enter');
                    void root.offsetWidth;
                    root.classList.add('tv2-enter');
                    setTimeout(function () { root.classList.remove('tv2-enter'); }, 800);
                }
            });
    }

    function busy(productId, on) {
        var row = root.querySelector('.cart-item[data-product-id="' + productId + '"]');
        if (row) row.classList.toggle('tv2-busy', on);
    }

    function fallback(fn, args) {
        if (typeof fn === 'function') return fn.apply(window, args);
        window.location.reload();
    }

    function update(productId, newQty) {
        if (newQty <= 0) return window.removeCartItem(productId);
        var args = arguments;
        busy(productId, true);
        inflight++;
        return post('/cart/update', { product_id: productId, quantity: newQty })
            .then(function (d) {
                if (!d.success) { busy(productId, false); toast('error', d.message || 'Thao tác thất bại'); return; }
                return refresh();
            })
            .catch(function () { return fallback(origUpdate, args); })
            .then(function () { inflight--; });
    }

    function remove(productId) {
        var args = arguments;
        var ask = window.Swal && Swal.fire
            ? Swal.fire({ title: 'Xóa khỏi giỏ?', text: 'Sản phẩm sẽ bị loại bỏ khỏi giỏ hàng của bạn.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#4caf50', cancelButtonColor: '#e53e3e', confirmButtonText: 'Đồng ý', cancelButtonText: 'Hủy' })
            : Promise.resolve({ isConfirmed: window.confirm('Xóa sản phẩm khỏi giỏ hàng?') });
        return ask.then(function (res) {
            if (!res.isConfirmed) return;
            busy(productId, true);
            return post('/cart/remove', { product_id: productId })
                .then(function (d) {
                    if (!d.success) { busy(productId, false); toast('error', d.message || 'Thao tác thất bại'); return; }
                    return refresh();
                })
                .catch(function () { return fallback(origRemove, args); });
        });
    }

    // cart.js khai báo các hàm này trong DOMContentLoaded; thay thế sau khi chúng đã tồn tại.
    function install() {
        if (typeof window.updateCartItem !== 'function' || window.updateCartItem.__tv2) return;
        origUpdate = window.updateCartItem;
        origRemove = window.removeCartItem;
        update.__tv2 = true;
        window.updateCartItem = update;
        window.removeCartItem = remove;
    }
    if (document.readyState === 'complete') install();
    else {
        document.addEventListener('DOMContentLoaded', install);
        window.addEventListener('load', install);
    }
})();
