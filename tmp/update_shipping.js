const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const shippingHtml = `<div class="mb-5">
    <img src="/images/shipping_banner.jpg" alt="Chính sách giao hàng Hải Anh Fruit" class="img-fluid rounded-4 shadow-sm w-100">
</div>
<h3>Chính sách giao hàng</h3>
<p>Hải Anh Fruit luôn mong muốn mang đến cho khách hàng trải nghiệm mua sắm tiện lợi, nhanh chóng và chu đáo. Vì vậy, chúng tôi áp dụng chính sách giao hàng linh hoạt, minh bạch như sau:</p>

<h4>1. Khu vực áp dụng</h4>
<p>Hải Anh Fruit hỗ trợ giao hàng tận nơi tại <strong>nội thành Hà Nội</strong>.</p>
<p>Đối với một số khu vực ngoại thành, chúng tôi vẫn có thể hỗ trợ giao hàng với thời gian linh động và sẽ thông báo trước để khách hàng thuận tiện sắp xếp.</p>

<h4>2. Thời gian giao hàng</h4>
<p>Chúng tôi hỗ trợ <strong>giao trong ngày</strong> đối với các đơn hàng được đặt trước từ 1–3 giờ, tùy theo khu vực giao hàng và khung giờ cao điểm.</p>
<p>Khách hàng cũng có thể lựa chọn thời gian giao mong muốn. Hải Anh Fruit sẽ cố gắng giao đúng hẹn hoặc chủ động liên hệ trước nếu có thay đổi.</p>

<h4>3. Phí giao hàng</h4>
<ul>
    <li><strong>Miễn phí giao hàng</strong> trong phạm vi 3km tính từ cửa hàng đối với đơn hàng từ <strong>1.000.000đ</strong>.</li>
    <li>Với các đơn hàng ngoài phạm vi 3km, phí giao hàng sẽ được tính từ <strong>15.000đ – 50.000đ</strong>, tùy theo khoảng cách thực tế.</li>
    <li>Đối với các địa điểm đặc biệt như bệnh viện, văn phòng, lễ cưới, sự kiện..., chúng tôi hỗ trợ giao tận nơi theo yêu cầu cụ thể của khách hàng.</li>
</ul>

<h4>4. Chính sách kiểm tra và nhận hàng</h4>
<p>Khách hàng được kiểm tra sản phẩm/giỏ quà trước khi nhận.</p>
<p>Trong trường hợp sản phẩm bị hư hỏng, méo mó hoặc không đúng theo yêu cầu đã xác nhận, Hải Anh Fruit sẵn sàng hỗ trợ đổi trả nhanh chóng để đảm bảo quyền lợi của khách hàng.</p>

<h4>5. Liên hệ giao hàng</h4>
<ul>
    <li><strong>Hotline đặt hàng nhanh:</strong> 0364672920</li>
    <li><strong>Website:</strong> <a href=\"https://haianhfruit.vn\">haianhfruit.vn</a></li>
</ul>

<blockquote class=\"my-4\">
    Mỗi đơn hàng không chỉ là một sản phẩm, mà còn là sự quan tâm và thành ý được gửi trao.
    Hãy để Hải Anh Fruit thay bạn gửi gắm sự trân trọng đến người thân, bạn bè và đối tác — đúng lúc, đúng cách và đầy tinh tế.
</blockquote>`;

async function main() {
    try {
        await db.setting.upsert({
            where: { key: 'shipping_policy' },
            update: { value: shippingHtml },
            create: {
                group_key: 'static_page',
                key: 'shipping_policy',
                value: shippingHtml,
                description: 'Chính sách vận chuyển'
            }
        });
        console.log('Shipping policy updated successfully');
    } catch (e) {
        console.error('Update failed:', e);
    } finally {
        await db.$disconnect();
    }
}

main();
