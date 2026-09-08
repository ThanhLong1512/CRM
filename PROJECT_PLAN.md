# 🛢️ LUBRICANT CRM/DMS - PROJECT MASTER PLAN
**Dự án Quản lý Quan hệ Khách hàng & Phân phối Dầu nhớt (B2B2C)**

## 🎯 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
Xây dựng hệ thống CRM/DMS chuyên biệt cho nhà phân phối dầu nhớt. Hệ thống giúp quản lý danh mục sản phẩm phức tạp, kiểm soát hạn mức công nợ khách hàng (Garage/Đội xe), tối ưu hóa lộ trình tuyến bán hàng cho Sales, và cung cấp các tính năng đặc thù như quét QR tích điểm cho thợ sửa xe, quản lý vỏ phuy, và cảnh báo thay nhớt định kỳ.

## 🛠️ 2. TECH STACK (CÔNG NGHỆ SỬ DỤNG)
- **Framework:** Next.js 14+ (App Router)
- **Database & Auth:** Supabase (PostgreSQL, Supabase Auth)
- **ORM:** Prisma Client
- **UI/UX:** Tailwind CSS, Shadcn UI, Lucide Icons
- **State/Data Fetching:** React Server Components (RSC), Server Actions, SWR/React Query (nếu cần)
- **Offline Mode:** IndexedDB (Dexie.js) - *Dự kiến triển khai cho Mobile App PWA*
- **Deployment:** Vercel

## 👥 3. PHÂN QUYỀN HỆ THỐNG (ROLES & PERMISSIONS - RBAC)
1. **ADMIN / MANAGER:** Toàn quyền quản trị, xem mọi báo cáo, thay đổi hạn mức công nợ, quản lý nhân sự.
2. **ACCOUNTANT (KẾ TOÁN):** Quản lý công nợ, duyệt đơn hàng, quản lý thu/trả vỏ phuy.
3. **SALES (NHÂN VIÊN THỊ TRƯỜNG):** Chỉ xem khách hàng tuyến của mình, tạo đơn hàng, check-in định vị GPS, quét QR.

---

## 🚀 4. CHI TIẾT TÍNH NĂNG (FEATURE MODULES)

### Module 1: Core System & Security (Hạ tầng & Bảo mật)
- [x] Kết nối CSDL PostgreSQL qua Prisma (Direct & Transaction pooler).
- [x] Tích hợp Supabase Auth (Đăng ký, Đăng nhập).
- [x] Middleware bảo vệ các Route nội bộ `(private)`.
- [x] Phân quyền hiển thị Sidebar UI theo Role (Admin/Sales).
- [x] Layout chuẩn Enterprise CRM (Sidebar collapsible, Header).

### Module 2: Master Data (Dữ liệu nền tảng)
- **Quản lý Sản phẩm (Products):**
  - [x] Danh sách sản phẩm (Mã, Tên, Độ nhớt, API/JASO, Dung tích, Giá bán, Tồn kho).
  - [x] Thêm/Sửa/Xóa (CRUD) qua Server Actions.
  - [x] Tìm kiếm (Search params), Lọc (Filter), và Toast Notification.
- **Quản lý Khách hàng (Customers):**
  - [x] Danh sách khách hàng phân loại theo GARAGE (Đại lý/Tiệm sửa xe) và FLEET (Đội xe).
  - [x] CRUD thông tin (Tên, SĐT, Địa chỉ, Tọa độ GPS).
  - [x] Thiết lập & Quản lý Hạn mức công nợ (Credit Limit).
- **Quản lý Nhân sự (Staff/Users):**
  - [x] Danh sách nhân viên lấy từ bảng User.
  - [x] Chức năng cấp quyền (Gán Role: ADMIN, SALES, ACCOUNTANT).

### Module 3: Sales Operations (Vận hành Sales & Đơn hàng)
- **Định tuyến & Check-in GPS:**
  - [x] Hiển thị bản đồ khách hàng theo tuyến.
  - [x] Nút Check-in bắt buộc phải thỏa điều kiện tọa độ GPS (<200m).
- **Tạo & Quản lý Đơn hàng (Orders):**
  - [x] Giao diện chọn sản phẩm nhanh, tính tổng tiền.
  - [x] **Credit Control (Chặn công nợ):** Khóa chốt đơn nếu (Dư nợ cũ + Đơn mới > Hạn mức).
  - [x] Bảng theo dõi trạng thái đơn hàng (Kanban Board: Chờ duyệt, Xuất kho, Đã giao).
