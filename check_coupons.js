const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const coupons = await prisma.coupon.findMany();
    console.log('=== COUPONS ===');
    console.log(JSON.stringify(coupons, null, 2));
    
    const campaigns = await prisma.promotionCampaign.findMany();
    console.log('\n=== PROMOTION CAMPAIGNS ===');
    console.log(JSON.stringify(campaigns, null, 2));
}

main()
    .catch(function(e) { console.error('ERROR:', e.message); })
    .finally(function() { prisma.$disconnect(); });
