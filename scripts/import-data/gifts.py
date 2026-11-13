# -*- coding: utf-8 -*-
# Sản phẩm quà tặng: mô tả theo ẢNH THỰC TẾ (thành phần nhận diện bằng mắt, cần chủ shop đối chiếu lại).
# (nhóm ảnh, số thứ tự ảnh, tên, loại, thành phần, đặc điểm trang trí, giá tham khảo, ảnh phụ)
FRUIT_LABEL = {
    'tao': 'táo đỏ Dazzle', 'cam': 'cam vàng Úc', 'kiwi': 'kiwi vàng Zespri SunGold', 'nho': 'nho sữa Shine Muscat',
    'dua': 'dưa lưới', 'le': 'lê vàng', 'nhodo': 'nho đỏ', 'cam-tia': 'cam tỉa hoa',
}
NUT_LINE = {
    'tao': 'Táo: khoảng 52 kcal, vitamin C khoảng 4,6 mg, chất xơ khoảng 2,4 g',
    'cam': 'Cam: khoảng 47 kcal, vitamin C khoảng 53 mg, chất xơ khoảng 2,4 g',
    'cam-tia': 'Cam: khoảng 47 kcal, vitamin C khoảng 53 mg, chất xơ khoảng 2,4 g',
    'kiwi': 'Kiwi vàng: khoảng 54–59 kcal, vitamin C khoảng 150–160 mg, chất xơ khoảng 1,4 g',
    'nho': 'Nho sữa: khoảng 69 kcal, carbohydrate khoảng 18 g, chất xơ khoảng 0,9 g',
    'dua': 'Dưa lưới: khoảng 34 kcal, vitamin C khoảng 37 mg, chất xơ khoảng 0,9 g',
    'le': 'Lê: khoảng 57 kcal, chất xơ khoảng 3,1 g',
    'nhodo': 'Nho đỏ: khoảng 70 kcal, carbohydrate khoảng 18 g, chất xơ khoảng 1,4 g',
}
KT = 'Khay & Hộp quà trái cây'
GIO = 'Giỏ quà trái cây'
THAP = 'Tháp quà & Quà đi lễ'
K = 'Khay set hoa quả'
Q = 'Quà tặng trái cây'
P = 'Page'

