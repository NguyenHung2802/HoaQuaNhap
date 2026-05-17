const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
    const records = await db.setting.findMany({
        where: { group_key: 'static_page' },
        select: { key: true, description: true }
    });
    console.log('Static page records in DB:');
    console.log(JSON.stringify(records, null, 2));
    await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
