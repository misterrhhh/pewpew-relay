import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "../relay/style.scss";
import { RelaySceneRoot } from "../relay/RelaySceneRoot";

setupScenePage();

ReactDOM.createRoot(document.getElementById("root")!).render(
	<RelaySceneRoot />,
);
