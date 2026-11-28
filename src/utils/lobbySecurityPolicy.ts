/**
 * Kebijakan Keamanan & Privasi Lobi Daftar/Login Anti-Curi (Zero-Leak Lobby Policy)
 * Default: strictLobbyPrivacyMode = true (ketat & tertutup rapat dari orang asing)
 */

export interface LobbySecurityPolicyConfig {
  strictLobbyPrivacyMode: boolean;
  updatedAt: string;
}

const LOBBY_SECURITY_POLICY_KEY = 'bn_lobby_security_policy_v1';
const LOBBY_SECURITY_EVENT = 'bn:lobby-security-policy-updated';

export const DEFAULT_LOBBY_SECURITY_POLICY: LobbySecurityPolicyConfig = {
  strictLobbyPrivacyMode: true,
  updatedAt: new Date(0).toISOString(),
};

export function loadLobbySecurityPolicy(): LobbySecurityPolicyConfig {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_LOBBY_SECURITY_POLICY };
  }
  try {
    const raw = window.localStorage.getItem(LOBBY_SECURITY_POLICY_KEY);
    if (!raw) return { ...DEFAULT_LOBBY_SECURITY_POLICY };
    const parsed = JSON.parse(raw) as Partial<LobbySecurityPolicyConfig>;
    return {
      strictLobbyPrivacyMode:
        typeof parsed.strictLobbyPrivacyMode === 'boolean'
          ? parsed.strictLobbyPrivacyMode
          : true,
      updatedAt:
        typeof parsed.updatedAt === 'string'
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return { ...DEFAULT_LOBBY_SECURITY_POLICY };
  }
}

export function saveLobbySecurityPolicy(
  patch: Partial<LobbySecurityPolicyConfig>
): LobbySecurityPolicyConfig {
  const current = loadLobbySecurityPolicy();
  const next: LobbySecurityPolicyConfig = {
    strictLobbyPrivacyMode:
      typeof patch.strictLobbyPrivacyMode === 'boolean'
        ? patch.strictLobbyPrivacyMode
        : current.strictLobbyPrivacyMode,
    updatedAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(LOBBY_SECURITY_POLICY_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(LOBBY_SECURITY_EVENT, { detail: next }));
    } catch {
      // ignore storage quota errors
    }
  }
  return next;
}

export function subscribeLobbySecurityPolicy(
  callback: (policy: LobbySecurityPolicyConfig) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleCustom = () => {
    callback(loadLobbySecurityPolicy());
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOBBY_SECURITY_POLICY_KEY) {
      callback(loadLobbySecurityPolicy());
    }
  };
  window.addEventListener(LOBBY_SECURITY_EVENT, handleCustom);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(LOBBY_SECURITY_EVENT, handleCustom);
    window.removeEventListener('storage', handleStorage);
  };
}
