import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CORE64 Records — First AI Music Label",
  description: "CORE64 Records — First AI Music Label platform (site + CRM)",
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
