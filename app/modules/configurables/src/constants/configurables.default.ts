/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  primary: string;
  secondary: string;
  accent: string;
};

export type TTrustFeature = {
  title: string;
  description: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  tagline: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaLabel: string;
  trustFeatures: TTrustFeature[];
  supportEmail: string;
  currencySymbol: string;
  baseFare: number;
  perKmRate: number;
  footerText: string;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Pakettt!",
  logoUrl: "FILL_LOGO_URL_HERE",
  brandColor: {
    primary: "#3D2BFF",
    secondary: "#0FB5A6",
    accent: "#FFB020",
  },
  tagline: "Verifiable delivery you can watch happen.",
  heroTitle: "Send packages with a live trust layer.",
  heroSubtitle:
    "Real-time tracking, photo proof at pickup and drop-off, and e-signature on receipt. Every handoff visible and verifiable.",
  heroCtaLabel: "Send a package",
  trustFeatures: [
    {
      title: "Real-time map tracking",
      description: "Always know exactly where your package is on its way.",
    },
    {
      title: "Photo proof at both ends",
      description: "Condition and custody documented at pickup and drop-off.",
    },
    {
      title: "E-signature on receipt",
      description: "Confirms the recipient actually received the package.",
    },
    {
      title: "Fast courier matching",
      description: "Couriers keep earning, customers stay confident.",
    },
  ],
  supportEmail: "support@pakettt.app",
  currencySymbol: "$",
  baseFare: 3.5,
  perKmRate: 1.2,
  footerText: "Pakettt! — verifiable package delivery.",
};
