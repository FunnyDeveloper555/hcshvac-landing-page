import { getThemeConfig, ThemeStyle } from "@/lib/companyThemes";

/**
 * Restores the Tailwind/shadcn HSL design tokens for subtrees that still use
 * the original (non-Amerce) company components, since the Amerce theme CSS
 * redefines --primary etc. as raw hex values.
 */
interface AmerceTailwindScopeProps {
  themeStyle?: ThemeStyle | null;
  className?: string;
  children: React.ReactNode;
}

const AmerceTailwindScope = ({ themeStyle, className, children }: AmerceTailwindScopeProps) => {
  const theme = getThemeConfig(themeStyle || "modern");

  return (
    <div
      className={className}
      style={
        {
          "--primary": theme.colors.primary,
          "--secondary": theme.colors.secondary,
          "--accent": theme.colors.accent,
          "--background": theme.colors.background,
          "--foreground": theme.colors.foreground,
          "--muted": theme.colors.muted,
          "--muted-foreground": theme.colors.mutedForeground,
          "--card": theme.colors.card,
          "--card-foreground": theme.colors.cardForeground,
          "--border": theme.colors.border,
          "--ring": theme.colors.primary,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
};

export default AmerceTailwindScope;
