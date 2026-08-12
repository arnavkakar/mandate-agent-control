import { ImageResponse } from "next/og";

export const alt = "Mandate — deterministic authorization for AI-agent spending";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 70px",
          color: "#18221f",
          background: "#fbfaf6",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30, fontWeight: 700 }}>
          <div style={{ width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", background: "#174b45", borderRadius: 6 }}>
            M
          </div>
          mandate
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ maxWidth: 980, fontSize: 72, lineHeight: 1.02, letterSpacing: "-3px", fontWeight: 700 }}>
            AI agents can request. Mandate decides whether they may spend.
          </div>
          <div style={{ fontSize: 25, color: "#59645f" }}>
            Deterministic policy · Human approvals · Explainable decisions
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 18 }}>
          <span style={{ padding: "10px 14px", color: "#176b4b", background: "#e7f2ec", border: "1px solid #add0bf", borderRadius: 4 }}>APPROVED</span>
          <span style={{ padding: "10px 14px", color: "#805314", background: "#f8f1e4", border: "1px solid #d6bd91", borderRadius: 4 }}>APPROVAL_REQUIRED</span>
          <span style={{ padding: "10px 14px", color: "#963d3d", background: "#f8eeee", border: "1px solid #deb7b7", borderRadius: 4 }}>DECLINED</span>
        </div>
      </div>
    ),
    size,
  );
}
