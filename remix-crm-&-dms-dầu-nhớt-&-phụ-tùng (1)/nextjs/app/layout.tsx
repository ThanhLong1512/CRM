import type { Metadata } from 'next';
import { Outfit, Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-vietnam',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Remix CRM & DMS Dầu Nhớt & Phụ Tùng Ô tô',
  description:
    'Hệ thống quản lý phân phối & quan hệ khách hàng B2B chuyên ngành Dầu Nhớt & Phụ Tùng Ô tô - Tích hợp Quản lý vỏ phuy 200L, Credit Guard, GPS Check-in & Offline-First',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${outfit.variable} ${beVietnam.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-sans antialiased text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
