const db = require('../../config/db');

/**
 * Tạo đơn hàng nhanh cho khách vãng lai
 */
exports.createQuickOrder = async (orderData) => {
    const { full_name, phone, product_id, quantity } = orderData;

    return await db.$transaction(async (prisma) => {
        // 1. Tìm hoặc tạo Customer theo SĐT
        const customer = await prisma.customer.upsert({
            where: { phone },
            update: { full_name }, // Cập nhật tên nếu đã tồn tại
            create: { full_name, phone }
        });

        // 2. Lấy thông tin sản phẩm
        const product = await prisma.product.findUnique({
            where: { id: parseInt(product_id) }
        });

        if (!product || product.stock_quantity < quantity) {
            throw new Error('Sản phẩm không tồn tại hoặc hết hàng');
        }

        // 3. Tính toán tiền
        const price = product.sale_price ? product.sale_price : product.price;
        const subtotal = Number(price) * parseInt(quantity);
        const order_code = 'QK' + Date.now().toString().slice(-8);

        // 4. Tạo Order
        const order = await prisma.order.create({
            data: {
                order_code,
                customer_id: customer.id,
                customer_name: full_name,
                customer_phone: phone,
                receiver_name: full_name,
                receiver_phone: phone,
                delivery_address: 'Chờ xác nhận qua điện thoại', // Guest quick order thường confirm sau
                province: '-',
                district: '-',
                ward: '-',
                subtotal_amount: subtotal,
                total_amount: subtotal,
                order_status: 'pending',
                payment_status: 'pending',
                payment_method: 'COD',
                items: {
                    create: {
                        product_id: product.id,
                        product_name_snapshot: product.name,
                        sku_snapshot: product.sku,
                        price_snapshot: price,
                        quantity: parseInt(quantity),
                        line_total: subtotal
                    }
                }
            }
        });

        // 5. Trừ kho
        await prisma.product.update({
            where: { id: product.id },
            data: { stock_quantity: { decrement: parseInt(quantity) } }
        });

        return order;
    });
};
