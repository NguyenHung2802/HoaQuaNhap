# -*- coding: utf-8 -*-
# Đọc Excel nhập sản phẩm -> data/import/products.json (để script Node nạp vào DB, không cần thêm thư viện đọc xlsx).
# Chạy: python scripts/xlsx-to-json.py [đường dẫn xlsx]
import sys, os, json
from openpyxl import load_workbook

root = os.path.join(os.path.dirname(__file__), '..')
src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'data', 'import', 'san-pham-hai-anh-fruit.xlsx')
out = os.path.join(root, 'data', 'import', 'products.json')

wb = load_workbook(src, data_only=True)

def sheet_rows(ws, start):
    hdr = [str(c.value).strip() if c.value is not None else '' for c in ws[1]]
    rows = []
    for i, r in enumerate(ws.iter_rows(min_row=start), start=start):
        vals = [c.value for c in r]
        if all(v is None or str(v).strip() == '' for v in vals):
            continue
        d = {h: ('' if v is None else v) for h, v in zip(hdr, vals) if h}
        d['_row'] = i
        rows.append(d)
    return rows

products = sheet_rows(wb['SanPham'], 3)
cats = sheet_rows(wb['DanhMuc'], 2)
cats = [c for c in cats if str(c.get('ten_danh_muc', '')).strip() and not str(c['ten_danh_muc']).startswith('Thêm danh mục')]
with open(out, 'w', encoding='utf-8') as f:
    json.dump({'products': products, 'categories': cats}, f, ensure_ascii=False, indent=1, default=str)
print('OK', len(products), 'san pham,', len(cats), 'danh muc')