GIFTS = [
 # ---- Khay set hoa quả (ảnh #1 là ảnh ghép 5 khay nên bỏ) ----
 (K, 2, 'Hộp Quà Cam Vàng Úc & Kiwi Vàng Zespri', KT, ['cam', 'kiwi'], 'hộp giấy xanh lá, túi quà đi kèm', 690000),
 (K, 3, 'Hộp Nho Sữa Shine Muscat Cao Cấp 2 Chùm', KT, ['nho'], 'hộp quà in họa tiết Nhật Bản, 2 chùm nho đóng túi', 990000),
 (K, 4, 'Khay Quà Dưa Lưới, Cam Vàng & Táo Dazzle Nơ Xanh Rêu', KT, ['dua', 'cam', 'tao'], 'khay đỏ, nơ ruy băng xanh rêu', 890000),
 (K, 5, 'Khay Quà Táo Dazzle & Cam Vàng Nơ Đỏ Rượu', KT, ['tao', 'cam'], 'khay xanh lá, nơ ruy băng đỏ rượu', 790000),
 (K, 6, 'Khay Quà Nho Sữa, Táo Dazzle & Cam Hộp Đỏ', KT, ['nho', 'tao', 'cam', 'cam-tia'], 'hộp đỏ, hoa cúc nhỏ trang trí', 990000),
 (K, 7, 'Hộp Nho Sữa Shine Muscat Hộp Đỏ Nơ Xanh Lá', KT, ['nho'], 'hộp đỏ in họa tiết Nhật Bản, nơ xanh lá', 890000),
 (K, 8, 'Hộp Quà Trong Suốt Nho Sữa, Táo & Cam Nơ Đỏ', KT, ['nho', 'tao', 'cam-tia'], 'hộp nắp trong suốt, nơ đỏ, hoa cúc nhỏ', 890000),
 (K, 9, 'Hộp Quà Trong Suốt Nho Sữa, Táo & Cam Nơ Xanh Olive', KT, ['nho', 'tao', 'cam'], 'hộp nắp trong suốt, nơ xanh olive', 890000),
 (K, 10, 'Khay Quà Kiwi Vàng & Cam Vàng Úc Nơ Xanh Ngọc', KT, ['kiwi', 'cam'], 'khay trắng, nơ ruy băng xanh ngọc', 690000),
 (K, 11, 'Hộp Quà Kiwi Vàng Zespri 6 Quả', KT, ['kiwi'], 'hộp trắng, nơ xanh nhạt', 390000),
 (K, 12, 'Hộp Quà Cam Vàng Úc & Táo Dazzle Xanh Lá', KT, ['cam', 'tao'], 'hộp xanh lá, túi quà', 590000),
 (K, 13, 'Set Cam Vàng Úc & Kiwi Vàng Đóng Khay', KT, ['cam', 'kiwi'], 'khay tiêu dùng, bọc màng', 390000),
 (K, 14, 'Túi Quà Dưa Lưới Cao Cấp 2 Quả', KT, ['dua'], 'mỗi quả đóng túi quà riêng, tem Melon', 590000),
 (K, 15, 'Hộp Quà Thank You Táo, Nho Sữa & Kiwi', KT, ['tao', 'nho', 'kiwi', 'cam-tia'], 'hộp xanh nhạt có lời cảm ơn', 890000),
 (K, 16, 'Khay Quà Dưa Lưới, Kiwi Vàng & Táo Dazzle', KT, ['dua', 'kiwi', 'tao'], 'khay trắng, nơ xanh đậm Love at first sight', 890000),
 (K, 17, 'Khay Quà Nho Sữa, Cam & Táo Dazzle Nơ Xanh Đậm', KT, ['nho', 'cam', 'tao'], 'khay trắng, nơ xanh đậm, hoa cúc nhỏ', 890000),
 (K, 18, 'Khay Quà Dưa Lưới, Kiwi, Cam & Táo Nơ Xanh Đậm', KT, ['dua', 'kiwi', 'cam', 'tao'], 'khay xanh ngọc, nơ xanh đậm', 990000),
 (K, 19, 'Túi Quà Dưa Lưới PNF & 6 Táo Dazzle', KT, ['dua', 'tao'], 'dưa lưới bọc túi tím, 6 táo trong khay', 790000),
 (K, 20, 'Set Dưa Lưới & 6 Táo Dazzle Cuống Tươi', KT, ['dua', 'tao'], 'dưa lưới còn cuống, táo xếp khay', 790000),
 (K, 21, 'Hộp Táo Dazzle 8 Quả Hoa Cúc Nhỏ', KT, ['tao'], 'hộp trong suốt, hoa cúc nhỏ trang trí', 590000),
 (K, 22, 'Hộp Quà Nho Sữa, Táo Quấn Ren & Cam Tỉa', KT, ['nho', 'tao', 'cam', 'cam-tia'], 'hộp trắng, táo quấn dây ren, hoa cúc nhỏ', 990000),
 (K, 23, 'Hộp Quà Táo Dazzle & Cam Vàng Nơ Xanh Lá', KT, ['tao', 'cam'], 'hộp vuông, nơ xanh lá lớn', 790000),
 (K, 24, 'Hộp Quà Kiwi Vàng 15 Quả Hộp Đỏ', KT, ['kiwi'], 'hộp đỏ, nơ ruy băng trắng', 790000),
 (K, 25, 'Hộp Quà Kiwi Vàng 12 Quả Nơ Xanh Đậm', KT, ['kiwi'], 'hộp trắng viền gỗ, nơ xanh đậm', 650000),
 (K, 26, 'Khay Quà Táo Dazzle & Cam Vàng Nơ Xanh Ngọc', KT, ['tao', 'cam'], 'khay xanh lá, nơ xanh ngọc', 690000),
 (K, 27, 'Set Nho Sữa & 6 Cam Vàng Úc Đóng Khay', KT, ['nho', 'cam'], 'nho sữa nguyên chùm bọc màng, cam xếp khay', 590000),
 (K, 28, 'Hộp Táo Dazzle 6 Quả Hộp Cam', KT, ['tao'], 'hộp giấy cam, hoa cúc nhỏ', 490000),
 (K, 29, 'Khay Quà Dưa Lưới, Kiwi, Cam & Táo Nơ Xanh Ngọc', KT, ['dua', 'kiwi', 'cam', 'tao'], 'khay xanh lá, nơ xanh ngọc', 990000),
 (K, 30, 'Túi Quà Nho Sữa & Dưa Lưới', KT, ['nho', 'dua'], 'nho sữa nguyên chùm, hoa cúc nhỏ, nơ xanh đậm', 890000),
 (K, 31, 'Túi Quà Dưa Lưới, Nho Sữa & Trái Cây Mùa Vụ', KT, ['dua', 'nho'], 'túi quà xanh lá, kèm một khay trái cây vàng theo mùa', 990000),
 (K, 32, 'Khay Quà Nho Sữa, Cam Tỉa & Táo Dazzle', KT, ['nho', 'cam-tia', 'tao'], 'khay trắng, nơ xanh đậm', 890000),
 (K, 33, 'Khay 6 Kiwi Vàng Zespri', KT, ['kiwi'], 'khay tiêu dùng, bọc màng', 290000),
 (K, 34, 'Hộp Táo Dazzle 6 Quả Nơ Xanh Ngọc', KT, ['tao'], 'hộp trắng, nơ xanh ngọc', 490000),
 (K, 35, 'Set 6 Táo Dazzle Đóng Khay', KT, ['tao'], 'khay tiêu dùng, bọc màng', 330000),
 (K, 36, 'Set Kiwi Vàng, Nho Đỏ & Táo Đỏ Đóng Khay', KT, ['kiwi', 'nhodo', 'tao'], 'khay tiêu dùng, bọc màng', 590000),
 (K, 37, 'Set 6 Táo Dazzle & 6 Kiwi Vàng Đóng Khay', KT, ['tao', 'kiwi'], 'hai khay bọc màng', 590000),
 # ---- Quà tặng trái cây (bỏ #5, #6: ảnh chụp màn hình của shop khác; #10, #11: có tên khách hàng; #29 trùng #28) ----
 (Q, 1, 'Giỏ Quà Trái Cây Lưới Đỏ Dưa Lưới, Táo & Lê Moon Pear', GIO, ['dua', 'tao', 'le', 'cam-tia'], 'lưới đỏ, nơ đỏ, quai giỏ trang trí', 1290000),
 (Q, 2, 'Giỏ Trái Cây Hoa Tươi Lưới Hồng Pastel', GIO, ['dua', 'cam'], 'lưới hồng, hoa hồng và hoa lá trắng hồng, nơ hồng', 1190000),
 (Q, 3, 'Tháp Cam Vàng Úc Hoa Cúc Vàng', THAP, ['cam'], 'lưới vàng, hoa cúc vàng cắm đỉnh tháp', 1290000),
 (Q, 4, 'Cặp Tháp Quà Táo Đỏ & Cam Vàng Hoa Cúc Vàng', THAP, ['tao', 'cam'], 'hai tháp lưới vàng, hoa cúc vàng', 2490000),
 (Q, 7, 'Giỏ Quà Trái Cây Lưới Xanh Lá Dưa Lưới, Táo & Cam Tỉa', GIO, ['dua', 'tao', 'cam-tia'], 'lưới xanh lá, nơ xanh olive', 1290000),
 (Q, 8, 'Giỏ Quà Trái Cây Lưới Đỏ Cam Tỉa & Táo Quai Đỏ', GIO, ['cam-tia', 'tao'], 'lưới đỏ, nơ đỏ, quai giỏ trang trí', 990000),
 (Q, 9, 'Hộp Quà Kiwi Vàng Ngày Nhà Giáo 20/11', KT, ['kiwi'], 'hộp cam, tem chúc mừng Ngày Nhà giáo Việt Nam 20/11', 590000),
 (Q, 12, 'Giỏ Hoa Quả Hoa Trắng Lưới Xanh Lá Cam & Kiwi', GIO, ['cam', 'kiwi', 'tao'], 'lưới xanh lá, hoa hồng và hoa lá trắng', 1190000),
 (Q, 13, 'Giỏ Hoa Quả Hoa Vàng Chanh Dưa Lưới, Nho & Kiwi', GIO, ['dua', 'nho', 'kiwi', 'tao'], 'lưới xanh lá, hoa vàng chanh và hoa lá', 1290000),
 (Q, 14, 'Giỏ Quà Trái Cây Lưới Đỏ Cam, Nho, Kiwi & Dưa', GIO, ['cam', 'nho', 'kiwi', 'dua', 'tao'], 'lưới đỏ, nơ đỏ rượu', 1390000),
 (Q, 15, 'Giỏ Quà Trái Cây Lưới Xanh Lá Dưa Lưới, Nho Đỏ & Cam', GIO, ['dua', 'nhodo', 'cam', 'tao'], 'lưới xanh lá, nơ vàng olive', 1390000),
 (Q, 16, 'Giỏ Quà Trái Cây Lưới Xanh Lá Dưa Lưới, Cam & Kiwi', GIO, ['dua', 'cam', 'kiwi', 'tao'], 'lưới xanh lá, quai giỏ trang trí', 1290000),
 (Q, 17, 'Cặp Giỏ Quà Lưới Đỏ Nho Sữa & Dưa Lưới', GIO, ['nho', 'dua', 'tao', 'cam-tia'], 'hai giỏ lưới đỏ, nơ đỏ rượu', 2490000),
 (Q, 18, 'Giỏ Quà Trái Cây Lưới Đỏ Dưa Lưới, Cam & Lê Vàng', GIO, ['dua', 'cam', 'le', 'tao'], 'lưới đỏ, nơ đỏ rượu', 1290000),
 (Q, 19, 'Giỏ Hoa Quả Hoa Cẩm Chướng Hồng Lưới Hồng', GIO, ['nho', 'cam', 'kiwi', 'tao'], 'lưới hồng, hoa cẩm chướng hồng và đỏ', 1290000),
 (Q, 20, 'Giỏ Hoa Quả Hoa Hồng Cẩm Chướng Cam, Kiwi & Táo', GIO, ['cam', 'kiwi', 'tao'], 'lưới hồng, hoa cẩm chướng hồng đậm', 1190000),
 (Q, 21, 'Giỏ Hoa Quả Lưới Tím Hoa Lan Tím & Dưa Lưới', GIO, ['dua', 'cam', 'tao'], 'lưới xanh tím, hoa lan tím, nơ tím nhạt', 1390000),
 (Q, 22, 'Giỏ Quà Trái Cây Lưới Đỏ Rượu Dưa Lưới, Nho & Cam Tỉa', GIO, ['dua', 'nho', 'cam-tia', 'tao'], 'lưới đỏ rượu, nơ đỏ', 1290000),
 (Q, 23, 'Giỏ Quà Mini Lưới Đỏ Rượu Nho Sữa & Dưa Lưới', GIO, ['nho', 'dua', 'kiwi', 'cam-tia'], 'giỏ nhỏ gọn, lưới đỏ rượu, nơ đỏ', 890000),
 (Q, 24, 'Giỏ Hoa Quả Hoa Xanh Lưới Xanh Chanh Cam & Kiwi', GIO, ['cam', 'kiwi', 'tao'], 'lưới xanh chanh, hoa xanh lá và hoa hồng trắng', 1190000),
 (Q, 25, 'Giỏ Quà Trái Cây Nho Sữa & Táo Dazzle Lưới Trắng Xanh', GIO, ['nho', 'tao', 'cam'], 'lưới trắng xanh, nơ xanh olive', 1190000),
 (Q, 26, 'Giỏ Quà Trái Cây Dưa Lưới, Nho Sữa & Táo Lưới Trắng Xanh', GIO, ['dua', 'nho', 'tao', 'cam-tia'], 'lưới trắng xanh, nơ vàng olive', 1290000),
 (Q, 27, 'Giỏ Quà Trái Cây Nho Sữa, Táo & Kiwi Lưới Kem', GIO, ['nho', 'tao', 'kiwi'], 'lưới màu kem, quai giỏ trang trí', 1190000),
 (Q, 28, 'Giỏ Hoa Quả Hoa Cúc Vàng Nho Sữa & Táo', GIO, ['nho', 'tao'], 'lưới vàng, hoa cúc vàng, quai giỏ vàng', 1190000, [(Q, 29)]),
 (Q, 30, 'Giỏ Quà Trái Cây Lưới Vàng Dưa Lưới, Cam & Táo', GIO, ['dua', 'cam', 'tao', 'cam-tia'], 'lưới vàng, nơ vàng', 1290000),
 (Q, 31, 'Giỏ Quà Trái Cây Lưới Xanh Olive Táo, Cam Tỉa & Lê Vàng', GIO, ['tao', 'cam-tia', 'le'], 'lưới xanh olive, nơ xanh olive', 990000),
 # ---- Page (ảnh minh họa dựng sẵn; #6, #7, #13 là ảnh ghép/quảng cáo nên bỏ) ----
 (P, 1, 'Giỏ Quà Xanh Lá Hải Anh Fruit Dưa Lưới, Nho Sữa & Táo', GIO, ['dua', 'nho', 'tao', 'cam-tia'], 'giỏ lưới xanh lá, nơ xanh olive, quai giỏ', 1390000),
 (P, 2, 'Tháp Táo Đỏ Hoa Cúc Vàng Cam Hải Anh Fruit', THAP, ['tao'], 'tháp táo, lưới vàng, hoa cúc và lá cọ trang trí', 1590000),
 (P, 3, 'Giỏ Hoa Hồng Vàng Nho Sữa, Táo & Dưa Vàng', GIO, ['nho', 'tao', 'dua'], 'giỏ lưới vàng, hoa hồng vàng, nơ vàng', 1490000),
 (P, 4, 'Giỏ Quà Xanh Chanh Dưa Lưới, Cam Tỉa & Táo', GIO, ['dua', 'cam-tia', 'tao'], 'giỏ lưới xanh chanh, nơ xanh olive', 1290000),
 (P, 5, 'Giỏ Hoa Cẩm Chướng Đỏ Cam Tỉa & Táo Dazzle', GIO, ['cam-tia', 'tao'], 'giỏ lưới đỏ rượu, hoa cẩm chướng đỏ và hồng trắng', 1490000),
 (P, 8, 'Hộp Quà Trắng Nho Sữa, Táo & Kiwi Hải Anh Fruit', KT, ['nho', 'tao', 'kiwi'], 'hộp trắng viền xanh lá, nơ xanh đậm có logo Hải Anh Fruit', 990000),
 (P, 9, 'Giỏ Quà Nho Sữa & Táo Đỏ Lưới Xanh Chanh', GIO, ['nho', 'tao'], 'giỏ lưới xanh chanh, nơ xanh olive, ren trắng', 1290000),
 (P, 10, 'Giỏ Táo Đỏ Dazzle Quai Tròn Lưới Xanh Chanh', GIO, ['tao'], 'giỏ tròn, lưới xanh chanh', 1090000),
 (P, 11, 'Giỏ Hoa Cúc Vàng Nho Sữa & Táo', GIO, ['nho', 'tao'], 'giỏ lưới vàng, hoa cúc vàng, bảng chữ Trái cây cao cấp', 1490000),
 (P, 12, 'Tháp Cam Vàng Hoa Cúc Hải Anh Fruit', THAP, ['cam'], 'tháp cam, lưới vàng, hoa cúc vàng', 1390000),
 (P, 14, 'Giỏ Hoa Hồng Vàng Nho Sữa, Táo & Dưa Vàng Hải Anh Fruit', GIO, ['nho', 'tao', 'dua'], 'giỏ lưới vàng, hoa hồng vàng, nơ vàng', 1490000),
]

