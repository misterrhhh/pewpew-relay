import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import "../relay/style.scss";
import { RelaySceneRoot } from "../relay/RelaySceneRoot";

document.documentElement.classList.add("scene-page");
document.body.classList.add("scene-page");

ReactDOM.createRoot(document.getElementById("root")!).render(
	<RelaySceneRoot />,
);
