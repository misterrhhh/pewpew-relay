import type {
  GameMap,
  HeadToHeadSceneState,
  LowerBracketSceneState,
  MatchAnalysisSceneState,
  MatchesCountdownSceneState,
  MatchesSceneState,
  MatchResponse,
  PipCountdownSceneState,
  PlaceholderSceneState,
  PlayerResponse,
  Talent,
  TalentCamsSceneState,
  TeamResponse,
  UpperBracketSceneState,
  VetoSceneState,
} from "../shared/types";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormData = init?.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(error?.error ?? `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  listPlayers: () => request<PlayerResponse[]>("/api/players"),
  createPlayer: (payload: unknown) => request<PlayerResponse>("/api/players", { method: "POST", body: JSON.stringify(payload) }),
  updatePlayer: (id: string, payload: unknown) => request<PlayerResponse>(`/api/players/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deletePlayer: (id: string) => request<void>(`/api/players/${id}`, { method: "DELETE" }),
  listTeams: () => request<TeamResponse[]>("/api/teams"),
  createTeam: (payload: unknown) => request<TeamResponse>("/api/teams", { method: "POST", body: JSON.stringify(payload) }),
  updateTeam: (id: string, payload: unknown) => request<TeamResponse>(`/api/teams/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteTeam: (id: string) => request<void>(`/api/teams/${id}`, { method: "DELETE" }),
  listMaps: () => request<GameMap[]>("/api/maps"),
  createMap: (payload: unknown) => request<GameMap>("/api/maps", { method: "POST", body: JSON.stringify(payload) }),
  updateMap: (id: string, payload: unknown) => request<GameMap>(`/api/maps/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteMap: (id: string) => request<void>(`/api/maps/${id}`, { method: "DELETE" }),
  listTalent: () => request<Talent[]>("/api/talent"),
  createTalent: (payload: unknown) => request<Talent>("/api/talent", { method: "POST", body: JSON.stringify(payload) }),
  updateTalent: (id: string, payload: unknown) => request<Talent>(`/api/talent/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteTalent: (id: string) => request<void>(`/api/talent/${id}`, { method: "DELETE" }),
  listMatches: () => request<MatchResponse[]>("/api/matches"),
  createMatch: (payload: unknown) => request<MatchResponse>("/api/matches", { method: "POST", body: JSON.stringify(payload) }),
  updateMatch: (id: string, payload: unknown) => request<MatchResponse>(`/api/matches/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteMatch: (id: string) => request<void>(`/api/matches/${id}`, { method: "DELETE" }),
  getPlaceholderScene: () => request<PlaceholderSceneState>("/api/scenes/placeholder"),
  updatePlaceholderScene: (payload: Partial<PlaceholderSceneState>) =>
    request<PlaceholderSceneState>("/api/scenes/placeholder", { method: "POST", body: JSON.stringify(payload) }),
  getMatchesScene: () => request<MatchesSceneState>("/api/scenes/matches"),
  updateMatchesScene: (payload: Partial<MatchesSceneState>) =>
    request<MatchesSceneState>("/api/scenes/matches", { method: "POST", body: JSON.stringify(payload) }),
  getMatchesCountdownScene: () => request<MatchesCountdownSceneState>("/api/scenes/matchesCountdown"),
  updateMatchesCountdownScene: (payload: Partial<MatchesCountdownSceneState>) =>
    request<MatchesCountdownSceneState>("/api/scenes/matchesCountdown", { method: "POST", body: JSON.stringify(payload) }),
  getPipCountdownScene: () => request<PipCountdownSceneState>("/api/scenes/pipCountdown"),
  updatePipCountdownScene: (payload: Partial<PipCountdownSceneState>) =>
    request<PipCountdownSceneState>("/api/scenes/pipCountdown", { method: "POST", body: JSON.stringify(payload) }),
  getVetoScene: () => request<VetoSceneState>("/api/scenes/veto"),
  updateVetoScene: (payload: Partial<VetoSceneState>) =>
    request<VetoSceneState>("/api/scenes/veto", { method: "POST", body: JSON.stringify(payload) }),
  getVetoL3Scene: () => request<VetoSceneState>("/api/scenes/vetoL3"),
  updateVetoL3Scene: (payload: Partial<VetoSceneState>) =>
    request<VetoSceneState>("/api/scenes/vetoL3", { method: "POST", body: JSON.stringify(payload) }),
  getHeadToHeadScene: () => request<HeadToHeadSceneState>("/api/scenes/headToHead"),
  updateHeadToHeadScene: (payload: Partial<HeadToHeadSceneState>) =>
    request<HeadToHeadSceneState>("/api/scenes/headToHead", { method: "POST", body: JSON.stringify(payload) }),
  getUpperBracketScene: () => request<UpperBracketSceneState>("/api/scenes/upperBracket"),
  updateUpperBracketScene: (payload: Partial<UpperBracketSceneState>) =>
    request<UpperBracketSceneState>("/api/scenes/upperBracket", { method: "POST", body: JSON.stringify(payload) }),
  getLowerBracketScene: () => request<LowerBracketSceneState>("/api/scenes/lowerBracket"),
  updateLowerBracketScene: (payload: Partial<LowerBracketSceneState>) =>
    request<LowerBracketSceneState>("/api/scenes/lowerBracket", { method: "POST", body: JSON.stringify(payload) }),
  getTalentCams1Scene: () => request<TalentCamsSceneState>("/api/scenes/talentCams1"),
  updateTalentCams1Scene: (payload: Partial<TalentCamsSceneState>) =>
    request<TalentCamsSceneState>("/api/scenes/talentCams1", { method: "POST", body: JSON.stringify(payload) }),
  getTalentCams2Scene: () => request<TalentCamsSceneState>("/api/scenes/talentCams2"),
  updateTalentCams2Scene: (payload: Partial<TalentCamsSceneState>) =>
    request<TalentCamsSceneState>("/api/scenes/talentCams2", { method: "POST", body: JSON.stringify(payload) }),
  getTalentCams3Scene: () => request<TalentCamsSceneState>("/api/scenes/talentCams3"),
  updateTalentCams3Scene: (payload: Partial<TalentCamsSceneState>) =>
    request<TalentCamsSceneState>("/api/scenes/talentCams3", { method: "POST", body: JSON.stringify(payload) }),
  getMatchAnalysisScene: () => request<MatchAnalysisSceneState>("/api/scenes/matchAnalysis"),
  updateMatchAnalysisScene: (payload: Partial<MatchAnalysisSceneState>) =>
    request<MatchAnalysisSceneState>("/api/scenes/matchAnalysis", { method: "POST", body: JSON.stringify(payload) }),
  getTalentDeskScene: () => request<TalentCamsSceneState>("/api/scenes/talentCams3"),
  updateTalentDeskScene: (payload: Partial<TalentCamsSceneState>) =>
    request<TalentCamsSceneState>("/api/scenes/talentCams3", { method: "POST", body: JSON.stringify(payload) }),
};

export async function uploadImage(id: string, file: File) {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("image", file);
  return request<{ id: string; path: string }>("/api/upload", { method: "POST", body: formData });
}

export async function exportSystem() {
  const response = await fetch("/api/system/export");
  if (!response.ok) {
    throw new Error("Export failed.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "broadcast-control-export.zip";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function importSystem(file: File) {
  const formData = new FormData();
  formData.append("archive", file);
  return request<{ ok: boolean }>("/api/system/import", { method: "POST", body: formData });
}
