# -*- coding: utf-8 -*-
"""
Dựng file Excel nhập sản phẩm + chép ảnh vào data/import/images/<slug>/ từ thư mục ảnh gốc.
Chạy: python scripts/build-product-import.py "<thư mục ảnh gốc>"
Kết quả: data/import/san-pham-hai-anh-fruit.xlsx và data/import/images/...
"""
import os, sys, json, shutil, unicodedata, re
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'import-data'))
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from fruits import FRUITS, CATEGORIES, sections, nut
from gifts import GIFTS, EXCLUDED, FRUIT_LABEL, NUT_LINE

SRC = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\nguye\OneDrive\Pictures\HaiAnhFruit'
INDEX = sys.argv[2] if len(sys.argv) > 2 else None   # index.json của các ảnh quà (nhóm#số -> đường dẫn tương đối)
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT_DIR = os.path.join(ROOT, 'data', 'import')
IMG_DIR = os.path.join(OUT_DIR, 'images')
XLSX = os.path.join(OUT_DIR, 'san-pham-hai-anh-fruit.xlsx')

def slugify(s):
    s = s.replace('đ', 'd').replace('Đ', 'D')
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return s

def list_images(folder):
    out = []
    for dp, dn, fn in os.walk(folder):
        for f in sorted(fn):
            if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                out.append(os.path.join(dp, f))
    return sorted(out)

def copy_images(slug, paths):
    d = os.path.join(IMG_DIR, slug)
    os.makedirs(d, exist_ok=True)
    rels = []
    for i, p in enumerate(paths, start=1):
        ext = os.path.splitext(p)[1].lower().replace('.jpeg', '.jpg')
        name = '%d%s' % (i, ext)
        shutil.copyfile(p, os.path.join(d, name))
        rels.append('images/%s/%s' % (slug, name))
    return rels

COLS = ['ten_san_pham', 'ma_sku', 'slug', 'danh_muc_chinh', 'danh_muc_phu', 'xuat_xu', 'don_vi_tinh', 'khoi_luong_kg', 'quy_cach_dong_goi',
        'gia_ban', 'gia_khuyen_mai', 'gia_von', 'ton_kho', 'canh_bao_ton_kho', 'trang_thai', 'noi_bat', 'ban_chay', 'flash_sale',
        'gia_flash_sale', 'flash_sale_ket_thuc', 'mo_ta_ngan', 'mo_ta_chi_tiet', 'thong_tin_dinh_duong', 'anh_chinh', 'anh_phu', 'mo_ta_anh']

rows, notes, used_slugs, used_skus = [], [], set(), set()

def uniq(v, used, sep='-'):
    base, n = v, 2
    while v in used:
        v = '%s%s%d' % (base, sep, n); n += 1
    used.add(v)
    return v

def add(name, sku, cat, origin, unit, weight, pack, price, short, desc, nutri, imgs, featured=False, alt=None):
    slug = uniq(slugify(name), used_slugs)
    sku = uniq(sku, used_skus)
    rels = copy_images(slug, imgs)
    rows.append({
        'ten_san_pham': name, 'ma_sku': sku, 'slug': slug, 'danh_muc_chinh': cat, 'danh_muc_phu': '', 'xuat_xu': origin, 'don_vi_tinh': unit,
        'khoi_luong_kg': weight if weight else '', 'quy_cach_dong_goi': pack, 'gia_ban': price, 'gia_khuyen_mai': '', 'gia_von': '',
        'ton_kho': 0, 'canh_bao_ton_kho': 5, 'trang_thai': 'draft', 'noi_bat': 'x' if featured else '', 'ban_chay': '', 'flash_sale': '',
        'gia_flash_sale': '', 'flash_sale_ket_thuc': '', 'mo_ta_ngan': short, 'mo_ta_chi_tiet': desc, 'thong_tin_dinh_duong': nutri,
        'anh_chinh': rels[0] if rels else '', 'anh_phu': '|'.join(rels[1:]), 'mo_ta_anh': alt or name,
    })
    return slug

# ---- Trái cây ----
for f in FRUITS:
    imgs = list_images(os.path.join(SRC, f['folder']))
    if not imgs:
        notes.append(('LỖI', f['name'], 'Không tìm thấy ảnh trong thư mục ' + f['folder']))
    add(f['name'], 'TC-' + f['key'].upper(), f['cat'], f['origin'], f['unit'], f['weight'], f['pack'], f['price'], f['short'], f['desc'], f['nutri'], imgs, f.get('featured', False))
    if not f['origin']:
        notes.append(('Cần điền', f['name'], 'Chưa biết xuất xứ từ ảnh; cột xuat_xu để trống.'))

# ---- Quà tặng ----
if INDEX:
    idx = json.load(open(INDEX, encoding='utf-8'))
