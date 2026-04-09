const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const returnHtml = `<h3>Chính sách đổi trả hàng</h3>
<p>Hải Anh Fruit cam kết mang đến cho khách hàng những sản phẩm trái cây nhập khẩu chất lượng cao, tươi ngon và đúng với tiêu chuẩn an toàn thực phẩm. Để đảm bảo quyền lợi của khách hàng, chúng tôi áp dụng chính sách kiểm hàng rõ ràng trước khi nhận hàng.</p>

<h4>1. Kiểm hàng trước khi thanh toán</h4>
<ul>
    <li>Khách hàng có quyền kiểm tra sản phẩm trước khi thanh toán hoặc nhận hàng từ nhân viên giao hàng.</li>
    <li>Việc kiểm tra bao gồm: số lượng, chất lượng, độ tươi ngon, tình trạng sản phẩm và mẫu mã có đúng với đơn đặt hàng hay không.</li>
    <li>Nếu phát hiện lỗi hoặc sản phẩm không đúng yêu cầu, khách hàng có thể từ chối nhận hàng hoặc yêu cầu đổi sản phẩm khác.</li>
</ul>

<h4>2. Trường hợp từ chối nhận hàng</h4>
<p>Khách hàng có thể từ chối nhận hàng trong các trường hợp sau:</p>
<ul>
    <li>Sản phẩm bị hư hỏng, dập nát do quá trình vận chuyển.</li>
    <li>Sản phẩm không đúng với đơn đặt hàng (về chủng loại, số lượng, mẫu mã).</li>
    <li>Trái cây không đạt chất lượng như đã cam kết (héo úa, có dấu hiệu hư hỏng).</li>
</ul>
<blockquote class="my-4"><strong>Lưu ý:</strong> Trường hợp khách hàng đã kiểm tra và đồng ý nhận hàng, Hải Anh Fruit không chịu trách nhiệm với những khiếu nại phát sinh sau đó liên quan đến hình thức và số lượng sản phẩm.</blockquote>

<h4>3. Chính sách đổi trả hàng</h4>
<p>Nếu khách hàng nhận hàng nhưng phát hiện lỗi trong vòng <strong>2 giờ kể từ khi nhận hàng</strong>, vui lòng liên hệ ngay với Hải Anh Fruit để được hỗ trợ đổi sản phẩm mới (áp dụng cho các trường hợp lỗi do nhà cung cấp hoặc quá trình vận chuyển).</p>

<h4>4. Liên hệ hỗ trợ</h4>
<p>Nếu có bất kỳ thắc mắc nào về đơn hàng hoặc cần hỗ trợ kiểm tra, khách hàng có thể liên hệ:</p>
<ul>
    <li><strong>Hotline:</strong> <a href="tel:0364672920">0364 672 920</a></li>
    <li><strong>Email:</strong> <a href="mailto:cskhhaianhfruit.vn@gmail.com">cskhhaianhfruit.vn@gmail.com</a></li>
    <li><strong>Địa chỉ:</strong> N05 Ecohome 3, Đông Ngạc, Bắc Từ Liêm, Hà Nội</li>
    <li><strong>Website:</strong> <a href="https://haianhfruit.vn">haianhfruit.vn</a></li>
</ul>

<blockquote class="my-4">
    Hải Anh Fruit luôn đặt sự hài lòng của khách hàng lên hàng đầu. Mọi phản hồi và khiếu nại đều được chúng tôi tiếp nhận và giải quyết trong thời gian sớm nhất.
</blockquote>`;

async function main() {
    try {
        await db.setting.upsert({
            where: { key: 'return_policy' },
            update: { value: returnHtml },
            create: {
                group_key: 'static_page',
                key: 'return_policy',
                value: returnHtml,
                description: 'Chính sách đổi trả'
            }
        });
        console.log('Return policy updated successfully');
    } catch (e) {
        console.error('Update failed:', e);
    } finally {
        await db.$disconnect();
    }
}

main();
