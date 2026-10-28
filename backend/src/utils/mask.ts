/**
 * Masks 10-digit Indian mobile number: 9876543210 -> 9876XXXX10
 * Keeps first 4 digits and last 2 digits, masking middle 4 digits with XXXX.
 */
export function maskMobileNumber(mobile: string): string {
  if (!mobile || typeof mobile !== 'string') return '';
  const cleaned = mobile.trim();
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)}XXXX${cleaned.slice(8)}`;
  }
  // Generic fallback if unexpected length
  if (cleaned.length > 4) {
    return `${cleaned.slice(0, 2)}****${cleaned.slice(-2)}`;
  }
  return '******';
}

/**
 * Mask sensitive data in log objects (especially mobile numbers).
 */
export function sanitizeLogPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;

  const clone = { ...payload };
  if (clone.mobileNumber) {
    clone.mobileNumber = maskMobileNumber(clone.mobileNumber);
  }
  if (clone.mobile) {
    clone.mobile = maskMobileNumber(clone.mobile);
  }
  return clone;
}
