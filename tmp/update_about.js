const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const aboutHtml = `<div class="mb-5">
    <img src="/images/about_banner.jpg" alt="Hải Anh Fruit Banner" class="img-fluid rounded-4 shadow-sm w-100">
</div>
<h3>Chào mừng bạn đến với Hải Anh Fruit</h3>
<p>Hải Anh Fruit là thương hiệu chuyên cung cấp trái cây nhập khẩu chất lượng và các dòng quà tặng trái cây sang trọng, đẳng cấp tại Hà Nội.</p>
<p>Chúng tôi mang đến cho khách hàng những sản phẩm được tuyển chọn kỹ lưỡng, hình thức chỉn chu và phù hợp với nhiều nhu cầu khác nhau, từ sử dụng hằng ngày để chăm sóc sức khỏe gia đình đến biếu tặng trong các dịp quan trọng như lễ tết, khai trương, sinh nhật.</p>
<blockquote class="my-4">Với tiêu chí <strong>tươi ngon – đẹp mắt – uy tín</strong>, Hải Anh Fruit không ngừng nâng cao chất lượng sản phẩm và dịch vụ, nhằm mang lại trải nghiệm mua sắm hiện đại, tiện lợi và đáng tin cậy cho mỗi khách hàng.</blockquote>
<div class="row g-4 mt-4">
    <div class="col-md-12">
        <h4 class="mb-3">Dịch vụ tại Hải Anh Fruit</h4>
        <ul class="list-group list-group-flush">
            <li class="list-group-item bg-transparent border-0 ps-0"><i class="fas fa-check-circle text-accent me-2"></i> Cung cấp trái cây nhập khẩu chất lượng</li>
            <li class="list-group-item bg-transparent border-0 ps-0"><i class="fas fa-check-circle text-accent me-2"></i> Thiết kế giỏ quà, hộp quà trái cây sang trọng</li>
            <li class="list-group-item bg-transparent border-0 ps-0"><i class=\"fas fa-check-circle text-accent me-2\"></i> Tư vấn lựa chọn quà tặng theo nhu cầu</li>
            <li class="list-group-item bg-transparent border-0 ps-0"><i class=\"fas fa-check-circle text-accent me-2\"></i> Nhận thiết kế và đóng gói theo yêu cầu cá nhân/doanh nghiệp</li>
            <li class="list-group-item bg-transparent border-0 ps-0"><i class=\"fas fa-check-circle text-accent me-2\"></i> Hỗ trợ quà tặng doanh nghiệp chuyên nghiệp</li>
            <li class="list-group-item bg-transparent border-0 ps-0"><i class=\"fas fa-check-circle text-accent me-2\"></i> Giao hàng nhanh tận nơi, đảm bảo độ tươi ngon</li>
            <li class="list-group-item bg-transparent border-0 ps-0"><i class=\"fas fa-check-circle text-accent me-2\"></i> Cam kết chất lượng và hỗ trợ đổi trả rõ ràng</li>
        </ul>
    </div>
</div>`;

async function main() {
    try {
        await db.setting.update({
            where: { key: 'about_us' },
            data: { value: aboutHtml }
        });
        console.log('Update successful');
    } catch (e) {
        console.error('Update failed:', e);
    } finally {
        await db.$disconnect();
    }
}

main();
