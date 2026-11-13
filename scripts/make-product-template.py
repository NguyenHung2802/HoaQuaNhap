# Tạo file Excel mẫu để nhập sản phẩm hàng loạt: docs/templates/mau-nhap-san-pham.xlsx
# Chạy: python scripts/make-product-template.py
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation

OUT = os.path.join(os.path.dirname(__file__), '..', 'docs', 'templates', 'mau-nhap-san-pham.xlsx')
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# (cột, bắt buộc, kiểu, ví dụ, giải thích)
COLS = [
    ('ten_san_pham', 'BẮT BUỘC', 'Văn bản', 'Táo Envy New Zealand', 'Tên hiển thị. Tối đa ~120 ký tự.'),
    ('ma_sku', 'Nên có', 'Văn bản, duy nhất', 'APPLE-ENVY-NZ', 'Mã nội bộ, không trùng. Để trống: hệ thống tự sinh từ tên.'),
    ('slug', 'Không', 'Không dấu, gạch ngang', 'tao-envy-new-zealand', 'Đường dẫn. Để trống: tự sinh từ tên; trùng thì tự thêm -1, -2.'),
    ('danh_muc_chinh', 'BẮT BUỘC', 'Tên hoặc slug danh mục', 'Táo nhập khẩu', 'Phải khớp một danh mục có sẵn (xem sheet DanhMuc). Danh mục mới: điền sheet DanhMuc.'),
    ('danh_muc_phu', 'Không', 'Nhiều giá trị, ngăn bằng |', 'Quà biếu', 'Thêm sản phẩm vào danh mục khác. VD: Quà biếu|Hàng mới'),
    ('xuat_xu', 'Nên có', 'Văn bản', 'New Zealand', 'Nước/vùng xuất xứ, hiện ở thông số sản phẩm.'),
    ('don_vi_tinh', 'BẮT BUỘC', 'kg / hộp / thùng / túi / khay / quả', 'kg', 'Đơn vị bán; giá bên dưới là giá cho 1 đơn vị này.'),
    ('khoi_luong_kg', 'Không', 'Số (kg)', '1', 'Khối lượng mỗi đơn vị, tính bằng kg. VD hộp 500g điền 0.5.'),
    ('quy_cach_dong_goi', 'Không', 'Văn bản', 'Hộp', 'Hộp / thùng / túi / khay...'),
    ('gia_ban', 'BẮT BUỘC', 'Số nguyên VNĐ', '250000', 'Giá niêm yết. Chỉ số, không dấu chấm/phẩy, không chữ "đ".'),
    ('gia_khuyen_mai', 'Không', 'Số nguyên VNĐ', '229000', 'Phải nhỏ hơn gia_ban. Để trống nếu không giảm.'),
    ('gia_von', 'Không', 'Số nguyên VNĐ', '170000', 'Chỉ dùng báo cáo lợi nhuận, KHÔNG hiển thị cho khách.'),
    ('ton_kho', 'BẮT BUỘC', 'Số nguyên >= 0', '50', 'Số lượng đang có. Hệ thống ghi log nhập kho ban đầu.'),
    ('canh_bao_ton_kho', 'Không', 'Số nguyên', '5', 'Báo sắp hết hàng khi tồn <= số này. Mặc định 5.'),
    ('trang_thai', 'Không', 'published / draft / out_of_stock', 'published', 'published = hiển thị bán; draft = nháp (ẩn). Mặc định: draft để bạn duyệt trước khi bán.'),
    ('noi_bat', 'Không', 'x hoặc để trống', 'x', 'Đánh dấu "x" để hiện ở mục sản phẩm nổi bật trang chủ.'),
    ('ban_chay', 'Không', 'x hoặc để trống', '', 'Đánh dấu "x" để gắn nhãn bán chạy.'),
    ('flash_sale', 'Không', 'x hoặc để trống', '', 'Đánh dấu "x" nếu chạy flash sale (cần 2 cột dưới).'),
    ('gia_flash_sale', 'Có điều kiện', 'Số nguyên VNĐ', '', 'Bắt buộc nếu flash_sale = x; nhỏ hơn gia_ban.'),
    ('flash_sale_ket_thuc', 'Có điều kiện', 'Ngày giờ dd/mm/yyyy hh:mm', '', 'Bắt buộc nếu flash_sale = x. VD 30/11/2026 23:59'),
    ('mo_ta_ngan', 'Nên có', 'Văn bản 1–2 câu (<= 200 ký tự)', 'Táo giòn ngọt, vỏ đỏ rực, nhập trực tiếp từ New Zealand.', 'Hiện dưới tên sản phẩm, trong kết quả Google.'),
    ('mo_ta_chi_tiet', 'Nên có', 'Văn bản hoặc HTML đơn giản', 'Táo Envy có vị ngọt thanh, thịt giòn...', 'Tab "Mô tả". Xuống dòng bằng Alt+Enter; có thể dùng thẻ <p>, <ul><li>, <strong>.'),
    ('thong_tin_dinh_duong', 'Không', 'Văn bản (mỗi dòng 1 ý) hoặc HTML', 'Năng lượng: 52 kcal/100g\nChất xơ: 2.4g\nVitamin C: 4.6mg', 'Tab "Thông số". Mỗi dòng sẽ thành 1 đoạn.'),
    ('anh_chinh', 'BẮT BUỘC (để đẹp)', 'Tên file hoặc link ảnh', 'tao-envy-1.jpg', 'Ảnh đại diện. Tên file nằm trong thư mục ảnh bạn gửi kèm, hoặc link https. Khuyên dùng ảnh vuông >= 800x800, <= 1MB.'),
    ('anh_phu', 'Không', 'Nhiều giá trị, ngăn bằng |', 'tao-envy-2.jpg|tao-envy-3.jpg', 'Các ảnh gallery theo thứ tự hiển thị (tối đa 8).'),
    ('mo_ta_anh', 'Không', 'Văn bản', 'Táo Envy New Zealand đóng khay', 'Alt text cho SEO/người khiếm thị. Để trống: dùng tên sản phẩm.'),
]

