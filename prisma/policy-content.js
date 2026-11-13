/**
 * Nội dung chính sách mặc định (HTML) cho Hải Anh Fruit.
 * Dùng cho: prisma/seed.js (cài mới) và scripts/apply-policy-content.js (cập nhật DB đang có).
 * Chủ web có thể sửa trực tiếp ở Admin → Cài đặt → Trang tĩnh. Các con số thời hạn/phí là mặc định hợp lý,
 * chủ web nên rà soát cho đúng thực tế vận hành trước khi công bố chính thức.
 */
const CONTACT = {
    brand: 'Hải Anh Fruit',
    hotline: '0865 223 169',
    hours: '8:00 – 21:00 mỗi ngày',
    email: 'cskhhaianhfruit@gmail.com',
    address: 'N05 Ecohome 3, Đông Ngạc, Bắc Từ Liêm, Hà Nội, Việt Nam',
    website: 'https://haianhfruit.com'
};

const privacy = `
<h3>1. Cam kết bảo mật thông tin khách hàng</h3>
<p>Thông tin của quý khách khi mua hàng tại ${CONTACT.brand} được bảo mật nghiêm túc. Chúng tôi cam kết <strong>không bán, không trao đổi, không chuyển giao</strong> thông tin cá nhân của quý khách cho bất kỳ bên thứ ba nào vì mục đích thương mại. Thông tin chỉ được dùng để phục vụ việc mua hàng, giao hàng và chăm sóc khách hàng một cách hiệu quả.</p>

<h3>2. Mục đích thu thập và sử dụng thông tin cá nhân</h3>
<p>Khi quý khách đặt hàng, đăng ký tài khoản, gửi yêu cầu liên hệ hoặc đánh giá sản phẩm, chúng tôi có thể thu thập các thông tin sau:</p>
<ul>
    <li><strong>Họ tên và số điện thoại</strong>: để xác nhận đơn, liên hệ khi giao hàng và thông báo tình trạng đơn hàng.</li>
    <li><strong>Địa chỉ giao nhận</strong>: để giao hàng đúng địa điểm.</li>
    <li><strong>Email</strong> (nếu quý khách cung cấp): để gửi xác nhận đơn hàng, thông tin hỗ trợ và thông báo liên quan đến tài khoản.</li>
    <li><strong>Thông tin đơn hàng</strong>: sản phẩm đã mua, ghi chú giao hàng, phương thức thanh toán (thanh toán khi nhận hàng hoặc chuyển khoản). Chúng tôi <strong>không lưu số thẻ ngân hàng</strong> của quý khách.</li>
    <li><strong>Thông tin tài khoản</strong> (nếu quý khách đăng ký): email đăng nhập, lịch sử đơn hàng, danh sách yêu thích, điểm thưởng tích lũy. Mật khẩu được mã hóa một chiều, nhân viên không thể xem được mật khẩu của quý khách.</li>
    <li><strong>Nội dung quý khách chủ động gửi</strong>: yêu cầu tư vấn, đánh giá sản phẩm. Lưu ý: tên hiển thị và nội dung đánh giá có thể được công khai trên trang sản phẩm sau khi được duyệt.</li>
</ul>
<p>Thông tin cá nhân được sử dụng đúng mục đích nêu trên và theo quy định của pháp luật. Chúng tôi chỉ gửi thông tin khuyến mãi khi quý khách đồng ý, và quý khách có thể từ chối nhận bất cứ lúc nào.</p>

<h3>3. Cookie và dữ liệu phiên làm việc</h3>
<p>Website sử dụng cookie phiên để duy trì giỏ hàng, trạng thái đăng nhập và đảm bảo an toàn cho các thao tác của quý khách. Quý khách có thể xóa hoặc chặn cookie trong cài đặt trình duyệt, tuy nhiên một số chức năng (giỏ hàng, đăng nhập) có thể không hoạt động đầy đủ.</p>

<h3>4. Thời gian lưu trữ thông tin</h3>
<p>Thông tin đơn hàng được lưu trong thời gian cần thiết để chăm sóc khách hàng, giải quyết khiếu nại, đổi trả và tuân thủ nghĩa vụ kế toán, thuế theo quy định pháp luật. Thông tin tài khoản được giữ cho đến khi quý khách yêu cầu xóa. Khi hết thời hạn cần thiết, dữ liệu sẽ được xóa hoặc ẩn danh khỏi hệ thống, chỉ giữ lại những thông tin bắt buộc theo quy định.</p>

<h3>5. Những người hoặc tổ chức có thể tiếp cận thông tin</h3>
<p>Thông tin cá nhân của quý khách chỉ được chia sẻ với:</p>
<ul>
    <li>Nhân viên nội bộ của ${CONTACT.brand} được phân công xử lý đơn hàng và chăm sóc khách hàng (kể cả qua thông báo nội bộ bằng email hoặc tin nhắn khi có đơn mới).</li>
    <li>Đối tác vận chuyển, chỉ gồm các thông tin cần thiết để giao hàng (tên, số điện thoại, địa chỉ).</li>
    <li>Cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp bằng văn bản.</li>
</ul>

<h3>6. Quyền của khách hàng</h3>
<p>Quý khách có quyền yêu cầu xem, chỉnh sửa, cập nhật hoặc xóa thông tin cá nhân của mình, rút lại sự đồng ý nhận thông tin khuyến mãi và gửi khiếu nại về việc xử lý thông tin. Quý khách có thể tự chỉnh sửa thông tin trong trang <strong>Hồ sơ</strong> khi đã đăng nhập, hoặc liên hệ trực tiếp với chúng tôi theo thông tin ở mục 8. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.</p>

<h3>7. Cách chúng tôi bảo vệ thông tin</h3>
<ul>
    <li>Mật khẩu được mã hóa, dữ liệu đăng nhập và đặt hàng truyền qua kết nối HTTPS.</li>
    <li>Quyền truy cập khu vực quản trị được giới hạn cho nhân viên được ủy quyền.</li>
    <li>Dữ liệu được sao lưu định kỳ để tránh mất mát.</li>
</ul>
<p>Mặc dù đã áp dụng các biện pháp trên, không có hệ thống nào an toàn tuyệt đối. Nếu phát hiện dấu hiệu lộ lọt thông tin, chúng tôi sẽ có biện pháp khắc phục và thông báo kịp thời cho quý khách bị ảnh hưởng.</p>

<h3>8. Liên hệ</h3>
<p>Mọi thắc mắc, khiếu nại về chính sách bảo mật, quý khách vui lòng liên hệ:</p>
<ul>
    <li><strong>Hotline</strong>: <a href="tel:0865223169">${CONTACT.hotline}</a> (${CONTACT.hours})</li>
    <li><strong>Email</strong>: <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></li>
    <li><strong>Địa chỉ</strong>: ${CONTACT.address}</li>
    <li><strong>Website</strong>: <a href="${CONTACT.website}">${CONTACT.website}</a></li>
</ul>

<h3>9. Thay đổi chính sách</h3>
<p>${CONTACT.brand} có thể cập nhật chính sách này khi cần thiết. Phiên bản mới nhất luôn được đăng trên trang này. Việc quý khách tiếp tục sử dụng website sau khi chính sách được cập nhật đồng nghĩa với việc quý khách đồng ý với nội dung mới.</p>
<blockquote>Cập nhật lần cuối: tháng 11/2026. Xin trân trọng cảm ơn quý khách đã đồng hành cùng ${CONTACT.brand}!</blockquote>
`.trim();

