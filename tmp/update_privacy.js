const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const privacyHtml = `<h3>Chính sách bảo mật thông tin</h3>
<p>Hải Anh Fruit cam kết bảo vệ thông tin cá nhân của khách hàng. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi sử dụng website <a href="https://haianhfruit.vn">haianhfruit.vn</a>.</p>

<h4>1. Thông tin chúng tôi thu thập</h4>
<p>Khi bạn đặt hàng hoặc đăng ký tài khoản, chúng tôi có thể thu thập các thông tin sau:</p>
<ul>
    <li>Họ và tên, số điện thoại, địa chỉ email.</li>
    <li>Địa chỉ giao hàng.</li>
    <li>Lịch sử đơn hàng và các sản phẩm đã xem.</li>
</ul>

<h4>2. Mục đích sử dụng thông tin</h4>
<p>Thông tin của bạn được sử dụng để:</p>
<ul>
    <li>Xử lý và xác nhận đơn hàng.</li>
    <li>Liên hệ khi cần hỗ trợ hoặc xác nhận giao hàng.</li>
    <li>Gửi thông báo khuyến mãi (nếu bạn đồng ý nhận).</li>
    <li>Cải thiện chất lượng dịch vụ và trải nghiệm mua sắm.</li>
</ul>

<h4>3. Cam kết bảo mật</h4>
<ul>
    <li>Hải Anh Fruit <strong>không chia sẻ, bán hoặc cho thuê</strong> thông tin cá nhân của bạn cho bên thứ ba.</li>
    <li>Dữ liệu được lưu trữ trên hệ thống bảo mật, có mã hóa và kiểm soát truy cập chặt chẽ.</li>
    <li>Mật khẩu tài khoản được mã hóa và không thể đọc được ngay cả bởi quản trị viên.</li>
</ul>

<h4>4. Cookie và dữ liệu phiên</h4>
<p>Website sử dụng cookie để duy trì phiên đăng nhập và ghi nhớ giỏ hàng của bạn. Bạn có thể tắt cookie trong trình duyệt, tuy nhiên một số tính năng có thể bị ảnh hưởng.</p>

<h4>5. Quyền của khách hàng</h4>
<p>Bạn có quyền:</p>
<ul>
    <li>Yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân của mình.</li>
    <li>Từ chối nhận email marketing bất kỳ lúc nào.</li>
    <li>Liên hệ với chúng tôi nếu có thắc mắc về việc xử lý dữ liệu.</li>
</ul>

<h4>6. Liên hệ</h4>
<p>Mọi yêu cầu liên quan đến chính sách bảo mật, vui lòng liên hệ:</p>
<ul>
    <li><strong>Hotline:</strong> <a href="tel:0865223169">0865 223 169</a></li>
    <li><strong>Email:</strong> <a href="mailto:cskhhaianhfruit@gmail.com">cskhhaianhfruit@gmail.com</a></li>
    <li><strong>Địa chỉ:</strong> N05 Ecohome 3, Đông Ngạc, Bắc Từ Liêm, Hà Nội</li>
    <li><strong>Website:</strong> <a href="https://haianhfruit.vn">haianhfruit.vn</a></li>
</ul>

<blockquote class="my-4">
    Hải Anh Fruit luôn đặt sự tin tưởng và quyền lợi của khách hàng lên hàng đầu. Mọi thông tin bạn cung cấp sẽ được xử lý một cách có trách nhiệm và minh bạch.
</blockquote>`;

async function main() {
    try {
        await db.setting.upsert({
            where: { key: 'privacy_policy' },
            update: { value: privacyHtml },
            create: {
                group_key: 'static_page',
                key: 'privacy_policy',
                value: privacyHtml,
                description: 'Chính sách bảo mật'
            }
        });
        console.log('Privacy policy updated successfully');
    } catch (e) {
        console.error('Update failed:', e);
    } finally {
        await db.$disconnect();
    }
}

main();
