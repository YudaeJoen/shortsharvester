const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";
const AGENT_BASE = "http://127.0.0.1:28765";

export const api = {
  checkHealth: async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await res.json();
    } catch {
      return null;
    }
  },

  checkAgentHealth: async () => {
    try {
      const res = await fetch(`${AGENT_BASE}/healthcheck`);
      return await res.json();
    } catch {
      return null;
    }
  },

  injectDraftToCapCut: async (payload) => {
    const res = await fetch(`${AGENT_BASE}/api/inject-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Local Agent injection failed");
    return await res.json();
  },

  getWorkspaces: async () => {
    const res = await fetch(`${API_BASE}/workspaces`);
    return await res.json();
  },

  collectShorts: async (data) => {
    const res = await fetch(`${API_BASE}/dissector/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  getTasks: async () => {
    const res = await fetch(`${API_BASE}/tasks`);
    return await res.json();
  },

  getCandidates: async (status = "ALL") => {
    const url = status && status !== "ALL" 
      ? `${API_BASE}/candidates?status=${status}` 
      : `${API_BASE}/candidates`;
    const res = await fetch(url);
    return await res.json();
  },

  updateCandidateStatus: async (videoId, status) => {
    const res = await fetch(`${API_BASE}/candidates/${videoId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    return await res.json();
  },

  deleteCandidate: async (videoId) => {
    const res = await fetch(`${API_BASE}/candidates/${videoId}`, {
      method: "DELETE"
    });
    return await res.json();
  },

  blacklistChannel: async (channelId) => {
    const res = await fetch(`${API_BASE}/blacklist/channel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel_id: channelId })
    });
    return await res.json();
  },

  generateOneTake: async (data) => {
    const res = await fetch(`${API_BASE}/onetake/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  getOneTakeResult: async (videoId) => {
    const res = await fetch(`${API_BASE}/onetake/${videoId}`);
    if (!res.ok) return null;
    return await res.json();
  },

  getCapCutBundle: async (videoId) => {
    const res = await fetch(`${API_BASE}/export/bundle/${videoId}`);
    return await res.json();
  },

  getZipDownloadUrl: (videoId) => `${API_BASE}/export/zip/${videoId}`,
  
  getVoices: async () => {
    const res = await fetch(`${API_BASE}/voices`);
    return await res.json();
  },

  getStyles: async () => {
    const res = await fetch(`${API_BASE}/styles`);
    return await res.json();
  },

  // ⑥ 롱투숏
  extractLongToShorts: async (videoUrl, targetDuration = 45, highlightCount = 3) => {
    const res = await fetch(`${API_BASE}/long-to-shorts/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_url: videoUrl,
        target_duration: targetDuration,
        highlight_count: highlightCount
      })
    });
    return await res.json();
  },

  // ⑦ 멀티유즈 SNS 패키지
  generateMultiuse: async (videoId, selectedTitle = null) => {
    const res = await fetch(`${API_BASE}/multiuse/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_id: videoId,
        selected_title: selectedTitle
      })
    });
    return await res.json();
  }
};
