import type {
  GameMap,
  GridCentralSeries,
  GridScoreboardSceneState,
  GridSeriesState,
  HeadToHeadSceneState,
  LineupsSceneState,
  LowerBracketSceneState,
  MatchesCountdownSceneState,
  MatchesSceneState,
  MatchResponse,
  MvpSceneState,
  PlayerResponse,
  PopupSceneState,
  RosterSceneState,
  SceneStateMap,
  StakeOddsResponse,
  StakeOddsSceneState,
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
  getMatchesScene: () => request<MatchesSceneState>("/api/scenes/matches"),
  updateMatchesScene: (payload: Partial<MatchesSceneState>) =>
    request<MatchesSceneState>("/api/scenes/matches", { method: "POST", body: JSON.stringify(payload) }),
  getMatchesCountdownScene: () => request<MatchesCountdownSceneState>("/api/scenes/matchesCountdown"),
  updateMatchesCountdownScene: (payload: Partial<MatchesCountdownSceneState>) =>
    request<MatchesCountdownSceneState>("/api/scenes/matchesCountdown", { method: "POST", body: JSON.stringify(payload) }),
  getVetoL3Scene: () => request<VetoSceneState>("/api/scenes/vetoL3"),
  updateVetoL3Scene: (payload: Partial<VetoSceneState>) =>
    request<VetoSceneState>("/api/scenes/vetoL3", { method: "POST", body: JSON.stringify(payload) }),
  getHeadToHeadScene: () => request<HeadToHeadSceneState>("/api/scenes/headToHead"),
  updateHeadToHeadScene: (payload: Partial<HeadToHeadSceneState>) =>
    request<HeadToHeadSceneState>("/api/scenes/headToHead", { method: "POST", body: JSON.stringify(payload) }),
  getMvpScene: () => request<MvpSceneState>("/api/scenes/mvp"),
  updateMvpScene: (payload: Partial<MvpSceneState>) =>
    request<MvpSceneState>("/api/scenes/mvp", { method: "POST", body: JSON.stringify(payload) }),
  getUpperBracketScene: () => request<UpperBracketSceneState>("/api/scenes/upperBracket"),
  updateUpperBracketScene: (payload: Partial<UpperBracketSceneState>) =>
    request<UpperBracketSceneState>("/api/scenes/upperBracket", { method: "POST", body: JSON.stringify(payload) }),
  getLowerBracketScene: () => request<LowerBracketSceneState>("/api/scenes/lowerBracket"),
  updateLowerBracketScene: (payload: Partial<LowerBracketSceneState>) =>
    request<LowerBracketSceneState>("/api/scenes/lowerBracket", { method: "POST", body: JSON.stringify(payload) }),
  getStakeOddsScene: () => request<StakeOddsSceneState>("/api/scenes/stakeOdds"),
  updateStakeOddsScene: (payload: Partial<StakeOddsSceneState>) =>
    request<StakeOddsSceneState>("/api/scenes/stakeOdds", { method: "POST", body: JSON.stringify(payload) }),
  getGridScoreboardScene: () => request<GridScoreboardSceneState>("/api/scenes/gridScoreboard"),
  updateGridScoreboardScene: (payload: Partial<GridScoreboardSceneState>) =>
    request<GridScoreboardSceneState>("/api/scenes/gridScoreboard", { method: "POST", body: JSON.stringify(payload) }),
  getLineupsScene: () => request<LineupsSceneState>("/api/scenes/lineups"),
  updateLineupsScene: (payload: Partial<LineupsSceneState>) =>
    request<LineupsSceneState>("/api/scenes/lineups", { method: "POST", body: JSON.stringify(payload) }),
  getLineupsAScene: () => request<LineupsSceneState>("/api/scenes/lineupsA"),
  updateLineupsAScene: (payload: Partial<LineupsSceneState>) =>
    request<LineupsSceneState>("/api/scenes/lineupsA", { method: "POST", body: JSON.stringify(payload) }),
  getLineupsBScene: () => request<LineupsSceneState>("/api/scenes/lineupsB"),
  updateLineupsBScene: (payload: Partial<LineupsSceneState>) =>
    request<LineupsSceneState>("/api/scenes/lineupsB", { method: "POST", body: JSON.stringify(payload) }),
  getTalentScene: () => request<TalentCamsSceneState>("/api/scenes/talent"),
  updateTalentScene: (payload: Partial<TalentCamsSceneState>) =>
    request<TalentCamsSceneState>("/api/scenes/talent", { method: "POST", body: JSON.stringify(payload) }),
  getRosterScene: () => request<RosterSceneState>("/api/scenes/roster"),
  updateRosterScene: (payload: Partial<RosterSceneState>) =>
    request<RosterSceneState>("/api/scenes/roster", { method: "POST", body: JSON.stringify(payload) }),
  getPopupScene: () => request<PopupSceneState>("/api/scenes/popup"),
  updatePopupScene: (payload: Partial<PopupSceneState>) =>
    request<PopupSceneState>("/api/scenes/popup", { method: "POST", body: JSON.stringify(payload) }),
  getStakeOdds: (matchId: string) => request<StakeOddsResponse>(`/api/stake-odds/${matchId}`),
  listGridCentralSeries: () => request<GridCentralSeries[]>("/api/grid-central-series"),
  getGridSeriesState: (seriesId: string) => request<GridSeriesState>(`/api/grid-series-state?seriesId=${encodeURIComponent(seriesId)}`),
  getScene: <K extends keyof SceneStateMap>(sceneId: K) => request<SceneStateMap[K]>(`/api/scenes/${sceneId}`),
  updateScene: <K extends keyof SceneStateMap>(sceneId: K, payload: Partial<SceneStateMap[K]>) =>
    request<SceneStateMap[K]>(`/api/scenes/${sceneId}`, { method: "POST", body: JSON.stringify(payload) }),
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
