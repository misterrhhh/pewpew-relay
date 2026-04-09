import fs from "node:fs";
import path from "node:path";
import type { Request } from "express";
import type { Match, MatchResponse, Player, PlayerResponse, Team, TeamResponse, Veto, VetoResponse } from "../../shared/types.js";
import { imagesDirectory } from "./paths.js";

export type SerializationContext = {
  playersByTeamId?: Map<string, Player[]>;
  teamsById?: Map<string, Team>;
};

function resolveAssetVersion(assetPath: string) {
  try {
    const assetFile = path.join(imagesDirectory, path.basename(assetPath));
    return fs.statSync(assetFile).mtimeMs.toString();
  } catch {
    return null;
  }
}

export function resolveUrl(req: Request, assetPath: string | null) {
  if (!assetPath) {
    return null;
  }

  const version = resolveAssetVersion(assetPath);
  const suffix = version ? `?v=${encodeURIComponent(version)}` : "";
  return `${req.protocol}://${req.get("host")}${assetPath}${suffix}`;
}

export function serializePlayer(req: Request, player: Player): PlayerResponse {
  return {
    ...player,
    avatarUrl: resolveUrl(req, player.avatar),
  };
}

export function serializeTeam(req: Request, team: Team): TeamResponse {
  return {
    ...team,
    logoUrl: resolveUrl(req, team.logo),
    players: [],
  };
}

export function parseVetos(value: string): Veto[] {
  const parsed = JSON.parse(value) as Veto[];

  if (!Array.isArray(parsed)) {
    throw new Error("Vetos must be an array.");
  }

  return parsed;
}

export function serializeTeamWithPlayers(req: Request, team: Team, players: Player[] = []): TeamResponse {
  return {
    ...serializeTeam(req, team),
    players: players.map((player) => serializePlayer(req, player)),
  };
}

function serializeRelatedTeam(req: Request, teamId: string | null, context: SerializationContext): TeamResponse | null {
  if (!teamId) {
    return null;
  }

  const team = context.teamsById?.get(teamId);
  if (!team) {
    return null;
  }

  return serializeTeamWithPlayers(req, team, context.playersByTeamId?.get(team.id) ?? []);
}

export function serializeVeto(req: Request, veto: Veto, context: SerializationContext): VetoResponse {
  return {
    ...veto,
    picker: serializeRelatedTeam(req, veto.pickerId, context),
    winner: serializeRelatedTeam(req, veto.winnerId, context),
  };
}

export function serializeMatch(req: Request, match: Match, context: SerializationContext): MatchResponse {
  return {
    ...match,
    teamA: serializeRelatedTeam(req, match.teamAId, context),
    teamB: serializeRelatedTeam(req, match.teamBId, context),
    vetos: match.vetos.map((veto) => serializeVeto(req, veto, context)),
  };
}
