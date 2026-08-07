import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

import Providers from "./providers";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iminthebibleson Hub",
  description: "Cool shit happens here",

  openGraph: {
    title: "Iminthebibleson Hub",
    description: "Cool shit happens here",
    url: "https://iminthebibleson-tau.vercel.app",
    siteName: "Iminthebibleson Hub",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Iminthebibleson Hub",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Iminthebibleson Hub",
    description: "Cool shit happens here",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={roboto.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
