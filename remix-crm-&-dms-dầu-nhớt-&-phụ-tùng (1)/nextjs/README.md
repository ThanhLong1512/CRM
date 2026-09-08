# Hướng Dẫn Tích Hợp & Chuyển Đổi Sang Next.js (App Router)
## Remix CRM & DMS Dầu Nhớt & Phụ Tùng B2B

Tài liệu này hướng dẫn chi tiết cách đưa toàn bộ giao diện và tính năng của ứng dụng **Remix CRM & DMS** vào dự án **Next.js** (hỗ trợ Next.js 14 và Next.js 15 với App Router).

---

### 1. Cài đặt Thư viện Phụ thuộc (Dependencies)
Trong thư mục dự án Next.js của bạn, chạy lệnh:

```bash
npm install lucide-react recharts motion canvas-confetti leaflet
npm install -D @types/canvas-confetti @types/leaflet
```

---

### 2. Cấu trúc Thư mục trong Next.js (App Router)

```text
my-nextjs-project/
├── app/
│   ├── layout.tsx         # Root Layout thiết lập font Google & Metadata
│   ├── globals.css        # Tailwind CSS & scrollbar
│   ├── page.tsx           # Trang chính (DMS Shell & Dashboard)
│   └── auth/
│       └── page.tsx       # Tuyến đường đăng nhập độc lập (/auth)
├── components/
│   ├── auth/              # AuthScreen, UserProfileModal, LogoutConfirm, ChangePassword
│   ├── pwa/               # PwaFastCatalog, PwaOrderReviewDrawer (Catalog & Ký nhận)
│   ├── DashboardView.tsx  # Biểu đồ Recharts, phân tích RFM
│   ├── Header.tsx         # Thanh điều hướng trên cùng, profile chip, nút đăng xuất
│   ├── Sidebar.tsx        # Menu 13 tính năng & chân trang đăng xuất
│   └── ...
├── types.ts               # Định nghĩa TypeScript (AuthUser, Customer, Product, Order...)
├── mockData.ts            # Dữ liệu khởi tạo (Sản phẩm dầu nhớt, garage, đội xe...)
├── utils/
│   └── audio.ts           # Web Audio API Synthesizer (Ting, Click, Warning, Success)
├── tailwind.config.ts     # Cấu hình phông chữ Outfit, Be Vietnam Pro, JetBrains Mono
└── next.config.mjs        # Cấu hình Next.js
```

---

### 3. Các Điểm Cốt Lõi Khi Chuyển Sang Next.js

#### A. Chỉ thị `'use client'`
Next.js App Router mặc định render các component ở Server (Server Components). Do hệ thống CRM/DMS sử dụng:
- State & Hooks (`useState`, `useEffect`, `useRef`)
- Tương tác DOM, Browser Storage (`localStorage`)
- Thư viện đồ thị (`recharts`), bản đồ (`leaflet`), âm thanh Web Audio (`AudioContext`)

👉 **Tất cả các components trong thư mục `src/components/` đã được thêm sẵn chỉ thị `'use client';` ở dòng đầu tiên**, giúp bạn copy trực tiếp vào dự án Next.js mà không bị lỗi Server Component.

#### B. Ngăn ngừa lỗi Hydration (SSR Mismatch)
Với các tác vụ đọc `localStorage` (như phiên đăng nhập của người dùng), các hàm trong `src/components/auth/authData.ts` đã được bọc lớp kiểm tra SSR:

```typescript
if (typeof window === 'undefined') {
  return DEMO_USERS[0]; // Giá trị mặc định an toàn cho Server Pre-rendering
}
```

#### C. Nạp Dynamic Component trên Next.js (`app/page.tsx`)
Tại trang `app/page.tsx`, sử dụng `next/dynamic` với tùy chọn `ssr: false` để đảm bảo hệ thống DMS tải mượt mà trên client mà không phát sinh lỗi lệch cấu trúc HTML giữa Server và Client:

```tsx
'use client';
import dynamic from 'next/dynamic';

const AppContent = dynamic(() => import('@/components/App'), {
  ssr: false,
  loading: () => <div>Đang nạp dữ liệu phân phối...</div>,
});

export default function HomePage() {
  return <AppContent />;
}
```

---

### 4. Cấu hình Phông Chữ Chuẩn trong Next.js (`app/layout.tsx`)
Sử dụng gói tối ưu hóa phông chữ tích hợp sẵn của Next.js (`next/font/google`):

```tsx
import { Outfit, Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const beVietnam = Be_Vietnam_Pro({ subsets: ['latin', 'vietnamese'], variable: '--font-vietnam' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${outfit.variable} ${beVietnam.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased text-slate-900 bg-slate-50">{children}</body>
    </html>
  );
}
```

---

### 5. Cách Lấy Mã Nguồn Này Về Dự Án Next.js của Bạn
Bạn có 2 cách rất nhanh:
1. **Tải toàn bộ file ZIP**: Nhấn vào menu thiết lập của AI Studio -> chọn **Export as ZIP** hoặc **Export to GitHub**. Mọi file trong thư mục `src/` và `nextjs/` sẽ có sẵn đầy đủ.
2. **Copy thư mục components**: Copy trực tiếp thư mục `src/components`, `src/types.ts`, `src/mockData.ts` và `src/utils` vào thư mục dự án Next.js của bạn.
