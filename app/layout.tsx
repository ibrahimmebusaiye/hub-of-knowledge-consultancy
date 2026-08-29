import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hub of Knowledge Admin",
    template: "%s | Hub of Knowledge"
  },
  description: "Secure message management and website analytics for Hub of Knowledge & Enlightenment Consultancy Firm.",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
