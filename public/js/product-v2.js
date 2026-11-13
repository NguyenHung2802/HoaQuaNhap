/*
 * Trang chi tiết sản phẩm giao diện v2 (S53): thanh mua dính trên điện thoại/máy tính bảng.
 * Nút trong thanh chỉ kích hoạt lại nút "Thêm vào giỏ" gốc, nên số lượng, hết hàng, hiệu ứng ảnh bay vào giỏ
 * và toàn bộ logic cũ giữ nguyên. Nếu không tìm thấy nút gốc thì không hiển thị thanh.
 */
(function () {
    'use strict';

    var mainBtn = document.querySelector('button[onclick^="addToCart("]');
    var title = document.querySelector('.detail-title');
    var price = document.querySelector('.detail-price-sale');
    if (!mainBtn || mainBtn.disabled || !title || !price || !('IntersectionObserver' in window)) return;

    var bar = document.createElement('div');
    bar.id = 'tv2-buybar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Mua nhanh');

    var info = document.createElement('div');
    info.className = 'bb-info';
    var name = document.createElement('div');
    name.className = 'bb-name';
    name.textContent = title.textContent.trim();
    var p = document.createElement('div');
    p.className = 'bb-price';
    p.textContent = price.textContent.trim();
    info.appendChild(name);
    info.appendChild(p);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary';
    btn.innerHTML = '<i class="fas fa-basket-shopping me-2" aria-hidden="true"></i>Thêm vào giỏ';
    btn.addEventListener('click', function () { mainBtn.click(); });

    bar.appendChild(info);
    bar.appendChild(btn);
    document.body.appendChild(bar);

    // Hiện khi nút gốc đã cuộn khỏi màn hình
    var io = new IntersectionObserver(function (entries) {
        var e = entries[0];
        var gone = !e.isIntersecting && e.boundingClientRect.top < 0;
        bar.classList.toggle('on', gone);
    }, { threshold: 0 });
    io.observe(mainBtn);
})();
