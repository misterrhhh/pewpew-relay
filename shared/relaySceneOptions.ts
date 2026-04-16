export type RelaySceneId =
	| "clear"
	| "placeholder"
	| "headToHead"
	| "mvp"
	| "pipCountdown"
	| "veto"
	| "vetoL3"
	| "matches"
	| "matchesCountdown"
	| "upperBracket"
	| "lowerBracket"
	| "stakeOdds"
	| "gridScoreboard"
	| "lineups"
	| "matchAnalysis"
	| "talentCams3"
	| "talentCams2"
	| "talentCams1";

export type RelaySceneOption = {
	id: RelaySceneId;
	label: string;
	path: string;
};

export const relaySceneOptions: RelaySceneOption[] = [
	{ id: "clear", label: "Clear", path: "" },
	{ id: "placeholder", label: "Placeholder", path: "/scenes/placeholder/" },
	{ id: "headToHead", label: "Head to Head", path: "/scenes/head-to-head/" },
	{ id: "mvp", label: "MVP", path: "/scenes/mvp/" },
	{ id: "pipCountdown", label: "PIP Countdown", path: "/scenes/pip-countdown/" },
	{ id: "veto", label: "Veto", path: "/scenes/veto/" },
	{ id: "vetoL3", label: "Vetos L3", path: "/scenes/veto-l3/" },
	{ id: "matches", label: "Matches", path: "/scenes/matches/" },
	{ id: "matchesCountdown", label: "Matches Countdown", path: "/scenes/matches-countdown/" },
	{ id: "upperBracket", label: "Upper Bracket", path: "/scenes/upper-bracket/" },
	{ id: "lowerBracket", label: "Lower Bracket", path: "/scenes/lower-bracket/" },
	{ id: "stakeOdds", label: "Stake Odds", path: "/scenes/stake-odds/" },
	{ id: "gridScoreboard", label: "GRID Scoreboard", path: "/scenes/grid-scoreboard/" },
	{ id: "lineups", label: "Lineups", path: "/scenes/lineups/" },
	{ id: "matchAnalysis", label: "Match Analysis", path: "/scenes/match-analysis/" },
	{ id: "talentCams3", label: "Talent Cams 3", path: "/scenes/talent-cams-3/" },
	{ id: "talentCams2", label: "Talent Cams 2", path: "/scenes/talent-cams-2/" },
	{ id: "talentCams1", label: "Talent Cams 1", path: "/scenes/talent-cams-1/" },
];

export const defaultRelaySceneId: RelaySceneId = "placeholder";

export function isRelaySceneId(value: unknown): value is RelaySceneId {
	return relaySceneOptions.some((entry) => entry.id === value);
}

export function getRelaySceneOption(sceneId: RelaySceneId) {
	return relaySceneOptions.find((entry) => entry.id === sceneId) ?? relaySceneOptions[0];
}
