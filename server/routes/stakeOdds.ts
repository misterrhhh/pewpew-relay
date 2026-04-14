import { Router } from "express";
import type { Database } from "better-sqlite3";
import type { Match, StakeOddsResponse, Team } from "../../shared/types.js";

type StakeOutcome = {
	odds?: unknown;
	name?: unknown;
	active?: unknown;
};

type StakeMarket = {
	name?: unknown;
	status?: unknown;
	updatedAt?: unknown;
	outcomes?: unknown;
};

type StakeGroup = {
	markets?: unknown;
};

type StakePayload = {
	fixture?: {
		name?: unknown;
	} | null;
	groups?: unknown;
};

function normalizeName(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function findTwowayMarket(payload: StakePayload) {
	if (!Array.isArray(payload.groups)) {
		return null;
	}

	for (const group of payload.groups as StakeGroup[]) {
		if (!Array.isArray(group.markets)) {
			continue;
		}

		for (const marketRow of group.markets as unknown[]) {
			if (!Array.isArray(marketRow)) {
				continue;
			}

			for (const entry of marketRow as StakeMarket[]) {
				if (entry?.name === "Match Winner - Twoway") {
					return entry;
				}
			}
		}
	}

	return null;
}

function mapOutcomeToTeam(team: Team, outcomes: StakeOutcome[], usedIndexes: Set<number>) {
	const candidates = [team.name, team.short]
		.filter((value): value is string => typeof value === "string" && value.trim() !== "")
		.map(normalizeName);

	for (const candidate of candidates) {
		const exactIndex = outcomes.findIndex((outcome, index) => {
			if (usedIndexes.has(index) || typeof outcome.name !== "string") {
				return false;
			}

			return normalizeName(outcome.name) === candidate;
		});

		if (exactIndex >= 0) {
			usedIndexes.add(exactIndex);
			return outcomes[exactIndex];
		}
	}

	for (const candidate of candidates) {
		const fuzzyIndex = outcomes.findIndex((outcome, index) => {
			if (usedIndexes.has(index) || typeof outcome.name !== "string") {
				return false;
			}

			const normalized = normalizeName(outcome.name);
			return normalized.includes(candidate) || candidate.includes(normalized);
		});

		if (fuzzyIndex >= 0) {
			usedIndexes.add(fuzzyIndex);
			return outcomes[fuzzyIndex];
		}
	}

	const fallbackIndex = outcomes.findIndex((_outcome, index) => !usedIndexes.has(index));
	if (fallbackIndex >= 0) {
		usedIndexes.add(fallbackIndex);
		return outcomes[fallbackIndex];
	}

	return null;
}

function toOddsValue(value: unknown) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

export function createStakeOddsRouter(getDatabase: () => Database) {
	const router = Router();

	router.get("/:matchId", async (req, res) => {
		try {
			const database = getDatabase();
			const match = database.prepare("SELECT * FROM matches WHERE id = ?").get(req.params.matchId) as Match | undefined;

			if (!match) {
				res.status(404).json({ error: "Match not found." });
				return;
			}

			if (!match.stakeId) {
				res.status(400).json({ error: "Selected match does not have a stakeId." });
				return;
			}

			const teamA = database.prepare("SELECT * FROM teams WHERE id = ?").get(match.teamAId) as Team | undefined;
			const teamB = database.prepare("SELECT * FROM teams WHERE id = ?").get(match.teamBId) as Team | undefined;

			if (!teamA || !teamB) {
				res.status(404).json({ error: "Match teams were not found." });
				return;
			}

			const response = await fetch(`https://odds-data.stake.com/odds/${encodeURIComponent(match.stakeId)}`, {
				headers: {
					accept: "application/json",
					"user-agent": "pewpewrelay/1.0",
				},
				signal: AbortSignal.timeout(10000),
			});

			if (!response.ok) {
				res.status(502).json({ error: `Stake odds request failed with status ${response.status}.` });
				return;
			}

			const payload = await response.json() as StakePayload;
			const market = findTwowayMarket(payload);

			if (!market || !Array.isArray(market.outcomes) || market.outcomes.length < 2) {
				res.status(404).json({ error: 'Market "Match Winner - Twoway" was not found.' });
				return;
			}

			const outcomes = market.outcomes as StakeOutcome[];
			const usedIndexes = new Set<number>();
			const teamAOutcome = mapOutcomeToTeam(teamA, outcomes, usedIndexes);
			const teamBOutcome = mapOutcomeToTeam(teamB, outcomes, usedIndexes);

			const result: StakeOddsResponse = {
				matchId: match.id,
				stakeId: match.stakeId,
				fixtureName: typeof payload.fixture?.name === "string" ? payload.fixture.name : null,
				marketName: typeof market.name === "string" ? market.name : "Match Winner - Twoway",
				updatedAt: typeof market.updatedAt === "number" ? market.updatedAt : null,
				teamAName: teamA.name,
				teamBName: teamB.name,
				teamAOdds: toOddsValue(teamAOutcome?.odds),
				teamBOdds: toOddsValue(teamBOutcome?.odds),
			};

			res.json(result);
		} catch (error) {
			res.status(502).json({ error: (error as Error).message || "Failed to load stake odds." });
		}
	});

	return router;
}
