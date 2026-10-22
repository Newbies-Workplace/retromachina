// Legacy tokens are read once so existing sign-ins can migrate to the API cookie.
let accessToken = localStorage.getItem("Bearer") ?? "";

export const getAccessToken = () => accessToken;

export function setAccessToken(token: string | null) {
  accessToken = token ?? "";
  localStorage.removeItem("Bearer");
}
