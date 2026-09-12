export function normalizeAnnouncementBody(body: string) {
  return body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