else:  # đánh số ảnh trong từng thư mục quà theo thứ tự đường dẫn (giống lúc xem ảnh)
    idx = {}
    for grp in ('Khay set hoa quả', 'Quà tặng trái cây', 'Page'):
        for k, p in enumerate(list_images(os.path.join(SRC, grp)), start=1):
            idx['%s#%d' % (grp, k)] = os.path.relpath(p, SRC)
counters = {}
CODE = {'Khay & Hộp quà trái cây': 'KHAY', 'Giỏ quà trái cây': 'GIO', 'Tháp quà & Quà đi lễ': 'THAP'}
OCC = {'Khay & Hộp quà trái cây': 'sinh nhật, thăm hỏi, tân gia và biếu tặng đối tác',
       'Giỏ quà trái cây': 'sinh nhật, thăm hỏi, mừng khai trương, lễ Tết và biếu tặng đối tác',
       'Tháp quà & Quà đi lễ': 'lễ cúng, đám hiếu hỉ, mừng thọ và dâng lễ trang trọng'}
for g in GIFTS:
    grp, n, name, cat, items, feature, price = g[:7]
    extras = g[7] if len(g) > 7 else []
    key = '%s#%d' % (grp, n)
    if key not in idx:
        notes.append(('LỖI', name, 'Không có ảnh ' + key)); continue
    imgs = [os.path.join(SRC, idx[key])] + [os.path.join(SRC, idx['%s#%d' % e]) for e in extras]
    labels = [FRUIT_LABEL[i] for i in items]
    code = CODE[cat]; counters[code] = counters.get(code, 0) + 1
    kind = {'KHAY': 'Hộp / khay quà', 'GIO': 'Giỏ quà', 'THAP': 'Tháp quà'}[code]
    comp = ', '.join(labels)
    short = '%s gồm %s, bày biện tinh tế với %s. Trái cây tuyển chọn tươi ngon, sẵn sàng làm quà biếu.' % (kind, comp, feature)
    desc = ('<h3>Thành phần</h3><ul>%s</ul>' % ''.join('<li>%s</li>' % l.capitalize() for l in labels)
            + '<h3>Thiết kế</h3><p>%s.</p>' % feature.capitalize()
            + '<h3>Phù hợp cho dịp</h3><p>%s.</p>' % OCC[cat]
            + '<h3>Bảo quản và sử dụng</h3><p>Nên dùng trong 2–3 ngày; bảo quản nơi thoáng mát hoặc ngăn mát tủ lạnh (riêng nho và dưa lưới nên để ngăn mát). Rửa sạch trái cây trước khi ăn.</p>'
            + '<h3>Lưu ý</h3><ul><li>Ảnh mang tính tham khảo; thành phần có thể thay đổi nhẹ theo mùa vụ với trái cây có giá trị tương đương.</li>'
            + '<li>Có thể điều chỉnh loại trái cây, màu lưới/nơ và thiệp theo yêu cầu. Vui lòng đặt trước để shop chuẩn bị trái cây tươi.</li></ul>')
    nutri = '\n'.join(sorted({NUT_LINE[i] for i in items})) + '\n' + nut()
    nutri = nutri.replace('\n' + 'Giá trị tham khảo trung bình trên 100g phần ăn được, thay đổi theo giống, độ chín và mùa vụ.',
                          '\nGiá trị tham khảo trên 100g từng loại trái cây trong set, thay đổi theo giống, độ chín và mùa vụ.')
    add(name, '%s-%03d' % (code, counters[code]), cat, 'Nhập khẩu & Việt Nam' if False else '', 'giỏ' if code != 'KHAY' else 'set', 0, '', price, short, desc, nutri, imgs,
        featured=(code != 'KHAY' and counters[code] <= 2))
    if grp == 'Page':
        notes.append(('Kiểm tra', name, 'Ảnh Page trông như ảnh minh họa dựng sẵn (không phải ảnh chụp thực tế); khách có thể hiểu nhầm. Nên thay bằng ảnh thật khi có.'))

for grp, n, why in EXCLUDED:
    notes.append(('Đã bỏ ảnh', '%s #%d' % (grp, n), why))

