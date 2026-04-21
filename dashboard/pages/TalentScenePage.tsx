import { useEffect, useMemo, useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { Talent, TalentCamsSceneState } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const SLOT_COUNT = 5;

const defaultSceneState: TalentCamsSceneState = {
	title: "Talent",
	talentIds: Array.from({ length: SLOT_COUNT }, () => null),
	visible: false,
	animation: "idle",
	animationId: 0,
};

function talentLabel(entry: Talent) {
	return `${entry.name}${entry.nickname ? ` (${entry.nickname})` : ""}${entry.role ? ` - ${entry.role}` : ""}`;
}

export function TalentScenePage({ talent }: { talent: Talent[] }) {
	const [scene, setScene] = useState<TalentCamsSceneState>(defaultSceneState);
	const status = useStatus();

	useEffect(() => {
		api.getTalentScene()
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
			const response = await api.updateTalentScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	function setSlot(index: number, value: string) {
		const nextIds = [...scene.talentIds];
		nextIds[index] = value || null;
		setScene({ ...scene, talentIds: nextIds });
	}

	const previewUrl = `${window.location.origin}/scenes/talent/`;
	const jsonUrl = `${window.location.origin}/json/talent`;

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Talent</div>
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
							<OpenSceneJsonButton data={scene} sceneLabel="Talent" url={jsonUrl} />
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="form-grid scene-panel-form">
								{Array.from({ length: SLOT_COUNT }, (_, slot) => (
									<div className="field" key={slot}>
										<label>Spot {slot + 1}</label>
										<select value={scene.talentIds[slot] ?? ""} onChange={(event) => setSlot(slot, event.target.value)}>
											<option value="">Empty</option>
											{sortedTalent.map((entry) => (
												<option key={entry.id} value={entry.id}>
													{talentLabel(entry)}
												</option>
											))}
										</select>
									</div>
								))}
							</div>
							<div className="status">{status.message}</div>
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="Talent scene preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
