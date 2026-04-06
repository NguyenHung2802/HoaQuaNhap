const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const settings = [
        { group_key: 'bank', key: 'bank_id', value: 'vcb', description: 'ID Ngân hàng (vietqr)' },
        { group_key: 'bank', key: 'bank_account_no', value: '0123456789', description: 'Số tài khoản nhận tiền' },
        { group_key: 'bank', key: 'bank_account_name', value: 'WEBHOAQUA', description: 'Tên chủ tài khoản' }
    ];

    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: s
        });
    }
    console.log('Bank settings seeded successfully');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
