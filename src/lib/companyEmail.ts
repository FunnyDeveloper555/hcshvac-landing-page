export const COMPANY_INVITER_EMAILS: Record<string, string> = {
  "Best Comfort HVAC Joliet Office": "calendar@bestcomforthvac.com",
  "Blue Flame Heating and Cooling": "calendar@blueflameheatingcooling.com",
  "Jerry's Heating and Cooling": "calendar@jerrysheatingcooling.com",
  "PozitiveHVAC": "calendar@pozitivehvac.com",
};

export function getCompanyInviterEmail(
  companyName: string | null | undefined
): string | undefined {
  if (!companyName) return undefined;
  return COMPANY_INVITER_EMAILS[companyName];
}
