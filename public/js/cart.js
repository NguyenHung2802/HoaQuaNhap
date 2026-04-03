/**
 * Cart interaction logic
 */
document.addEventListener('DOMContentLoaded', () => {

    // Global Toast setup
    const Toast = Swal.mixin({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    // Expose functions globally for inline handlers
    window.addToCart = async function(productId, quantity = 1) {
        try {
            const res = await fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ product_id: productId, quantity })
            });

            const data = await res.json();
            if (data.success) {
                updateCartBadge(data.count);
                Toast.fire({
                    icon: 'success',
                    title: 'Đã thêm sản phẩm vào giỏ!'
                });
            } else {
                Toast.fire({
                    icon: 'error',
                    title: data.message || 'Có lỗi xảy ra'
                });
            }
        } catch (error) {
            console.error(error);
            Toast.fire({
                icon: 'error',
                title: 'Lỗi kết nối mạng'
            });
        }
    };

    window.updateCartItem = async function(productId, newQty) {
        if (newQty <= 0) {
            return window.removeCartItem(productId);
        }
        
        try {
            const res = await fetch('/cart/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ product_id: productId, quantity: newQty })
            });

            const data = await res.json();
            if (data.success) {
                // Reload to recalculate totals
                window.location.reload();
            } else {
                Toast.fire({
                    icon: 'error',
                    title: data.message || 'Thao tác thất bại'
                });
            }
        } catch (error) {
            console.error(error);
            Toast.fire({
                icon: 'error',
                title: 'Lỗi mạng'
            });
        }
    };

    window.removeCartItem = async function(productId) {
        Swal.fire({
            title: 'Xóa khỏi giỏ?',
            text: "Sản phẩm sẽ bị loại bỏ khỏi giỏ hàng của bạn.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4caf50',
            cancelButtonColor: '#e53e3e',
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch('/cart/remove', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ product_id: productId })
                    });

                    const data = await res.json();
                    if (data.success) {
                        window.location.reload();
                    } else {
                        Toast.fire({
                            icon: 'error',
                            title: data.message || 'Thao tác thất bại'
                        });
                    }
                } catch (error) {
                    console.error(error);
                    Toast.fire({
                        icon: 'error',
                        title: 'Lỗi mạng'
                    });
                }
            }
        })
    };

    function updateCartBadge(count) {
        const badge = document.getElementById('nav-cart-badge');
        if (badge) {
            badge.innerText = count;
            badge.classList.add('animate__animated', 'animate__rubberBand');
            setTimeout(() => {
                badge.classList.remove('animate__animated', 'animate__rubberBand');
            }, 1000);
        }
    }
});
