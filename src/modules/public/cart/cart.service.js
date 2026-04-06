const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fetch full details for the cart items in the session
 * @param {Array} sessionCart - [{ product_id, quantity }]
 */
const getCartDetails = async (sessionCart) => {
    if (!sessionCart || sessionCart.length === 0) {
        return { items: [], totalAmount: 0 };
    }

    const productIds = sessionCart.map(item => parseInt(item.product_id));

    // Fetch products
    const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            sale_price: true,
            stock_quantity: true,
            status: true,
            category_id: true,
            images: {
                where: { is_thumbnail: true },
                take: 1
            }
        }
    });

    let totalAmount = 0;
    const items = [];

    // Map session quantities with DB details
    sessionCart.forEach(cartItem => {
        const product = products.find(p => p.id === parseInt(cartItem.product_id));
        if (product) {
            const activePrice = product.sale_price ? parseFloat(product.sale_price) : parseFloat(product.price);
            const lineTotal = activePrice * cartItem.quantity;
            totalAmount += lineTotal;

            // Ensure quantity doesn't exceed stock visually (validation on checkout)
            const isOutOfStock = product.stock_quantity < cartItem.quantity || product.status !== 'published';

            items.push({
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                image_url: (product.images && product.images.length > 0) ? product.images[0].image_url : null,
                price: activePrice,
                original_price: parseFloat(product.price),
                category_id: product.category_id,
                quantity: cartItem.quantity,
                stock_quantity: product.stock_quantity,
                line_total: lineTotal,
                is_out_of_stock: isOutOfStock
            });
        }
    });

    return {
        items,
        totalAmount
    };
};

module.exports = {
    getCartDetails
};
