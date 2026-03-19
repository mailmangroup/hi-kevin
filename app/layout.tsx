import type { Metadata } from "next"
import { Onest } from "next/font/google"
import "./globals.css"
import { AuraBackground } from "@/components/layout/aura-background"
import { ToastProvider } from "@/components/ui/toast"
import { ConfirmProvider } from "@/components/providers/confirm-provider"
import QueryProvider from "@/components/providers/query-provider"
import { UserStoreProvider } from "@/components/providers/user-store-provider"

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
})

export const metadata: Metadata = {
  title: "Kevin - AI Marketing Co-pilot",
  description: "AI-driven Marketing Co-pilot for solo marketers managing Chinese social media platforms",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${onest.className} ${onest.variable}`}>
        <AuraBackground />
        <QueryProvider>
          <UserStoreProvider>
            <ToastProvider>
              <ConfirmProvider>
                {children}
              </ConfirmProvider>
            </ToastProvider>
          </UserStoreProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
