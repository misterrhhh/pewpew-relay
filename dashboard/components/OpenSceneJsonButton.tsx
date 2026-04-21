type OpenSceneJsonButtonProps = {
	data: unknown;
	sceneLabel: string;
	className?: string;
	url?: string;
};

function openSceneJsonWindow(sceneLabel: string, data: unknown) {
	const jsonWindow = window.open("", "_blank");
	if (!jsonWindow) {
		return;
	}

	const serialized = JSON.stringify(data, null, 2) ?? "null";
	const documentTitle = `${sceneLabel} JSON`;
	const { document } = jsonWindow;

	document.title = documentTitle;
	document.head.innerHTML = "";
	document.body.innerHTML = "";

	const style = document.createElement("style");
	style.textContent = `
		:root {
			color-scheme: dark;
			font-family: Consolas, "Courier New", monospace;
		}

		body {
			margin: 0;
			background: #111827;
			color: #e5e7eb;
		}

		pre {
			margin: 0;
			padding: 24px;
			white-space: pre-wrap;
			word-break: break-word;
			tab-size: 2;
			line-height: 1.5;
			font-size: 14px;
		}
	`;
	document.head.append(style);

	const pre = document.createElement("pre");
	pre.textContent = serialized;
	document.body.append(pre);
}

export function OpenSceneJsonButton({
	data,
	sceneLabel,
	className,
	url,
}: OpenSceneJsonButtonProps) {
	return (
		<button
			type="button"
			className={className}
			onClick={() => {
				if (url) {
					window.open(url, "_blank");
					return;
				}

				openSceneJsonWindow(sceneLabel, data);
			}}
		>
			Open JSON
		</button>
	);
}
