const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('Prisma models found in client:');
console.log(Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));

prisma.$disconnect();
