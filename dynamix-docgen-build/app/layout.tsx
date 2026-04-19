import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dynamix DocGen — AI Project Document Generator",
  description:
    "Transform meeting transcripts into professional BRD, SOW, SRS, Solution and Architecture documents. Built by Dynamix Solutions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
