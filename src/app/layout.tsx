import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Concerts Near Wilmington, NC",
  description: "Find upcoming concerts, shows, and live music in the Wilmington, NC area",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f]">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-gray-800/50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <span className="text-2xl">🎸</span>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                ILM Concerts
              </span>
            </a>
            <span className="text-sm text-gray-500">Wilmington, NC</span>
          </div>
        </nav>

        <main>{children}</main>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 mt-16 py-8 text-center text-sm text-gray-600">
          <p>Data from Ticketmaster, SeatGeek, and local venues</p>
          <p className="mt-1">Artist info and previews powered by Spotify</p>
        </footer>
      </body>
    </html>
  );
}
