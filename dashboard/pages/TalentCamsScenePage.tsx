import { useEffect, useMemo, useState } from "react";
import { Save, Eye, EyeOff, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { Talent, TalentCamsSceneState } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

function createDefaultSceneState(count: number): TalentCamsSceneState {
	return {
		title: "Broadcast Talent",
		talentIds: Array.from({ length: count }, () => null),
		visible: false,
		animation: "idle",
		animationId: 0,
	};
}

function talentLabel(entry: Talent) {
	return `${entry.name}${entry.nickname ? ` (${entry.nickname})` : ""}${entry.role ? ` - ${entry.role}` : ""}`;
}

function TalentCamsScenePageBase({
	talent,
	count,
	sceneLabel,
	previewPath,
	loadScene,
	saveScene,
}: {
	talent: Talent[];
	count: number;
	sceneLabel: string;
	previewPath: string;
	loadScene: () => Promise<TalentCamsSceneState>;
	saveScene: (payload: Partial<TalentCamsSceneState>) => Promise<TalentCamsSceneState>;
}) {
	const [scene, setScene] = useState<TalentCamsSceneState>(() => createDefaultSceneState(count));
	const status = useStatus();

	useEffect(() => {
		loadScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	const sortedTalent = useMemo(
		() => [...talent].sort((left, right) => {
			const byRole = left.role.localeCompare(right.role);
			return byRole !== 0 ? byRole : left.name.localeCompare(right.name);
		}),
		[talent],
	);

	async function pushUpdate(next: Partial<TalentCamsSceneState>) {
		try {
			const response = await saveScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	function setSelectedTalent(index: number, value: string) {
		const nextTalentIds = [...scene.talentIds];
		nextTalentIds[index] = value || null;
		setScene({ ...scene, talentIds: nextTalentIds.slice(0, count) });
	}

	const previewUrl = `${window.location.origin}${previewPath}`;

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">{sceneLabel}</div>
				<div className="subtitle">broadcast scene</div>
			</div>

			<div className="page-content">
				<div className="page-main">
					<div className="panel">
						<div className="panel-title">controls</div>
						<div className="panel-content">
							<button type="button" onClick={() => void pushUpdate({ ...scene, animationId: Date.now() })}>
								<Save />
								Apply
							</button>
							<button
								type="button"
								className="secondary"
								onClick={() => void pushUpdate({ ...scene, visible: true, animation: "in", animationId: Date.now() })}
							>
								<Eye />
								Show
							</button>
							<button
								type="button"
								className="secondary"
								onClick={() => void pushUpdate({ ...scene, visible: false, animation: "out", animationId: Date.now() })}
							>
								<EyeOff />
								Hide
							</button>
							<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
								<ExternalLink />
								Open Scene
							</button>
							<OpenSceneJsonButton data={scene} sceneLabel={sceneLabel} />
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="field">
								<label>Title</label>
								<input value={scene.title} onChange={(event) => setScene({ ...scene, title: event.target.value })} />
							</div>
							<div className="form-grid scene-panel-form">
								{Array.from({ length: count }, (_, slot) => (
									<div className="field" key={slot}>
										<label>Talent Spot {slot + 1}</label>
										<select value={scene.talentIds[slot] ?? ""} onChange={(event) => setSelectedTalent(slot, event.target.value)}>
											<option value="">None</option>
											{sortedTalent.map((entry) => (
												<option key={entry.id} value={entry.id}>
													{talentLabel(entry)}
												</option>
											))}
										</select>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title={`${sceneLabel} preview`} src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}

export function TalentCams3ScenePage({ talent }: { talent: Talent[] }) {
	return (
		<TalentCamsScenePageBase
			talent={talent}
			count={3}
			sceneLabel="Talent Cams 3"
			previewPath="/scenes/talent-cams-3/"
			loadScene={api.getTalentCams3Scene}
			saveScene={api.updateTalentCams3Scene}
		/>
	);
}

export function TalentCams2ScenePage({ talent }: { talent: Talent[] }) {
	return (
		<TalentCamsScenePageBase
			talent={talent}
			count={2}
			sceneLabel="Talent Cams 2"
			previewPath="/scenes/talent-cams-2/"
			loadScene={api.getTalentCams2Scene}
			saveScene={api.updateTalentCams2Scene}
		/>
	);
}

export function TalentCams1ScenePage({ talent }: { talent: Talent[] }) {
	return (
		<TalentCamsScenePageBase
			talent={talent}
			count={1}
			sceneLabel="Talent Cams 1"
			previewPath="/scenes/talent-cams-1/"
			loadScene={api.getTalentCams1Scene}
			saveScene={api.updateTalentCams1Scene}
		/>
	);
}
