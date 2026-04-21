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

export interface Talent {
  id: string;
  name: string;
  nickname: string;
  role: string;
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
  stakeId: string | null;
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

export interface MatchFeedEntry {
  id: string;
  left: {
    name: string;
    logo: string;
  };
  right: {
    name: string;
    logo: string;
  };
  score: string;
  state: string;
  stateColor: string;
  time: string;
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

export interface MvpSceneState {
  title: string;
  player: HeadToHeadPlayerState;
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface RelaySceneState {
  currentSceneId: string;
  playId: number;
  transitionStyle: "stinger" | "fade";
}

export interface UpperBracketSceneState {
  matchIds: string[];
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface LowerBracketSceneState {
  matchIds: string[];
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface StakeOddsSceneState {
  matchId: string | null;
  swapSides: boolean;
  playId: number;
}

export interface GridSeriesPlayer {
  id: string | null;
  name: string;
  gridName: string;
  realname: string | null;
  avatarUrl: string | null;
  localPlayerId: string | null;
  kills: number | null;
  deaths: number | null;
  assists: number | null;
  adr: number | null;
}

export interface GridSeriesGameTeam {
  id: string | null;
  name: string;
  players: GridSeriesPlayer[];
}

export interface GridSeriesSegment {
  type: string;
  sequenceNumber: number;
}

export interface GridSeriesGame {
  sequenceNumber: number;
  mapName: string | null;
  segments: GridSeriesSegment[];
  teams: GridSeriesGameTeam[];
}

export interface GridSeriesMatchTeam {
  name: string;
  won: boolean;
}

export interface GridSeriesState {
  valid: boolean;
  updatedAt: string | null;
  format: string | null;
  started: boolean;
  finished: boolean;
  teams: GridSeriesMatchTeam[];
  games: GridSeriesGame[];
}

export interface GridScoreboardSceneState {
  matchId: string | null;
  swapSides: boolean;
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface LineupsSceneState {
  teamId: string | null;
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface TalentCamsSceneState {
  title: string;
  talentIds: Array<string | null>;
  visible: boolean;
  animation: string;
  animationId: number;
}

export type TalentDeskSceneState = TalentCamsSceneState;

export interface MatchAnalysisSceneState {
  talentIds: Array<string | null>;
  visible: boolean;
  animation: string;
  animationId: number;
}

export interface StakeOddsResponse {
  matchId: string;
  stakeId: string;
  fixtureName: string | null;
  marketName: string;
  updatedAt: number | null;
  teamAName: string;
  teamBName: string;
  teamAOdds: number | null;
  teamBOdds: number | null;
}

export interface SceneStateMap {
  placeholder: PlaceholderSceneState;
  matches: MatchesSceneState;
  matchesCountdown: MatchesCountdownSceneState;
  pipCountdown: PipCountdownSceneState;
  veto: VetoSceneState;
  vetoL3: VetoSceneState;
  headToHead: HeadToHeadSceneState;
  mvp: MvpSceneState;
  relay: RelaySceneState;
  upperBracket: UpperBracketSceneState;
  lowerBracket: LowerBracketSceneState;
  stakeOdds: StakeOddsSceneState;
  gridScoreboard: GridScoreboardSceneState;
  lineups: LineupsSceneState;
  talentCams1: TalentCamsSceneState;
  talentCams2: TalentCamsSceneState;
  talentCams3: TalentCamsSceneState;
  matchAnalysis: MatchAnalysisSceneState;
  [key: string]:
    | Record<string, unknown>
    | PlaceholderSceneState
    | MatchesSceneState
    | MatchesCountdownSceneState
    | PipCountdownSceneState
    | VetoSceneState
    | HeadToHeadSceneState
    | MvpSceneState
    | RelaySceneState
    | UpperBracketSceneState
    | LowerBracketSceneState
    | StakeOddsSceneState
    | GridScoreboardSceneState
    | LineupsSceneState
    | TalentCamsSceneState
    | MatchAnalysisSceneState;
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
  talent: Talent;
  matches: Match;
};

export type EntityResponseCollection = {
  players: PlayerResponse;
  teams: TeamResponse;
  maps: GameMap;
  talent: Talent;
  matches: MatchResponse;
};
