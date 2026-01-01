import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/providers/AuthProvider"
import { ThemeProvider } from "@/providers/ThemeProvider"
import { QueryProvider } from "@/providers/QueryProvider"
import { ToastProvider } from "@/providers/ToastProvider"

export const metadata: Metadata = {
  title: "Lithic - Enterprise Healthcare SaaS",
  description: "Modern healthcare management platform for hospitals and clinics",
  keywords: ["healthcare", "hospital", "clinic", "patient management", "EHR"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              {children}
              <ToastProvider />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
