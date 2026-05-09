import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import "@/styles/global.css";

export const metadata = {
  title: { default: "StreamLive", template: "%s — StreamLive" },
  description: "ดูและ stream สดได้ทุกที่ ฟรี ไม่มีโฆษณา",
};

export const viewport = {
  themeColor: "#9147ff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
