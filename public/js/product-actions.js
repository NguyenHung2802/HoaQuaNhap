/**
 * Xử lý các hành động trên trang Sản phẩm (Thêm giỏ hàng, Mua ngay)
 */
document.addEventListener('DOMContentLoaded', function() {
    // 1. Xử lý "Thêm vào giỏ hàng"
    const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
    addToCartButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (!AUTH_STATE.isLoggedIn) {
                e.preventDefault();
                // Redirect sang trang login với thông báo
                window.location.href = '/auth/login?msg=vui-long-dang-nhap-de-them-gio-hang';
            }
            // Nếu đã login, mặc định để submit form hoặc xử lý AJAX
        });
    });

    // 2. Xử lý "Mua ngay"
    const buyNowButtons = document.querySelectorAll('.btn-buy-now');
    buyNowButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (!AUTH_STATE.isLoggedIn) {
                e.preventDefault();
                
                // Lấy thông tin sản phẩm từ data-attributes
                const productId = this.getAttribute('data-product-id');
                const quantity = document.querySelector('#quantity-input')?.value || 1;

                // Gán vào hidden fields của Modal
                document.getElementById('quickCheckoutProductId').value = productId;
                const quantityField = document.getElementById('quickCheckoutQuantity');
                if (quantityField) quantityField.value = quantity;

                // Hiển thị Modal
                const authModal = new bootstrap.Modal(document.getElementById('authInterventionModal'));
                authModal.show();
            }
            // Nếu đã login, cho phép redirect thẳng sang trang checkout hoặc submit form checkout
        });
    });
});
