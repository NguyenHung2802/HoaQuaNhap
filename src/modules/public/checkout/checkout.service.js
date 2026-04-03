const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate unique order code: WHQ-YYMMDD-XXXX
 */
const generateOrderCode = () => {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `WHQ-${yy}${mm}${dd}-${random}`;
};

/**
 * Process order with Prisma transaction
 */
const processOrder = async (orderData, sessionCart, userId) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch current products to check stock and prices
        const productIds = sessionCart.map(item => parseInt(item.product_id));
        const products = await tx.product.findMany({
            where: { id: { in: productIds } }
        });

        const orderItemsParams = [];
        let subtotalAmount = 0;

        for (const cartItem of sessionCart) {
            const product = products.find(p => p.id === parseInt(cartItem.product_id));
            if (!product) {
                throw new Error(`Sản phẩm không tồn tại (ID: ${cartItem.product_id})`);
            }
            if (product.status !== 'published') {
                throw new Error(`Sản phẩm ${product.name} đang ngừng bán.`);
            }
            if (product.stock_quantity < cartItem.quantity) {
                throw new Error(`Sản phẩm ${product.name} không đủ tồn kho (Còn ${product.stock_quantity}).`);
            }

            const activePrice = product.sale_price ? parseFloat(product.sale_price) : parseFloat(product.price);
            const lineTotal = activePrice * cartItem.quantity;
            subtotalAmount += lineTotal;

            orderItemsParams.push({
                product_id: product.id,
                product_name_snapshot: product.name,
                sku_snapshot: product.sku,
                price_snapshot: activePrice,
                quantity: parseInt(cartItem.quantity),
                line_total: lineTotal
            });
        }

        // 2. Resolve Customer
        let customerId = null;
        if (userId) {
            // Logged in user
            let customer = await tx.customer.findUnique({ where: { user_id: parseInt(userId) } });
            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        full_name: orderData.customer_name,
                        phone: orderData.customer_phone,
                        email: orderData.customer_email || null,
                        user_id: parseInt(userId)
                    }
                });
            }
            customerId = customer.id;
        } else {
            // Guest checkout
            let customer = await tx.customer.findUnique({ where: { phone: orderData.customer_phone } });
            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        full_name: orderData.customer_name,
                        phone: orderData.customer_phone,
                        email: orderData.customer_email || null
                    }
                });
            }
            customerId = customer.id;
        }

        // 3. Create Order
        const orderCode = generateOrderCode();
        const totalAmount = subtotalAmount; // Shipping free for now, no discount logic yet

        const order = await tx.order.create({
            data: {
                order_code: orderCode,
                customer_id: customerId,
                customer_name: orderData.customer_name,
                customer_phone: orderData.customer_phone,
                customer_email: orderData.customer_email || null,
                receiver_name: orderData.customer_name, // Assume same as customer for now
                receiver_phone: orderData.customer_phone,
                delivery_address: orderData.delivery_address,
                province: orderData.province,
                district: orderData.district,
                ward: orderData.ward,
                note: orderData.note || null,
                subtotal_amount: subtotalAmount,
                shipping_fee: 0,
                discount_amount: 0,
                total_amount: totalAmount,
                payment_method: orderData.payment_method || 'COD',
                payment_status: 'pending',
                order_status: 'pending',
                items: {
                    create: orderItemsParams
                },
                status_logs: {
                    create: {
                        new_status: 'pending',
                        note: 'Khách hàng đặt đơn',
                        changed_by: 'system'
                    }
                }
            }
        });

        // 4. Update Inventory and Customer logic
        for (const item of orderItemsParams) {
            const product = products.find(p => p.id === item.product_id);
            
            // Deduct stock
            await tx.product.update({
                where: { id: item.product_id },
                data: { stock_quantity: product.stock_quantity - item.quantity }
            });

            // Create Inventory Log
            await tx.inventoryLog.create({
                data: {
                    product_id: item.product_id,
                    type: 'order_sub',
                    quantity: item.quantity,
                    before_quantity: product.stock_quantity,
                    after_quantity: product.stock_quantity - item.quantity,
                    reference_type: 'order',
                    reference_id: order.id,
                    note: `Trừ tồn kho khi đặt đơn ${orderCode}`,
                    created_by: 'system'
                }
            });
        }

        // Update customer total orders
        await tx.customer.update({
            where: { id: customerId },
            data: { 
                total_orders: { increment: 1 },
                total_spent: { increment: totalAmount }
            }
        });

        return order;
    });
};

module.exports = {
    processOrder,
    generateOrderCode
};
