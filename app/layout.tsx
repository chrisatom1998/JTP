import type { ReactNode } from "react";

export const metadata = {
  title: "Ad Monetization Planner",
  description: "Generate technical monetization plans for AdMob and Ad Manager",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, system-ui, Arial, sans-serif", background: "#fafafa", color: "#222" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>{children}</div>
      </body>
    </html>
  );
}
