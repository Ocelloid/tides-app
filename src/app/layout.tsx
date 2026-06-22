import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { Providers } from "~/app/providers";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Tides of Retribution",
  description: "Генератор персонажа D&D 5e",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${geist.variable}`}>
      <body>
        <TRPCReactProvider>
          <Providers>{children}</Providers>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
