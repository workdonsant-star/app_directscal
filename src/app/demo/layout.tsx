import type { Metadata } from "next";
import { DemoShell } from "@/components/demo/demo-shell";
import "./demo-portraits.css";

export const metadata: Metadata = {
  title: "Vertex Logistics — DirectScal Demo",
  robots: { index: false, follow: false },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
