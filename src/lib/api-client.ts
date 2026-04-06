const API_BASE = "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kidsai_token");
}

export function setToken(token: string) {
  localStorage.setItem("kidsai_token", token);
}

export function clearToken() {
  localStorage.removeItem("kidsai_token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

export async function signup(email: string, password: string, coppaConsent: boolean) {
  const data = await apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, coppaConsent }),
  });
  setToken(data.token);
  return data;
}

export async function login(email: string, password: string) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return data;
}

export async function getMe() {
  return apiFetch("/api/auth/me");
}

export async function getChildren() {
  return apiFetch("/api/children");
}

export async function createChild(displayName: string) {
  return apiFetch("/api/children", {
    method: "POST",
    body: JSON.stringify({ displayName }),
  });
}

export async function getSessions(childId?: string) {
  const params = childId ? `?childId=${childId}` : "";
  return apiFetch(`/api/sessions${params}`);
}

export async function createSession(childId: string) {
  return apiFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ childId }),
  });
}

export async function sendMessage(
  message: string,
  accessToken: string,
  onChunk: (content: string) => void,
  onDone: () => void,
  onError: (error: string) => void,
  onSessionEnd?: (message: string) => void
) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, accessToken }),
  });

  if (!res.ok) {
    const data = await res.json();
    if (res.status === 410 && data.message) {
      onSessionEnd?.(data.message);
      return;
    }
    onError(data.error || "Something went wrong");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError("No response stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          if (parsed.sessionEnded) {
            onSessionEnd?.(parsed.message);
          }
          if (parsed.content) {
            onChunk(parsed.content);
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  }
  onDone();
}
