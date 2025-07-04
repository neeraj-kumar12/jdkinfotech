import { Inter } from "next/font/google";
import "./globals.css";
import DynamicTitle from "./DynamicTitle";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  description: "Welcome to JDK Infotech",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        {/* Preload the dynamic title to avoid FOUC (Flash of Unstyled Content) */}
        <title>{metadata.title}</title>
      </head>
      <body>
        <DynamicTitle />
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}