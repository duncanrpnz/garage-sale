import './globals.css';

export const metadata = {
  title: 'Garage Sale',
  description: 'Turn mixed photo uploads into ready-to-post marketplace listings.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
