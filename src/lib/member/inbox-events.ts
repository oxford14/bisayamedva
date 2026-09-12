export const MEMBER_INBOX_REFRESH = "member-inbox-refresh";

export function dispatchMemberInboxRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MEMBER_INBOX_REFRESH));
}
