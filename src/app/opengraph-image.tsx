import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export const alt = "Apfel Park - Premium Smartphone Repair & Tech Store";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0b0c",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(212, 158, 66, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(212, 158, 66, 0.1) 0%, transparent 50%)",
        }}
      >
        {/* Gold accent line at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #b5842f, #d49e42, #e4b15a, #d49e42, #b5842f)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
          }}
        >
          {/* Logo placeholder - circular gold gradient */}
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "24px",
              background: "linear-gradient(135deg, #e4b15a 0%, #d49e42 50%, #b5842f 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "40px",
              boxShadow: "0 20px 60px rgba(212, 158, 66, 0.3)",
            }}
          >
            <div
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color: "#0b0b0c",
              }}
            >
              AP
            </div>
          </div>

          {/* Brand name */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #e4b15a 0%, #d49e42 50%, #b5842f 100%)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: "16px",
              letterSpacing: "-0.02em",
            }}
          >
            Apfel Park
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "28px",
              color: "#f5f5f6",
              marginBottom: "32px",
              letterSpacing: "0.05em",
            }}
          >
            Smart Phone. Smart Service. Smart Price.
          </div>

          {/* Features */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginTop: "20px",
            }}
          >
            {["Express Repair", "Premium Devices", "12 Month Warranty"].map(
              (feature) => (
                <div
                  key={feature}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "12px 24px",
                    borderRadius: "9999px",
                    border: "1px solid rgba(212, 158, 66, 0.4)",
                    backgroundColor: "rgba(212, 158, 66, 0.1)",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#d49e42",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "18px",
                      color: "#d49e42",
                      fontWeight: "600",
                    }}
                  >
                    {feature}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Location badge */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#8d8d91",
            fontSize: "18px",
          }}
        >
          <span>📍</span>
          <span>Hamburg, Germany</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
