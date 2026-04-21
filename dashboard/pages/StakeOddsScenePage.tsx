import { useEffect, useMemo, useState } from "react";
import { Save, ExternalLink, RefreshCw, ArrowLeftRight } from "lucide-react";
import { api } from "../../client/api";
import type { MatchResponse, StakeOddsResponse, StakeOddsSceneState } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const defaultSceneState: StakeOddsSceneState = {
	matchId: null,
	swapSides: false,
	playId: 0,
};

function matchLabel(match: MatchResponse) {
	return `${match.title ?? "Untitled match"} - ${match.teamA?.name ?? "Unknown"} vs ${match.teamB?.name ?? "Unknown"}`;
}

export function StakeOddsScenePage({ matches }: { matches: MatchResponse[] }) {
	const [scene, setScene] = useState<StakeOddsSceneState>(defaultSceneState);
	const [odds, setOdds] = useState<StakeOddsResponse | null>(null);
	const [loadingOdds, setLoadingOdds] = useState(false);
	const [oddsError, setOddsError] = useState("");
	const status = useStatus();

	useEffect(() => {
		api.getStakeOddsScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	const sortedMatches = useMemo(
		() => [...matches].sort((left, right) => right.time.localeCompare(left.time)),
		[matches],
	);
	const selectedMatch = matches.find((match) => match.id === scene.matchId) ?? null;
	const previewUrl = `${window.location.origin}/scenes/stake-odds/`;
	const jsonUrl = `${window.location.origin}/json/stake-odds`;

	async function loadOdds(matchId: string | null) {
		if (!matchId) {
			setOdds(null);
			setOddsError("");
			return;
		}

		setLoadingOdds(true);
		setOddsError("");
		try {
			const nextOdds = await api.getStakeOdds(matchId);
			setOdds(nextOdds);
		} catch (error) {
			setOdds(null);
			setOddsError((error as Error).message);
		} finally {
			setLoadingOdds(false);
		}
	}

	useEffect(() => {
		void loadOdds(scene.matchId);
	}, [scene.matchId]);

	async function pushUpdate(next: Partial<StakeOddsSceneState>) {
		try {
			const response = await api.updateStakeOddsScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Stake Odds</div>
				<div className="subtitle">broadcast scene</div>
			</div>

			<div className="page-content">
				<div className="page-main">
					<div className="panel">
						<div className="panel-title">controls</div>
						<div className="panel-content">
							<button type="button" onClick={() => void pushUpdate(scene)}>
								<Save />
								Apply
							</button>
							<button
								type="button"
								className="secondary"
								onClick={() => setScene((current) => ({ ...current, swapSides: !current.swapSides }))}
							>
								<ArrowLeftRight />
								Swap Sides
							</button>
							<button type="button" className="secondary" onClick={() => void loadOdds(scene.matchId)}>
								<RefreshCw />
								Refresh Odds
							</button>
							<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
								<ExternalLink />
								Open Scene
							</button>
							<OpenSceneJsonButton data={scene} sceneLabel="Stake Odds" url={jsonUrl} />
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="field">
								<label>Match</label>
								<select value={scene.matchId ?? ""} onChange={(event) => setScene({ ...scene, matchId: event.target.value || null })}>
									<option value="">Select match</option>
									{sortedMatches.map((match) => (
										<option key={match.id} value={match.id}>
											{matchLabel(match)}
										</option>
									))}
								</select>
							</div>

							<div className="field">
								<label>Stake source</label>
								<div>{selectedMatch?.stakeId ?? "No stakeId set on this match."}</div>
								<div>Overlay timing is fixed at 2s in and 10s out.</div>
								<div>{scene.swapSides ? "Sides swapped." : "Default side order."}</div>
							</div>

							<div className="field">
								<label>Current market</label>
								{loadingOdds ? <div>Loading odds...</div> : null}
								{!loadingOdds && odds ? (
									<div>
										<div>{odds.marketName}</div>
										<div>Left: {scene.swapSides ? (odds.teamBOdds ?? "-") : (odds.teamAOdds ?? "-")}</div>
										<div>Right: {scene.swapSides ? (odds.teamAOdds ?? "-") : (odds.teamBOdds ?? "-")}</div>
									</div>
								) : null}
								{!loadingOdds && !odds && !oddsError ? <div>No odds loaded.</div> : null}
								{oddsError ? <div>{oddsError}</div> : null}
							</div>
							<div className="status">{status.message}</div>
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="Stake odds scene preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
