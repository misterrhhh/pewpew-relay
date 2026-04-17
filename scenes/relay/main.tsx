import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import SponsorBackground from "../../client/assets/images/BG_SPONSORS.png";
import { RelaySceneRoot } from "./RelaySceneRoot";

setupScenePage();

ReactDOM.createRoot(document.getElementById("root")!).render(
	<RelaySceneRoot sponsorBackgroundUrl={SponsorBackground} />,
);
