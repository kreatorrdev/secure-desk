import type { Metadata } from "next";
import { connection } from "next/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureDesk",
  description: "Company support, project requests and private files, connected.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
