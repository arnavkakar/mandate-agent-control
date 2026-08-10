import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const sans=Geist({variable:"--font-sans",subsets:["latin"]});
const mono=Geist_Mono({variable:"--font-mono",subsets:["latin"]});

export async function generateMetadata():Promise<Metadata>{
 const h=await headers();
 const host=h.get("x-forwarded-host")??h.get("host")??"localhost:3000";
 const protocol=h.get("x-forwarded-proto")??(host.startsWith("localhost")?"http":"https");
 const socialImage=`${protocol}://${host}/og.png`;
 return {
  title:"Mandate — Control how AI agents spend",
  description:"A programmable authorization and risk-control layer for simulated AI-agent payments.",
  icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},
  openGraph:{title:"Mandate — Control how AI agents spend",description:"Deterministic authorization and risk controls for simulated agent payments.",images:[socialImage],type:"website"},
  twitter:{card:"summary_large_image",title:"Mandate — Control how AI agents spend",description:"Deterministic authorization and risk controls for simulated agent payments.",images:[socialImage]},
 };
}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
