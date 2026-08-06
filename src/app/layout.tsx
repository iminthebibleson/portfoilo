import { Roboto } from "next/font/google";
import "./globals.css";

import Providers from "./providers";


const roboto = Roboto({
  weight: [
    "300",
    "400",
    "500",
    "700",
  ],
  subsets: ["latin"],
});


export const metadata = {
  title: "Iminthebibleson Hub",
  description: "Cool shit happens here",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en">

      <body className={roboto.className}>

        <Providers>
          {children}
        </Providers>

      </body>

    </html>
  );
}