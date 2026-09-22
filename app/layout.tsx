import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CORE64 Records — Recording Studio",
  description:
    "CORE64 Records studio: upload WAV → ebur128 QC → true-peak safety master → download",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
