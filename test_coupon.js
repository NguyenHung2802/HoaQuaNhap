const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCouponApply() {
    const code = 'GIAM10K';
    const totalAmount = 200000; // test với đơn 200k

    console.log('=== Test Coupon Apply Logic ===');
    console.log('Code:', code);
    console.log('Total Amount:', totalAmount);
    console.log('');

    const coupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() }
    });

    if (!coupon) {
        console.log('FAIL: Coupon not found');
        return;
    }

    console.log('Coupon found:', JSON.stringify(coupon, null, 2));

    if (!coupon.is_active) {
        console.log('FAIL: Coupon is not active');
        return;
    }

    const now = new Date();
    if (coupon.start_at && new Date(coupon.start_at) > now) {
        console.log('FAIL: Coupon not started yet:', coupon.start_at);
        return;
    }
    if (coupon.end_at && new Date(coupon.end_at) < now) {
        console.log('FAIL: Coupon expired:', coupon.end_at);
        return;
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        console.log('FAIL: Coupon usage limit reached. used_count:', coupon.used_count, '/', coupon.usage_limit);
        return;
    }

    const minVal = coupon.min_order_value ? parseFloat(coupon.min_order_value) : 0;
    const currentTotal = parseFloat(totalAmount);

    if (minVal > 0 && currentTotal < minVal) {
        console.log('FAIL: Order too small. Need:', minVal, 'Got:', currentTotal);
        return;
    }

    let discountAmount = 0;
    if (coupon.type === 'percent') {
        discountAmount = (currentTotal * parseFloat(coupon.value)) / 100;
        if (coupon.max_discount_value && discountAmount > parseFloat(coupon.max_discount_value)) {
            discountAmount = parseFloat(coupon.max_discount_value);
        }
    } else {
        discountAmount = parseFloat(coupon.value);
    }

    if (discountAmount > currentTotal) discountAmount = currentTotal;

    console.log('');
    console.log('=== RESULT ===');
    console.log('SUCCESS!');
    console.log('Discount Amount:', discountAmount);
    console.log('Final Total:', currentTotal - discountAmount);
}

testCouponApply()
    .catch(function(e) { console.error('ERROR:', e.message, e.stack); })
    .finally(function() { prisma.$disconnect(); });
