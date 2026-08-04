import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Confido AI — Hiring Intelligence Platform",
    template: "%s | Confido AI",
  },
  description:
    "Evidence-based hiring intelligence for recruiters, universities, and enterprises. Validate candidate skills through multi-source evidence, explainable AI assessments, and recruiter-grade analytics.",
  keywords: [
    "hiring intelligence",
    "evidence-based hiring",
    "recruiter tools",
    "candidate assessment",
    "placement analytics",
    "AI hiring",
    "skill verification",
    "interview intelligence",
  ],
  authors: [{ name: "Confido AI" }],
  openGraph: {
    title: "Confido AI — Hiring Intelligence Platform",
    description:
      "Help recruiters hire using evidence rather than resumes. AI-powered candidate intelligence, skill verification, and explainable hiring recommendations.",
    type: "website",
    locale: "en_US",
    siteName: "Confido AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Confido AI — Hiring Intelligence Platform",
    description:
      "Evidence-based hiring intelligence for recruiters, universities, and enterprises.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
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
