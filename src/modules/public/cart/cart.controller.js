const cartService = require('./cart.service');

// Middleware to init cart session if undefined
const initCart = (req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    next();
};

/**
 * [GET] /cart
 * Render cart page
 */
const renderCart = async (req, res, next) => {
    try {
        const sessionCart = req.session.cart || [];
        const { items, totalAmount } = await cartService.getCartDetails(sessionCart);

        res.render('public/cart/index', {
            title: 'Giỏ hàng',
            items,
            totalAmount,
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /cart/count
 * Return total quantity in cart for header badge
 */
const getCartCount = (req, res) => {
    const sessionCart = req.session.cart || [];
    const count = sessionCart.reduce((total, item) => total + parseInt(item.quantity), 0);
    res.json({ success: true, count });
};

/**
 * [POST] /cart/add
 */
const addToCart = (req, res) => {
    try {
        let { product_id, quantity } = req.body;
        product_id = parseInt(product_id);
        quantity = parseInt(quantity) || 1;

        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
        }

        const existingItem = req.session.cart.find(item => parseInt(item.product_id) === product_id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            req.session.cart.push({ product_id, quantity });
        }

        const count = req.session.cart.reduce((tot, item) => tot + parseInt(item.quantity), 0);
        res.json({ success: true, message: 'Thêm vào giỏ hàng thành công', count });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi thêm vào giỏ' });
    }
};

/**
 * [POST] /cart/update
 */
const updateCart = (req, res) => {
    try {
        let { product_id, quantity } = req.body;
        product_id = parseInt(product_id);
        quantity = parseInt(quantity);

        if (!product_id || isNaN(quantity)) {
            return res.status(400).json({ success: false, message: 'Thông tin không hợp lệ' });
        }

        if (quantity <= 0) {
            // Remove item
            req.session.cart = req.session.cart.filter(item => parseInt(item.product_id) !== product_id);
        } else {
            // Update quantity
            const existingItem = req.session.cart.find(item => parseInt(item.product_id) === product_id);
            if (existingItem) {
                existingItem.quantity = quantity;
            }
        }

        const count = req.session.cart.reduce((tot, item) => tot + parseInt(item.quantity), 0);
        res.json({ success: true, message: 'Cập nhật giỏ hàng thành công', count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật giỏ' });
    }
};

/**
 * [POST] /cart/remove
 */
const removeFromCart = (req, res) => {
    try {
        let { product_id } = req.body;
        product_id = parseInt(product_id);

        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
        }

        req.session.cart = req.session.cart.filter(item => parseInt(item.product_id) !== product_id);
        const count = req.session.cart.reduce((tot, item) => tot + parseInt(item.quantity), 0);
        
        res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ', count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa sản phẩm' });
    }
};

module.exports = {
    initCart,
    renderCart,
    getCartCount,
    addToCart,
    updateCart,
    removeFromCart
};