- **Offline Mode (PWA):**
  - [x] Lưu tạm đơn hàng vào Local/IndexedDB khi mất mạng (xuống hầm mỏ, vùng sâu).
  - [x] Tự động Sync (đồng bộ) lên Server khi có mạng lại.

### Module 4: Industry-Specific Features (Tính năng "Vũ khí" ngành nhớt)
- **Mechanic Loyalty (Tích điểm Thợ):**
  - [x] Quét mã QR trên nắp chai/thùng bằng Camera điện thoại.
  - [x] Tích điểm đổi quà (Áo, nón, nhớt tặng) chống bán phá giá.
- **Fleet Management (Quản trị Đội xe):**
  - [x] Bảng theo dõi đầu xe của khách hàng Fleet.
  - [x] Thuật toán cảnh báo (Đèn Đỏ/Vàng/Xanh) dự báo thời điểm cần thay nhớt tiếp theo dựa trên số km/giờ máy chạy.
- **Quản lý Vỏ Phuy (Drum Tracking):**
  - [x] Theo dõi số lượng vỏ phuy xuất đi và thu hồi về để tránh thất thoát tài sản.

### Module 5: Dashboards & Reports (Báo cáo phân tích)
- [x] Bảng điều khiển (Dashboard) doanh thu tổng quan.
- [x] Cảnh báo "Đói hàng": Dự đoán Garage nào sắp cạn nhớt để Sales chủ động ghé thăm.
- [x] Ma trận RFM: Phân nhóm khách hàng (VIP, Nguy cơ rời bỏ) theo tần suất mua.

---

## 📈 5. TIẾN ĐỘ DỰ ÁN (PROJECT ROADMAP & CHECKLIST)

**Phase 1: Foundation & Master Data (Hoàn thành)**
- [x] Setup Environment & Architecture
- [x] Supabase Auth & Role Logic
- [x] Product CRUD, Search & Filters
- [x] Customer CRUD & Credit Limits
- [x] User Role Management UI

**Phase 2: Sales Engine (Hoàn thành phần online)**
- [x] Order Creation UI
- [x] Credit Limit Validation Logic
- [x] Routing & GPS Check-in
- [x] Kanban Board theo dõi trạng thái đơn

**Phase 3: Advanced CRM Features (Hoàn thành)**
- [x] Offline Sync (PWA / IndexedDB)
- [x] QR Scanner for Mechanics
- [x] Fleet Maintenance Warnings
- [x] Drum Tracking (vỏ phuy)
- [x] Dashboard doanh thu tổng quan
- [x] Cảnh báo "Đói hàng"
- [x] Ma trận RFM
- [x] ✅ **Phase 3 complete** — Module 5 (Dashboard / Đói hàng / RFM) đã xong.

**Phase 4: Real-world Enterprise Enhancements (Hoàn thành)**
- [x] Sổ Thu Nợ & Lập Phiếu Thu Tiền Mặt / Chuyển Khoản (`DebtPayment` CSDL thật)
- [x] Báo Cáo Phân Tích Tuổi Nợ (Debt Aging Matrix: Trong hạn, 1-15d, 16-30d, Nợ xấu >30d)
- [x] Cơ chế Chiết Khấu Thương Mại (%) & Quà Tặng Khuyến Mãi trên Đơn Hàng
- [x] Quy Đổi Đơn Vị Đóng Gói Ra Thể Tích Chuẩn Ngành (Tổng số Lít xuất kho)
- [x] ✅ **Phase 4 complete** — Nâng tầm dự án lên chuẩn vận hành thực tế tại NPP dầu nhớt.

---

## 🤖 CHỈ THỊ DÀNH CHO CURSOR AI (CURSOR INSTRUCTIONS)
1. **Always read this file:** Trước khi bắt đầu một prompt mới hoặc implement tính năng mới, hãy đọc file này để hiểu ngữ cảnh tổng thể.
2. **Update progress:** Khi hoàn thành một tính năng (Ví dụ: Customer CRUD), hãy tự động đánh dấu `[x]` vào checklist tương ứng trong file này.
3. **Tech Stack strictness:** Luôn sử dụng `Next.js App Router`, `Shadcn UI` (Tailwind), và `Prisma Server Actions`. Tránh sử dụng API Routes cũ của Pages Router trừ khi bắt buộc.
4. **UI consistency:** Luôn sử dụng thẻ `<Toaster />` cho phản hồi UI và dùng `lucide-react` cho các biểu tượng.