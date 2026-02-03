import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuraBackground } from "@/components/layout/aura-background"
import { ToastProvider } from "@/components/ui/toast"
import { ConfirmProvider } from "@/components/providers/confirm-provider"
import QueryProvider from "@/components/providers/query-provider"
import { UserStoreProvider } from "@/components/providers/user-store-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kevin - AI Marketing Co-pilot",
  description: "AI-driven Marketing Co-pilot for solo marketers managing Chinese social media platforms",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuraBackground />
        <QueryProvider>
          <UserStoreProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <ToastProvider>
                <ConfirmProvider>
                  {children}
                </ConfirmProvider>
              </ToastProvider>
            </ThemeProvider>
          </UserStoreProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
