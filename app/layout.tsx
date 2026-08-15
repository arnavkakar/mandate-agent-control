import type { Metadata } from "next";
import "@fontsource-variable/newsreader";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const sans=Geist({variable:"--font-sans",subsets:["latin"]});
const mono=Geist_Mono({variable:"--font-mono",subsets:["latin"]});

export async function generateMetadata():Promise<Metadata>{
 const h=await headers();
 const host=h.get("x-forwarded-host")??h.get("host")??"localhost:3000";
 const protocol=h.get("x-forwarded-proto")??(host.startsWith("localhost")?"http":"https");
 const socialImage=`${protocol}://${host}/opengraph-image`;
 return {
  metadataBase:new URL("https://mandate-agent.com"),
  title:{default:"Mandate — Authorization controls for AI-agent spending",template:"%s · Mandate"},
  description:"Give AI agents narrowly scoped spending authority with deterministic policy, human approvals, risk controls, and explainable decisions.",
  keywords:["AI agent payments","agent authorization","AI spending controls","programmable authorization","agentic commerce","human approval workflow"],
  alternates:{canonical:"/"},
  robots:{index:true,follow:true},
  icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},
  openGraph:{title:"Mandate — Authorization controls for AI-agent spending",description:"Deterministic policy, human approvals, risk controls, and explainable decisions for agent purchase requests.",url:"/",siteName:"Mandate",images:[{url:socialImage,width:1200,height:630,alt:"Mandate authorization control layer"}],type:"website"},
  twitter:{card:"summary_large_image",title:"Mandate — Authorization controls for AI-agent spending",description:"Deterministic authorization and risk controls for AI-agent purchase requests.",images:[socialImage]},
 };
}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
