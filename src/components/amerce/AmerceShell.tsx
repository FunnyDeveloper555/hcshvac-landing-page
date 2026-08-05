import { useEffect } from "react";

/**
 * Loads the Amerce theme stylesheets only while a company-facing page is
 * mounted, so Bootstrap / theme resets never leak into the admin app.
 * Stylesheets live in /public/amerce (see public/amerce/css/app.css).
 */
const THEME_STYLESHEETS = [
  "/amerce/fonts/fonts.css",
  "/amerce/css/bootstrap.min.css",
  "/amerce/icon/icomoon/style.css",
  "/amerce/css/swiper-bundle.min.css",
  "/amerce/css/animate.css",
  "/amerce/css/app.css",
];

const ATTR = "data-amerce-theme";

interface AmerceShellProps {
  /** Company brand color (hex). Drives the theme accent color. */
  brandColor?: string | null;
  children: React.ReactNode;
}

const AmerceShell = ({ brandColor, children }: AmerceShellProps) => {
  useEffect(() => {
    // Avoid double-inject when several company views mount/unmount quickly.
    const existing = document.head.querySelectorAll(`[${ATTR}]`);
    if (existing.length === 0) {
      THEME_STYLESHEETS.forEach((href) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.setAttribute(ATTR, "");
        document.head.appendChild(link);
      });
    }
    document.body.classList.add("amerce-body");

    return () => {
      document.head.querySelectorAll(`[${ATTR}]`).forEach((el) => el.remove());
      document.body.classList.remove("amerce-body");
    };
  }, []);

  const accent = brandColor || "#DC4646";

  return (
    <div
      className="amerce-scope"
      style={
        {
          "--primary": accent,
          "--secondary": accent,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};

export default AmerceShell;