EXAMPLE2 = ['Nho đen không hạt Mỹ', 'GRAPE-BLACK-US', '', 'Nho nhập khẩu', 'Quà biếu|Hàng mới', 'Mỹ', 'kg', '1', 'Hộp', '320000', '', '240000', '30', '5', 'draft', '', 'x', '', '', '', 'Nho đen căng mọng, ngọt đậm, không hạt.', 'Nho đen nhập khẩu từ California...', 'Năng lượng: 69 kcal/100g', 'nho-den-1.jpg', 'nho-den-2.jpg', '']

thin = Side(style='thin', color='D0D7D2')
border = Border(left=thin, right=thin, top=thin, bottom=thin)
GREEN = PatternFill('solid', fgColor='1B4D3E')
YELLOW = PatternFill('solid', fgColor='FFF3CD')
RED = PatternFill('solid', fgColor='FDE2E1')
GREY = PatternFill('solid', fgColor='F2F5F3')

wb = Workbook()

# --- Sheet 1: SanPham
ws = wb.active
ws.title = 'SanPham'
for i, (name, req, *_rest) in enumerate(COLS, start=1):
    c = ws.cell(row=1, column=i, value=name)
    c.font = Font(bold=True, color='FFFFFF')
    c.fill = GREEN
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    c.border = border
    ws.column_dimensions[c.column_letter].width = max(16, min(34, len(name) + 6))
    r = ws.cell(row=2, column=i, value='(' + req + ')')
    r.fill = RED if req.startswith('BẮT BUỘC') else (YELLOW if req in ('Nên có', 'Có điều kiện') else GREY)
    r.font = Font(italic=True, size=9)
    r.alignment = Alignment(horizontal='center', wrap_text=True)
    r.border = border
# dòng 3 = ví dụ 1, dòng 4 = ví dụ 2 (xoá trước khi nhập thật, hoặc ghi đè)
for i, col in enumerate(COLS, start=1):
    c = ws.cell(row=3, column=i, value=col[3])
    c.alignment = Alignment(vertical='top', wrap_text=True)
    c.border = border
for i, v in enumerate(EXAMPLE2, start=1):
    c = ws.cell(row=4, column=i, value=v)
    c.alignment = Alignment(vertical='top', wrap_text=True)
    c.border = border
ws.row_dimensions[1].height = 32
ws.freeze_panes = 'B3'
ws.column_dimensions['A'].width = 32
for letter in ('U', 'V', 'W'):
    ws.column_dimensions[letter].width = 44

