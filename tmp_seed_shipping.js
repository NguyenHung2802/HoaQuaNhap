const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const campaigns = [
        { 
            name: 'Miễn phí vận chuyển đơn từ 500K', 
            type: 'percent', 
            value: 100, 
            min_order_value: 500000, 
            description: 'Tự động áp dụng cho đơn hàng trên 500.000đ' 
        },
        { 
            name: 'Hỗ trợ 20K vận chuyển cho đơn từ 200K', 
            type: 'amount', 
            value: 20000, 
            min_order_value: 200000, 
            description: 'Giảm ngay 20.000đ phí vận chuyển cho đơn trên 200.000đ' 
        }
    ];

    for (const c of campaigns) {
        await prisma.shippingCampaign.create({ data: c });
    }
    console.log('Shipping campaigns seeded successfully');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
