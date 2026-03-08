import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vibecore Studio",
  description: "Sitecore Marketplace App Builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
