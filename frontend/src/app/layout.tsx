import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: "CareerAI - AI-Powered Resume & Interview Coach",
    template: "%s | CareerAI",
  },
  description: "Get your resume ATS-ready and ace your interviews with AI-powered feedback. Optimize your career with intelligent insights.",
  keywords: ["resume", "ATS", "interview", "career", "AI", "job search", "career coach"],
  authors: [{ name: "CareerAI Team" }],
  openGraph: {
    title: "CareerAI - AI-Powered Resume & Interview Coach",
    description: "Get your resume ATS-ready and ace your interviews with AI-powered feedback.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerAI - AI-Powered Resume & Interview Coach",
    description: "Get your resume ATS-ready and ace your interviews with AI-powered feedback.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
