// Authentication helper functions

export const isAuthenticated = (): boolean => {
  const sessionId = sessionStorage.getItem('sessionId');
  return !!sessionId;
};

export const getSessionId = (): string | null => {
  return sessionStorage.getItem('sessionId');
};

export const clearSession = (): void => {
  sessionStorage.removeItem('sessionId');
  sessionStorage.removeItem('username');
};

export const setAuthHeaders = (headers: HeadersInit = {}): HeadersInit => {
  const sessionId = getSessionId();
  return {
    ...headers,
    ...(sessionId && { 'X-Session-Id': sessionId }),
  };
};