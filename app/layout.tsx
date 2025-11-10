"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "react-oidc-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cognitoAuthConfig = {
  authority: process.env.NEXT_PUBLIC_AUTHORITY,
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI,
  response_type: "code",
  scope: process.env.NEXT_PUBLIC_SCOPE,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider {...cognitoAuthConfig}>{children}</AuthProvider>
      </body>
    </html>
  );
}