idx = {c[0]: i + 1 for i, c in enumerate(COLS)}
def dv(col, formula, rows=500):
    d = DataValidation(type='list', formula1=formula, allow_blank=True)
    d.error = 'Chọn giá trị trong danh sách'
    ws.add_data_validation(d)
    L = ws.cell(row=1, column=idx[col]).column_letter
    d.add(f'{L}3:{L}{rows}')
dv('don_vi_tinh', '"kg,hộp,thùng,túi,khay,quả"')
dv('trang_thai', '"published,draft,out_of_stock"')
dv('noi_bat', '"x"'); dv('ban_chay', '"x"'); dv('flash_sale', '"x"')
dv('danh_muc_chinh', '=DanhMuc!$A$2:$A$100')

# --- Sheet 2: DanhMuc
wc = wb.create_sheet('DanhMuc')
for i, h in enumerate(['ten_danh_muc', 'slug', 'mo_ta', 'anh_danh_muc', 'thu_tu'], start=1):
    c = wc.cell(row=1, column=i, value=h); c.font = Font(bold=True, color='FFFFFF'); c.fill = GREEN; c.border = border
    wc.column_dimensions[c.column_letter].width = 30
for r, row in enumerate([
    ('Táo nhập khẩu', 'tao-nhap-khau', '', '', 1),
    ('Nho nhập khẩu', 'nho-nhap-khau', '', '', 2),
    ('Dâu tây Hàn Quốc', 'dau-tay', '', '', 3),
], start=2):
    for i, v in enumerate(row, start=1):
        wc.cell(row=r, column=i, value=v).border = border
wc.cell(row=7, column=1, value='Thêm danh mục mới ở các dòng dưới (đã có sẵn 3 danh mục đang chạy trên web).').font = Font(italic=True, size=9)

# --- Sheet 3: HuongDan (định nghĩa cột)
wh = wb.create_sheet('HuongDan')
for i, h in enumerate(['Cột', 'Mức độ', 'Kiểu dữ liệu', 'Ví dụ', 'Giải thích / quy tắc'], start=1):
    c = wh.cell(row=1, column=i, value=h); c.font = Font(bold=True, color='FFFFFF'); c.fill = GREEN; c.border = border
for r, col in enumerate(COLS, start=2):
    for i, v in enumerate(col, start=1):
        c = wh.cell(row=r, column=i, value=v); c.alignment = Alignment(vertical='top', wrap_text=True); c.border = border
    wh.cell(row=r, column=2).fill = RED if col[1].startswith('BẮT BUỘC') else (YELLOW if col[1] in ('Nên có', 'Có điều kiện') else GREY)
for letter, w in zip('ABCDE', (24, 16, 30, 34, 80)):
    wh.column_dimensions[letter].width = w
n = len(COLS) + 4
notes = [
    'QUY TẮC CHUNG',
    '1. Mỗi dòng = 1 sản phẩm. Dòng 3–4 của sheet SanPham là ví dụ, hãy xoá hoặc ghi đè.',
    '2. Giá: chỉ nhập số (250000). Không viết 250.000đ, 250k.',
    '3. Ảnh: đặt tất cả file ảnh vào MỘT thư mục, gửi kèm Excel. Tên file trong Excel phải khớp đúng (phân biệt chữ hoa/thường). Hoặc dùng link https.',
    '4. Ô nhiều giá trị (danh_muc_phu, anh_phu) ngăn bằng dấu | .',
    '5. Không có file ảnh/mô tả: để trống, sản phẩm vẫn tạo ở trạng thái draft để bổ sung sau.',
    '6. SKU và slug trùng với sản phẩm đã có: hệ thống KHÔNG ghi đè, mà báo trùng trong báo cáo (hoặc tự thêm -1) tuỳ chế độ bạn chọn.',
    '7. Dữ liệu sai (thiếu tên, giá không phải số, danh mục không tồn tại...) sẽ được liệt kê theo số dòng trong báo cáo, dòng đúng vẫn được nạp.',
]
for k, t in enumerate(notes):
    c = wh.cell(row=n + k, column=1, value=t)
    if k == 0: c.font = Font(bold=True)

wb.save(OUT)
print('OK docs/templates/mau-nhap-san-pham.xlsx')
