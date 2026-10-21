// Legacy pagers may not display Unicode or concatenated SMS. Keep their
// notification payload printable ASCII and within a single GSM-7 segment.
export function formatPagerSms(body: string): string {
  const text = body
    .replace(/https?:\/\/\S+/gi, "See CRM for details.")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/[\[\]{}\\^~|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) throw new Error("Pager message has no printable content");
  return text.length <= 160 ? text : `${text.slice(0, 157).trimEnd()}...`;
}

export function isPagerRecipient(
  phone: string,
  targets: Array<{ phone: string | null; email: string | null }>,
): boolean {
  const digits = phone.replace(/\D/g, "").slice(-10);
  return digits.length === 10 && targets.some((target) =>
    /@usamobility\.net$/i.test(target.email?.trim() || "") &&
    target.phone?.replace(/\D/g, "").slice(-10) === digits
  );
}