import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Alumnus — Organização Universitária",
    template: "%s | Alumnus",
  },
  description:
    "Organize suas notas, tarefas, presenças e rotina acadêmica em um só lugar com o Alumnus. Sistema seguro e intuitivo para estudantes universitários.",
  keywords: ["universidade", "alumnus", "notas", "tarefas", "presença", "horários", "estudante"],
  authors: [{ name: "Alumnus" }],
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head />
      <body className={plusJakartaSans.className}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {children}
        <Toaster
          position="bottom-right"
          richColors
          duration={4000}
        />
      </body>
    </html>
  );
}