EXCLUDED = [
 (K, 1, 'Ảnh ghép nhiều khay quà trong một khung hình, không dùng làm ảnh một sản phẩm.'),
 (Q, 5, 'Ảnh chụp màn hình danh mục quà của cửa hàng khác (có chữ CAM FRUIT, SEND TO). Không nên dùng.'),
 (Q, 6, 'Ảnh chụp màn hình danh mục quà của cửa hàng khác (có chữ CAM FRUIT). Không nên dùng.'),
 (Q, 10, 'Có tấm thiệp ghi tên cơ quan/khách hàng cụ thể. Đã bỏ để tránh lộ thông tin khách; cần ảnh khác hoặc che chữ.'),
 (Q, 11, 'Có bảng chúc mừng ghi tên công ty và người nhận. Đã bỏ để tránh lộ thông tin khách; cần ảnh khác hoặc che chữ.'),
 (Q, 29, 'Trùng với ảnh #28 (đã gộp làm ảnh phụ).'),
 (P, 6, 'Ảnh quảng cáo có chữ chèn (“Hoa quả cúng rằm...”), không phải ảnh sản phẩm.'),
 (P, 7, 'Ảnh ghép dãy 4 giỏ, không dùng làm ảnh một sản phẩm.'),
 (P, 13, 'Ảnh ghép hai tháp (cam và táo), không dùng làm ảnh một sản phẩm.'),
]
