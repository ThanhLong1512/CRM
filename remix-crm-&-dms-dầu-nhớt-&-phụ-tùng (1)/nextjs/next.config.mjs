/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Bỏ qua lỗi SSR đối với các thư viện vẽ đồ thị client-side nếu cần
  transpilePackages: ['lucide-react', 'recharts'],
};

export default nextConfig;
