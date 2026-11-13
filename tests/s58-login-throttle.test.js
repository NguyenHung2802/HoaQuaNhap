// Kiểm thử S58: chặn dò mật khẩu đăng nhập (src/middlewares/login-throttle.middleware.js).
// Không cần DB/HTTP thật — gọi trực tiếp middleware với req/res giả.
// Chạy: node tests/s58-login-throttle.test.js
const assert = require('assert');
const path = require('path');
const { loginThrottle, recordFailedAttempt, clearAttempts } = require(
    path.join(__dirname, '..', 'src', 'middlewares', 'login-throttle.middleware')
);

const fakeReqRes = (ip, email) => {
    const res = { locals: {}, redirected: null, redirect(url) { this.redirected = url; } };
    const req = {
        ip, body: { email }, res,
        flashed: [],
        flash(type, msg) { this.flashed.push([type, msg]); }
    };
    res.req = req;
    return { req, res };
};

const callThrottle = (ip, email) => {
    const { req, res } = fakeReqRes(ip, email);
    let nextCalled = false;
    loginThrottle(req, res, () => { nextCalled = true; });
    return { req, res, nextCalled };
};

let pass = 0, failN = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('ok  ', name); } catch (e) { failN++; console.log('FAIL', name, '\n    ', e.message); } };

t('dưới ngưỡng: cho qua (next được gọi), không có flash lỗi', () => {
    const { nextCalled, req } = callThrottle('1.1.1.1', 'a@test.com');
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.flashed.length, 0);
});

t('thử sai 5 lần cùng một email -> lần thứ 6 bị chặn, dù đổi IP', () => {
    const email = 'bruteforce@test.com';
    for (let i = 0; i < 5; i++) {
        const { req, res, nextCalled } = callThrottle('2.2.2.' + i, email); // mỗi lần một IP khác nhau
        assert.strictEqual(nextCalled, true, `lần ${i + 1} phải cho qua`);
        recordFailedAttempt(req, res); // giả lập sai mật khẩu
    }
    const sixth = callThrottle('9.9.9.9', email); // IP hoàn toàn mới, vẫn cùng email
    assert.strictEqual(sixth.nextCalled, false, 'lần 6 phải bị chặn vì cùng email');
    assert(sixth.req.flashed.some(([, m]) => m.includes('quá nhiều lần')), 'phải có thông báo chặn tạm thời');
});

t('thử nhiều email khác nhau từ cùng một IP vẫn bị chặn sau 20 lần (chặn quét hàng loạt)', () => {
    const ip = '5.5.5.5';
    for (let i = 0; i < 20; i++) {
        const { req, res, nextCalled } = callThrottle(ip, 'victim' + i + '@test.com');
        assert.strictEqual(nextCalled, true, `lần ${i + 1} phải cho qua`);
        recordFailedAttempt(req, res);
    }
    const next = callThrottle(ip, 'victim-moi@test.com'); // email mới toanh, nhưng vẫn IP đó
    assert.strictEqual(next.nextCalled, false, 'phải bị chặn vì IP đã vượt ngưỡng');
});

t('đăng nhập đúng (clearAttempts) xóa lịch sử sai của email đó — không bị khóa oan', () => {
    const email = 'ok-user@test.com';
    for (let i = 0; i < 4; i++) { // thử sai 4 lần (chưa chạm ngưỡng 5)
        const { req, res } = callThrottle('3.3.3.' + i, email);
        recordFailedAttempt(req, res);
    }
    const { req, res } = callThrottle('3.3.3.9', email);
    clearAttempts(req, res); // đăng nhập đúng ở lần thử tiếp theo
    // Thử sai thêm 4 lần nữa: nếu bộ đếm đã được xóa thì vẫn chưa tới ngưỡng 5
    for (let i = 0; i < 4; i++) {
        const r = callThrottle('3.3.3.' + (i + 10), email);
        assert.strictEqual(r.nextCalled, true, `sau khi xóa lịch sử, lần ${i + 1} vẫn phải cho qua`);
        recordFailedAttempt(r.req, r.res);
    }
});

t('email trống (bỏ trống ô email) không làm vỡ middleware', () => {
    const { nextCalled } = callThrottle('7.7.7.7', '');
    assert.strictEqual(nextCalled, true);
});

console.log(`\nTổng ok: ${pass}, lỗi: ${failN}`);
process.exit(failN ? 1 : 0);