notes += [
 ('Trùng dữ liệu', 'Táo Envy New Zealand', 'DB local đã có sản phẩm cùng slug/tên (id 1, sku APPLE-ENVY-NZ, 250000đ). Khi nạp sẽ bỏ qua hoặc cập nhật, không tạo trùng.'),
 ('Tên theo ảnh', 'Dưa Hấu Ruột Vàng / Dưa Hấu Ruột Đỏ', 'Thư mục gốc đặt tên “dưa vàng”, “dưa đường” nhưng ảnh thực tế là dưa hấu ruột vàng và dưa hấu ruột đỏ. Đã đặt tên theo ảnh.'),
 ('Tên theo ảnh', 'Lê Forelle Nam Phi', 'Thư mục “Lê Nam Phi” có ảnh lê nhỏ vỏ vàng ửng đỏ chấm, tem Delecta: nhận diện là giống Forelle.'),
 ('Cần xác nhận', 'Xoài Hạt Lép', 'Chưa tìm được tài liệu riêng về giống “xoài hạt lép”; mô tả dựa trên đặc điểm chung của xoài.'),
 ('Cần xác nhận', 'Nho Sữa Đài Loan', 'Chưa tìm được nguồn riêng về nho sữa Đài Loan; mô tả theo đặc điểm chung của nho sữa muscat.'),
 ('Cần xác nhận', 'Giá, tồn kho', 'Toàn bộ giá là giá tham khảo tự đặt (chưa kiểm chứng); tồn kho để 0; tất cả sản phẩm ở trạng thái draft (ẩn) để bạn duyệt rồi mới bán.'),
 ('Cần xác nhận', 'Thành phần giỏ/khay quà', 'Thành phần nhận diện bằng mắt từ ảnh (một số quả khó phân biệt giống). Hãy đối chiếu lại trước khi đăng.'),
 ('Nguồn số liệu', 'Dinh dưỡng', 'Tra cứu từ nhiều nguồn (USDA, Zespri, Viện Dinh dưỡng, các bài tổng hợp). Là giá trị tham khảo trung bình, không phải kết quả phân tích từng lô hàng.'),
]

# ---- Excel ----
thin = Side(style='thin', color='D0D7D2'); border = Border(left=thin, right=thin, top=thin, bottom=thin)
GREEN = PatternFill('solid', fgColor='1B4D3E')
wb = Workbook(); ws = wb.active; ws.title = 'SanPham'
for i, c in enumerate(COLS, start=1):
    h = ws.cell(row=1, column=i, value=c); h.font = Font(bold=True, color='FFFFFF'); h.fill = GREEN
    h.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True); h.border = border
    ws.column_dimensions[h.column_letter].width = 18
hints = {'ten_san_pham': '(Bắt buộc)', 'danh_muc_chinh': '(Bắt buộc)', 'don_vi_tinh': '(Bắt buộc)', 'gia_ban': '(Bắt buộc)', 'ton_kho': '(Bắt buộc)', 'anh_chinh': '(Bắt buộc)'}
for i, c in enumerate(COLS, start=1):
    h = ws.cell(row=2, column=i, value=hints.get(c, '(Tùy chọn)')); h.font = Font(italic=True, size=9); h.alignment = Alignment(horizontal='center')
for r, row in enumerate(rows, start=3):
    for i, c in enumerate(COLS, start=1):
        cell = ws.cell(row=r, column=i, value=row[c]); cell.alignment = Alignment(vertical='top', wrap_text=(c in ('mo_ta_ngan', 'mo_ta_chi_tiet', 'thong_tin_dinh_duong', 'ten_san_pham')))
for col, w in {'A': 40, 'B': 16, 'C': 34, 'D': 28, 'U': 50, 'V': 60, 'W': 40, 'X': 30, 'Y': 40}.items():
    ws.column_dimensions[col].width = w
ws.freeze_panes = 'B3'

wc = wb.create_sheet('DanhMuc')
for i, h in enumerate(['ten_danh_muc', 'slug', 'mo_ta', 'anh_danh_muc', 'thu_tu'], start=1):
    c = wc.cell(row=1, column=i, value=h); c.font = Font(bold=True, color='FFFFFF'); c.fill = GREEN
    wc.column_dimensions[c.column_letter].width = 32
for r, (n, s, o) in enumerate(CATEGORIES, start=2):
    for i, v in enumerate([n, s, '', '', o], start=1):
        wc.cell(row=r, column=i, value=v)

wn = wb.create_sheet('GhiChu')
for i, h in enumerate(['Loại', 'Đối tượng', 'Nội dung'], start=1):
    c = wn.cell(row=1, column=i, value=h); c.font = Font(bold=True, color='FFFFFF'); c.fill = GREEN
for r, (a, b, c) in enumerate(notes, start=2):
    wn.cell(row=r, column=1, value=a); wn.cell(row=r, column=2, value=b); x = wn.cell(row=r, column=3, value=c); x.alignment = Alignment(wrap_text=True, vertical='top')
wn.column_dimensions['A'].width = 16; wn.column_dimensions['B'].width = 52; wn.column_dimensions['C'].width = 110

os.makedirs(OUT_DIR, exist_ok=True)
wb.save(XLSX)
print('san pham:', len(rows), '| anh da chep vao images/ | ghi chu:', len(notes))
