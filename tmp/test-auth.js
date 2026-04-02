require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    console.log('Testing registration logic...');
    const full_name = 'Test User';
    const email = 'test' + Date.now() + '@example.com';
    const phone = '0' + Date.now().toString().slice(-9);
    const password = 'password123';

    try {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        console.log('Password hashed:', password_hash);

        const newUser = await prisma.$transaction(async (p) => {
            const user = await p.user.create({
                data: {
                    full_name,
                    email,
                    phone,
                    password_hash,
                    role: 'customer',
                    status: 'active'
                }
            });
            console.log('User created:', user.id);

            const customer = await p.customer.upsert({
                where: { phone },
                update: { user_id: user.id },
                create: { full_name, phone, email, user_id: user.id }
            });
            console.log('Customer upserted:', customer.id);
            return user;
        });

        console.log('Registration SUCCESS for:', email);
        
        // Test login
        const loginUser = await prisma.user.findUnique({ where: { email } });
        const isMatch = await bcrypt.compare(password, loginUser.password_hash);
        console.log('Login check:', isMatch ? 'MATCH' : 'FAIL');

    } catch (error) {
        console.error('Registration FAILED:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
