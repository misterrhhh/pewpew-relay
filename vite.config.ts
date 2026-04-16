import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const sceneEntryRoutes = [
  "/scenes/placeholder",
  "/scenes/relay",
  "/scenes/relay-no-sponsors",
  "/scenes/head-to-head",
  "/scenes/mvp",
  "/scenes/pip-countdown",
  "/scenes/veto",
  "/scenes/veto-l3",
  "/scenes/matches",
  "/scenes/matches-countdown",
  "/scenes/upper-bracket",
  "/scenes/lower-bracket",
  "/scenes/stake-odds",
  "/scenes/grid-scoreboard",
  "/scenes/lineups",
  "/scenes/match-analysis",
  "/scenes/talent-cams-3",
  "/scenes/talent-cams-2",
  "/scenes/talent-cams-1",
  "/scenes/talent-desk",
];

function isHtmlNavigation(pathname: string, acceptHeader?: string) {
  const lastSegment = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const looksLikeFileRequest = lastSegment.includes(".");
  const acceptsHtml = typeof acceptHeader === "string" && acceptHeader.includes("text/html");

  return !looksLikeFileRequest && acceptsHtml;
}

function devRouteRewritePlugin() {
  return {
    name: "dev-route-rewrite",
    configureServer(server: import("vite").ViteDevServer) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) {
          next();
          return;
        }

        const [pathname, search = ""] = req.url.split("?");
        const acceptHeader = req.headers.accept;
        const query = search ? `?${search}` : "";

        if (pathname === "/dashboard" && isHtmlNavigation(pathname, acceptHeader)) {
          _res.statusCode = 302;
          _res.setHeader("Location", `/dashboard/${query}`);
          _res.end();
          return;
        }

        if (sceneEntryRoutes.includes(pathname) && isHtmlNavigation(pathname, acceptHeader)) {
          _res.statusCode = 302;
          _res.setHeader("Location", `${pathname}/${query}`);
          _res.end();
          return;
        }

        if ((pathname === "/dashboard" || pathname.startsWith("/dashboard/")) && isHtmlNavigation(pathname, acceptHeader)) {
          req.url = `/dashboard/index.html${query}`;
          next();
          return;
        }

        if (
          isHtmlNavigation(pathname, acceptHeader)
          && (sceneEntryRoutes.includes(pathname) || sceneEntryRoutes.includes(pathname.replace(/\/$/, "")))
        ) {
          const normalized = pathname.replace(/\/$/, "");
          req.url = `${normalized}/index.html${query}`;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devRouteRewritePlugin()],
  build: {
    outDir: "dist/client",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        dashboard: resolve(__dirname, "dashboard/index.html"),
        placeholder: resolve(__dirname, "scenes/placeholder/index.html"),
        relay: resolve(__dirname, "scenes/relay/index.html"),
        relayNoSponsors: resolve(__dirname, "scenes/relay-no-sponsors/index.html"),
        headToHead: resolve(__dirname, "scenes/head-to-head/index.html"),
        mvp: resolve(__dirname, "scenes/mvp/index.html"),
        pipCountdown: resolve(__dirname, "scenes/pip-countdown/index.html"),
        veto: resolve(__dirname, "scenes/veto/index.html"),
        vetoL3: resolve(__dirname, "scenes/veto-l3/index.html"),
        matches: resolve(__dirname, "scenes/matches/index.html"),
        matchesCountdown: resolve(__dirname, "scenes/matches-countdown/index.html"),
        upperBracket: resolve(__dirname, "scenes/upper-bracket/index.html"),
        lowerBracket: resolve(__dirname, "scenes/lower-bracket/index.html"),
        stakeOdds: resolve(__dirname, "scenes/stake-odds/index.html"),
        gridScoreboard: resolve(__dirname, "scenes/grid-scoreboard/index.html"),
        lineups: resolve(__dirname, "scenes/lineups/index.html"),
        matchAnalysis: resolve(__dirname, "scenes/match-analysis/index.html"),
        talentCams3: resolve(__dirname, "scenes/talent-cams-3/index.html"),
        talentCams2: resolve(__dirname, "scenes/talent-cams-2/index.html"),
        talentCams1: resolve(__dirname, "scenes/talent-cams-1/index.html"),
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:3000",
      "/images": "http://127.0.0.1:3000",
      "/ws": {
        target: "ws://127.0.0.1:3000",
        ws: true,
      },
    },
  },
});
