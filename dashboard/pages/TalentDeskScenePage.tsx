import { useEffect, useMemo, useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { Talent, TalentDeskSceneState } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const defaultSceneState: TalentDeskSceneState = {
	title: "Broadcast Talent",
	talentIds: [null, null, null],
	visible: false,
	animation: "idle",
	animationId: 0,
};

function talentLabel(entry: Talent) {
	return `${entry.name}${entry.nickname ? ` (${entry.nickname})` : ""}${entry.role ? ` - ${entry.role}` : ""}`;
}

export function TalentDeskScenePage({ talent }: { talent: Talent[] }) {
	const [scene, setScene] = useState<TalentDeskSceneState>(defaultSceneState);
	const status = useStatus();

	useEffect(() => {
		api.getTalentDeskScene()
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

	async function pushUpdate(next: Partial<TalentDeskSceneState>) {
		try {
			const response = await api.updateTalentDeskScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	function setSelectedTalent(index: number, value: string) {
		const nextTalentIds = [...scene.talentIds];
		nextTalentIds[index] = value || null;
		setScene({ ...scene, talentIds: nextTalentIds });
	}

	const previewUrl = `${window.location.origin}/scenes/talent-desk/`;
	const jsonUrl = `${window.location.origin}/json/talent-desk`;

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Talent Desk Scene</div>
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
							<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
								<ExternalLink />
								Open Scene
							</button>
							<OpenSceneJsonButton data={scene} sceneLabel="Talent Desk Scene" url={jsonUrl} />
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
								{Array.from({ length: 3 }, (_, slot) => (
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
						<IframePreview title="Talent desk scene preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
