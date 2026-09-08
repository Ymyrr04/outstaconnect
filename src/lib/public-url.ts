const PUBLIC_SITE_URL = "https://outstaconnect.lovable.app";

// Preview/editor hosts require a login, so always share the public site link.
export const publicLandingUrl = (slug: string) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const isPrivateHost =
    origin.includes("lovableproject.com") ||
    origin.includes("-preview--") ||
    origin.includes("localhost");
  return `${isPrivateHost || !origin ? PUBLIC_SITE_URL : origin}/lp/${slug}`;
};
