import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Apfel Park - Premium Smartphone Repair & Tech Store";
export const size = {
  width: 1200,
  height: 600,
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
            padding: "48px",
          }}
        >
          {/* Logo placeholder */}
          <div
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #e4b15a 0%, #d49e42 50%, #b5842f 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "32px",
              boxShadow: "0 20px 60px rgba(212, 158, 66, 0.3)",
            }}
          >
            <div
              style={{
                fontSize: "40px",
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
              fontSize: "64px",
              fontWeight: "bold",
              background: "linear-gradient(135deg, #e4b15a 0%, #d49e42 50%, #b5842f 100%)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: "12px",
              letterSpacing: "-0.02em",
            }}
          >
            Apfel Park
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "24px",
              color: "#f5f5f6",
              marginBottom: "28px",
              letterSpacing: "0.05em",
            }}
          >
            Smart Phone. Smart Service. Smart Price.
          </div>

          {/* Features */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginTop: "16px",
            }}
          >
            {["Express Repair", "Premium Devices", "Hamburg"].map((feature) => (
              <div
                key={feature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(212, 158, 66, 0.4)",
                  backgroundColor: "rgba(212, 158, 66, 0.1)",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: "#d49e42",
                  }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    color: "#d49e42",
                    fontWeight: "600",
                  }}
                >
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
