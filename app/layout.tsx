import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionSync } from "../components/auth/AuthSessionSync";
import { LogoutButton } from "../components/auth/LogoutButton";
import { getVendorSession } from "../lib/auth/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turbocase",
  description: "Vendor portal",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getVendorSession()

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthSessionSync />
        <header
          style={{
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
          }}
        >
          <div
            style={{
              margin: "0 auto",
              maxWidth: 960,
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link
              href={session ? "/" : "/login"}
              style={{
                color: "#0f172a",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Turbocase
            </Link>

            {session ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: "#475569", fontSize: "0.95rem" }}>
                  {session.email ?? session.userId}
                </span>
                <LogoutButton />
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Link
                  href="/login"
                  style={{ color: "#0f172a", textDecoration: "none" }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  style={{ color: "#0f172a", textDecoration: "none" }}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
