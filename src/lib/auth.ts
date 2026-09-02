export function claimsAreAdmin(claims: Record<string, unknown> | undefined): boolean {
  const appMetadata = claims?.app_metadata;
  return (
    typeof appMetadata === "object" &&
    appMetadata !== null &&
    "role" in appMetadata &&
    appMetadata.role === "admin"
  );
}
