import './globals.css';

export const metadata = {
  title: 'เกมแต่งตัวตุ๊กตา 🎀',
  description: 'เกมแต่งตัวตุ๊กตาสไตล์น่ารัก สร้างด้วย Phaser 3 + Next.js',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
