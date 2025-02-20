import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export const metadata = {
  title: 'DMO',
  description: 'Dom\'s Multiplayer Online game'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body> 
        {children}
      </body>
    </html>
  );
}
