export type MatchState = "finished" | "upcoming" | "next" | "live" | null;
export type MatchMode = "bo1" | "bo3" | "bo5";
export type VetoType = "ban" | "pick" | "decider";
export type VetoVisibility = "hidden" | "visible";
export type Side = "CT" | "T";

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

export interface GameMap {
  id: string;
  name: string;
  code: string;
  state: boolean;
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
  pickerSide: Side | null;
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

export interface PipCountdownSceneState {
  matchIds: string[];
  countdownMode: "fixedTime" | "duration";
  fixedTime: string;
  durationMinutes: number;
  durationStartedAt: number | null;
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface VetoSceneState {
  matchId: string | null;
  currentIndex: number;
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface HeadToHeadPlayerState {
  playerId: string | null;
  kills: number | null;
  deaths: number | null;
  adr: number | null;
  rating3: number | null;
}

export interface HeadToHeadSceneState {
  title: string;
  left: HeadToHeadPlayerState;
  right: HeadToHeadPlayerState;
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface SceneStateMap {
  placeholder: PlaceholderSceneState;
  matches: MatchesSceneState;
  matchesCountdown: MatchesCountdownSceneState;
  pipCountdown: PipCountdownSceneState;
  veto: VetoSceneState;
  headToHead: HeadToHeadSceneState;
  [key: string]: Record<string, unknown> | PlaceholderSceneState | MatchesSceneState | MatchesCountdownSceneState | PipCountdownSceneState | VetoSceneState | HeadToHeadSceneState;
}

export interface SceneUpdateMessage<T = unknown> {
  type: "scene:update";
  scene: string;
  data: T;
}

export type EntityCollection = {
  players: Player;
  teams: Team;
  maps: GameMap;
  casters: Caster;
  matches: Match;
};

export type EntityResponseCollection = {
  players: PlayerResponse;
  teams: TeamResponse;
  maps: GameMap;
  casters: Caster;
  matches: MatchResponse;
};
