export type MatchState = "finished" | "upcoming" | "next" | "live" | null;
export type MatchMode = "bo1" | "bo3" | "bo5";
export type VetoType = "ban" | "pick" | "decider";
export type VetoVisibility = "hidden" | "visible";

export interface Player {
  id: string;
  nickname: string;
  realname: string;
  country: string;
  avatar: string | null;
  teamId: string | null;
  steamid: string;
}

export interface PlayerResponse extends Player {
  avatarUrl: string | null;
}

export interface Team {
  id: string;
  name: string;
  short: string;
  logo: string | null;
  country: string;
  color: string;
}

export interface TeamResponse extends Team {
  logoUrl: string | null;
  players: PlayerResponse[];
}

export interface Caster {
  id: string;
  name: string;
  nickname: string;
  social: string;
}

export interface Veto {
  map: string | null;
  pickerId: string | null;
  type: VetoType;
  winnerId: string | null;
  score: string | null;
  order: number;
  state?: VetoVisibility;
}

export interface Match {
  id: string;
  teamAId: string;
  teamBId: string;
  state: MatchState;
  time: string;
  mode: MatchMode;
  title: string | null;
  subtitle: string | null;
  scoreA?: number | null;
  scoreB?: number | null;
  vetos: Veto[];
}

export interface VetoResponse extends Veto {
  picker: TeamResponse | null;
  winner: TeamResponse | null;
}

export interface MatchResponse extends Omit<Match, "vetos"> {
  teamA: TeamResponse | null;
  teamB: TeamResponse | null;
  vetos: VetoResponse[];
}

export interface PlaceholderSceneState {
  title: string;
  message: string;
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface MatchesSceneState {
  matchIds: string[];
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface MatchesCountdownSceneState {
  matchIds: string[];
  countdownMode: "fixedTime" | "duration";
  fixedTime: string;
  durationMinutes: number;
  durationStartedAt: number | null;
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface SceneStateMap {
  placeholder: PlaceholderSceneState;
  matches: MatchesSceneState;
  matchesCountdown: MatchesCountdownSceneState;
  [key: string]: Record<string, unknown> | PlaceholderSceneState | MatchesSceneState | MatchesCountdownSceneState;
}

export interface SceneUpdateMessage<T = unknown> {
  type: "scene:update";
  scene: string;
  data: T;
}

export type EntityCollection = {
  players: Player;
  teams: Team;
  casters: Caster;
  matches: Match;
};

export type EntityResponseCollection = {
  players: PlayerResponse;
  teams: TeamResponse;
  casters: Caster;
  matches: MatchResponse;
};