const returns = `
<blockquote><strong>Tóm tắt:</strong> ${CONTACT.brand} hỗ trợ <strong>đổi hoặc hoàn tiền trong vòng 24 giờ</strong> kể từ khi quý khách nhận hàng nếu trái cây có vấn đề về chất lượng. Vui lòng <strong>kiểm tra hàng ngay khi nhận</strong> và liên hệ với chúng tôi kèm hình ảnh/video sản phẩm.</blockquote>

<h3>1. Trường hợp được đổi trả</h3>
<p>Trái cây tươi là sản phẩm có thời gian bảo quản ngắn, vì vậy chúng tôi hỗ trợ đổi trả khi sản phẩm gặp một trong các vấn đề sau <strong>tại thời điểm giao hàng</strong>:</p>
<ul>
    <li>Trái cây bị dập nát, hư hỏng, thối, mốc, ủng hoặc có dấu hiệu không đạt chất lượng.</li>
    <li>Giao <strong>sai sản phẩm</strong>, sai quy cách hoặc sai xuất xứ so với đơn đặt hàng.</li>
    <li>Giao <strong>thiếu</strong> số lượng hoặc thiếu trọng lượng so với đơn hàng.</li>
    <li>Sản phẩm bị hư hại do quá trình vận chuyển (móp méo hộp, vỡ giỏ quà, rách bao bì làm ảnh hưởng đến sản phẩm bên trong).</li>
</ul>

<h3>2. Thời gian thông báo đổi trả</h3>
<p>Để bảo đảm quyền lợi, quý khách vui lòng <strong>kiểm tra sản phẩm ngay khi nhận hàng</strong>, tốt nhất là có sự chứng kiến của nhân viên giao hàng.</p>
<p>Nếu phát hiện vấn đề, quý khách liên hệ với ${CONTACT.brand} <strong>trong vòng 24 giờ kể từ khi nhận hàng</strong>, kèm <strong>hình ảnh hoặc video</strong> rõ ràng của sản phẩm và bao bì, cùng mã đơn hàng để chúng tôi kiểm tra và hỗ trợ xử lý nhanh nhất.</p>
<p>Sau thời gian trên, chúng tôi có thể không đủ cơ sở để xác định tình trạng sản phẩm tại thời điểm giao hàng và sẽ không áp dụng đổi trả.</p>

<h3>3. Quy trình xử lý</h3>
<ul>
    <li><strong>Bước 1:</strong> Quý khách liên hệ hotline <a href="tel:0865223169">${CONTACT.hotline}</a> hoặc email <a href="mailto:${CONTACT.email}">${CONTACT.email}</a>, cung cấp mã đơn hàng, mô tả vấn đề và hình ảnh/video.</li>
    <li><strong>Bước 2:</strong> ${CONTACT.brand} xác nhận thông tin và đề xuất phương án xử lý.</li>
    <li><strong>Bước 3:</strong> Chúng tôi <strong>giao lại sản phẩm thay thế</strong> hoặc <strong>hoàn tiền</strong> phần sản phẩm lỗi (theo hình thức thanh toán ban đầu hoặc chuyển khoản) theo lựa chọn của quý khách, tùy theo tình trạng tồn kho.</li>
</ul>
<p>Trong trường hợp lỗi thuộc về ${CONTACT.brand} (hàng lỗi, giao sai, giao thiếu), chúng tôi <strong>chịu chi phí vận chuyển phát sinh</strong> của việc đổi trả.</p>

<h3>4. Các trường hợp không áp dụng đổi trả</h3>
<p>${CONTACT.brand} không nhận đổi trả đối với các trường hợp sau:</p>
<ul>
    <li>Quý khách thông báo sau thời hạn 24 giờ kể từ khi nhận hàng, hoặc <strong>không có hình ảnh/video</strong> để đối chiếu.</li>
    <li>Sản phẩm đã được <strong>sử dụng, cắt, gọt, chế biến</strong> hoặc đã ăn phần lớn; sản phẩm đã tháo rời, thay đổi kết cấu hoặc không còn nguyên trạng như khi nhận.</li>
    <li>Hư hỏng do quý khách <strong>bảo quản không đúng cách</strong> (để ở nhiệt độ cao, ánh nắng trực tiếp, để lâu sau khi nhận), hoặc do tác động vật lý sau khi nhận hàng.</li>
    <li>Khác biệt nhỏ do đặc tính tự nhiên của trái cây (kích cỡ, hình dáng, màu sắc từng quả, độ chín theo mùa vụ) mà <strong>không ảnh hưởng đến chất lượng</strong> và an toàn thực phẩm.</li>
    <li>Quý khách đổi ý, không còn nhu cầu hoặc không hợp khẩu vị cá nhân.</li>
    <li>Giỏ quà, hộp quà <strong>thiết kế theo yêu cầu riêng</strong> của khách và đã được xác nhận trước khi thực hiện (chỉ hỗ trợ xử lý nếu có lỗi về chất lượng trái cây). Phần phụ kiện trang trí (giỏ, hộp, giấy gói, nơ...) không hoàn lại giá trị.</li>
    <li>Đơn hàng giao thành công nhưng không liên lạc được với người nhận hoặc người nhận từ chối nhận hàng không có lý do chất lượng.</li>
</ul>

<h3>5. Trường hợp quý khách từ chối nhận hàng</h3>
<p>Nếu kiểm tra hàng khi giao thấy sản phẩm không đạt chất lượng, quý khách có thể <strong>từ chối nhận ngay với nhân viên giao hàng</strong> và gọi cho chúng tôi để được giao lại. Với đơn đã thanh toán trước, ${CONTACT.brand} sẽ hoàn tiền hoặc giao lại theo lựa chọn của quý khách.</p>

<h3>6. Cam kết của ${CONTACT.brand}</h3>
<p>Chúng tôi luôn kiểm tra và tuyển chọn trái cây kỹ lưỡng trước khi giao đến khách hàng. Trong trường hợp sản phẩm thuộc phạm vi được hỗ trợ, chúng tôi sẽ kiểm tra thực tế và đưa ra phương án xử lý phù hợp, nhanh chóng và minh bạch.</p>
<p><strong>Quý khách vui lòng kiểm tra hàng ngay khi nhận để đảm bảo quyền lợi của mình.</strong></p>

<h3>7. Liên hệ</h3>
<p>Mọi yêu cầu đổi trả, quý khách vui lòng liên hệ:</p>
<ul>
    <li><strong>Hotline</strong>: <a href="tel:0865223169">${CONTACT.hotline}</a> (${CONTACT.hours})</li>
    <li><strong>Email</strong>: <a href="mailto:${CONTACT.email}">${CONTACT.email}</a></li>
    <li><strong>Địa chỉ</strong>: ${CONTACT.address}</li>
</ul>
<blockquote>Cập nhật lần cuối: tháng 11/2026.</blockquote>
`.trim();

module.exports = { CONTACT, privacy_policy: privacy, return_policy: returns };
