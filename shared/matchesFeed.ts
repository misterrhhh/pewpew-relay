import type { MatchFeedEntry, MatchResponse } from "./types.js";
import { formatMatchTime } from "./utils.js";

const matchStateLabels: Record<NonNullable<MatchResponse["state"]>, string> = {
	finished: "FINISHED",
	upcoming: "UPCOMING",
	next: "NEXT",
	live: "LIVE",
};

const matchStateColors: Record<NonNullable<MatchResponse["state"]>, string> = {
	finished: "#b6b6b6",
	upcoming: "#FFFFFF",
	next: "#FFD700",
	live: "#FF3B30",
};

function formatMatchScore(match: MatchResponse) {
	if (match.scoreA === null || match.scoreA === undefined || match.scoreB === null || match.scoreB === undefined) {
		return "VS";
	}

	return `${match.scoreA} - ${match.scoreB}`;
}

export function toMatchFeedEntry(match: MatchResponse): MatchFeedEntry {
	return {
		id: match.id,
		left: {
			name: match.teamA?.name ?? "TBD",
			logo: match.teamA?.logoUrl ?? "",
		},
		right: {
			name: match.teamB?.name ?? "TBD",
			logo: match.teamB?.logoUrl ?? "",
		},
		score: formatMatchScore(match),
		state: match.state ? matchStateLabels[match.state] : "",
		stateColor: match.state ? matchStateColors[match.state] : "#FFFFFF",
		time: formatMatchTime(match.time),
	};
}
