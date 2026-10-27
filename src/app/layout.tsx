import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";

const vazir = Vazirmatn({
  variable: "--font-vazir",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "پوشین | پنل مدیریت فروشگاه",
  description: "پنل مدیریت فروشگاه پوشاک پوشین - نسخه نمایشی",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1110" },
  ],
};

/** Runs before paint so theme + accent never flash. */
const themeScript = `try{var s=JSON.parse(localStorage.getItem('pooshin-ui')||'{}');var d=s.theme?s.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);var a=JSON.parse(localStorage.getItem('pooshin-demo-v1')||'{}').state;if(a&&a.settings&&a.settings.accent)document.documentElement.dataset.accent=a.settings.accent}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={vazir.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
