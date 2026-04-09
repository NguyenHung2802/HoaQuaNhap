require('dotenv').config();
const notify = require('../src/utils/order-notification');

const fakeOrder = {
  id: 999,
  order_code: 'TEST-001',
  customer_name: 'Nguyễn Test',
  customer_phone: '0364672920',
  customer_email: null,
  delivery_address: 'N05 Ecohome 3, Đông Ngạc, Hà Nội',
  note: 'Test thông báo',
  total_amount: 250000,
  discount_amount: 0,
  shipping_fee: 0,
  payment_method: 'COD',
  items: [{ product_name: 'Táo Fuji Nhật', quantity: 2, unit_price: 125000 }]
};

console.log('Testing Telegram...');
notify.sendOrderTelegramNotification(fakeOrder)
  .then(() => console.log('Telegram promise resolved.'))
  .catch(e => console.error('Telegram error:', e));

console.log('Testing Email...');
notify.sendOrderNotificationEmail(fakeOrder)
  .then(() => console.log('Email promise resolved.'))
  .catch(e => console.error('Email error:', e));

setTimeout(() => {
    console.log('Test timed out after 10s');
    process.exit(0);
}, 10000);
