/** Normalize scanned text: accept `LOYALTY:CODE` or bare `CODE`. */
export function normalizeLoyaltyCode(raw: string): string {
  let code = String(raw ?? "").trim().toUpperCase();
  if (code.startsWith("LOYALTY:")) {
    code = code.slice("LOYALTY:".length).trim();
  }
  return code;
}
