/** 서버에서만 읽는 공개 문의 주소. 개인 주소를 기본값으로 사용하지 않는다. */
export function privacyContactEmail(): string | null {
  const value = process.env.PRIVACY_CONTACT_EMAIL?.trim() ?? "";
  return value.length <= 254 && /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value) ? value : null;
}
