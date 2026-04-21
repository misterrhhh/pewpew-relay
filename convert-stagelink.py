"""
Converts a stagelink-export.zip into a pewpewrelay-importable zip.
Usage: python3 convert-stagelink.py stagelink-export.zip output.zip
"""

import json
import os
import shutil
import sqlite3
import sys
import tempfile
import zipfile
import urllib.parse
from pathlib import Path


def extract_uuid_from_url(url: str) -> str | None:
    """Extract UUID from a stagelink picture URL like http://host/pictures/UUID?v=..."""
    if not url:
        return None
    path = urllib.parse.urlparse(url).path
    return Path(path).name or None


def find_picture_in_zip(zf: zipfile.ZipFile, uuid: str) -> str | None:
    """Find the actual picture filename for a given UUID (any extension)."""
    for name in zf.namelist():
        stem = Path(name).stem
        if stem == uuid and name.startswith("pictures/"):
            return name
    return None


def build_default_scenes() -> dict:
    return {
        "placeholder": {"title": "Scene Placeholder", "message": "Replace this scene with your final layout when it is ready.", "visible": False, "animation": "idle", "animationId": 0},
        "matches": {"matchIds": [], "visible": False, "animation": "idle", "animationId": 0},
        "matchesCountdown": {"matchIds": [], "countdownMode": "fixedTime", "fixedTime": "18:00", "durationMinutes": 5, "durationStartedAt": None, "visible": False, "animation": "idle", "animationId": 0},
        "pipCountdown": {"matchIds": [], "countdownMode": "fixedTime", "fixedTime": "18:00", "durationMinutes": 5, "durationStartedAt": None, "visible": False, "animation": "idle", "animationId": 0},
        "veto": {"matchId": None, "currentIndex": 0, "visible": False, "animation": "idle", "animationId": 0},
        "vetoL3": {"matchId": None, "currentIndex": 0, "visible": False, "animation": "idle", "animationId": 0},
        "headToHead": {"title": "Head to Head", "left": {"playerId": None, "kills": None, "deaths": None, "adr": None, "rating3": None}, "right": {"playerId": None, "kills": None, "deaths": None, "adr": None, "rating3": None}, "visible": False, "animation": "idle", "animationId": 0},
        "mvp": {"title": "MVP", "player": {"playerId": None, "kills": None, "deaths": None, "adr": None, "rating3": None}, "visible": False, "animation": "idle", "animationId": 0},
        "upperBracket": {"matchIds": [], "visible": False, "animation": "idle", "animationId": 0},
        "lowerBracket": {"matchIds": [], "visible": False, "animation": "idle", "animationId": 0},
        "stakeOdds": {"matchId": None, "swapSides": False, "playId": 0},
        "gridScoreboard": {"matchId": None, "swapSides": False, "visible": False, "animation": "idle", "animationId": 0},
        "lineups": {"teamId": None, "visible": False, "animation": "idle", "animationId": 0},
        "lineupsA": {"teamId": None, "visible": False, "animation": "idle", "animationId": 0},
        "lineupsB": {"teamId": None, "visible": False, "animation": "idle", "animationId": 0},
        "talentCams1": {"title": "Broadcast Talent", "talentIds": [None], "visible": False, "animation": "idle", "animationId": 0},
        "talentCams2": {"title": "Broadcast Talent", "talentIds": [None, None], "visible": False, "animation": "idle", "animationId": 0},
        "talentCams3": {"title": "Broadcast Talent", "talentIds": [None, None, None], "visible": False, "animation": "idle", "animationId": 0},
        "matchAnalysis": {"talentIds": [None, None], "visible": False, "animation": "idle", "animationId": 0},
    }


def convert(input_zip: str, output_zip: str):
    with tempfile.TemporaryDirectory() as tmp:
        images_dir = os.path.join(tmp, "images")
        os.makedirs(images_dir)

        with zipfile.ZipFile(input_zip, "r") as zf:
            data = json.loads(zf.read("data.json"))

            # --- map images and build logo/avatar paths ---
            team_logos: dict[str, str | None] = {}
            for team in data["teams"]:
                uuid = extract_uuid_from_url(team.get("logo", ""))
                if uuid:
                    pic = find_picture_in_zip(zf, uuid)
                    if pic:
                        ext = Path(pic).suffix
                        filename = f"{uuid}{ext}"
                        with zf.open(pic) as src, open(os.path.join(images_dir, filename), "wb") as dst:
                            shutil.copyfileobj(src, dst)
                        team_logos[team["id"]] = f"/images/{filename}"
                    else:
                        team_logos[team["id"]] = None
                else:
                    team_logos[team["id"]] = None

            player_avatars: dict[str, str | None] = {}
            for player in data["players"]:
                uuid = extract_uuid_from_url(player.get("avatar", ""))
                if uuid:
                    pic = find_picture_in_zip(zf, uuid)
                    if pic:
                        ext = Path(pic).suffix
                        filename = f"{uuid}{ext}"
                        if not os.path.exists(os.path.join(images_dir, filename)):
                            with zf.open(pic) as src, open(os.path.join(images_dir, filename), "wb") as dst:
                                shutil.copyfileobj(src, dst)
                        player_avatars[player["id"]] = f"/images/{filename}"
                    else:
                        player_avatars[player["id"]] = None
                else:
                    player_avatars[player["id"]] = None

        # --- build sqlite database ---
        db_path = os.path.join(tmp, "database.sqlite")
        con = sqlite3.connect(db_path)
        con.execute("PRAGMA journal_mode = WAL")
        con.executescript("""
            CREATE TABLE teams (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                short TEXT NOT NULL,
                logo TEXT,
                country TEXT NOT NULL,
                color TEXT NOT NULL
            );
            CREATE TABLE players (
                id TEXT PRIMARY KEY,
                nickname TEXT NOT NULL,
                realname TEXT NOT NULL,
                country TEXT NOT NULL,
                avatar TEXT,
                teamId TEXT,
                steamid TEXT NOT NULL,
                FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL
            );
            CREATE TABLE talent (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                nickname TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'caster',
                social TEXT NOT NULL
            );
            CREATE TABLE maps (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                code TEXT NOT NULL,
                state INTEGER NOT NULL DEFAULT 1
            );
            CREATE TABLE matches (
                id TEXT PRIMARY KEY,
                teamAId TEXT NOT NULL,
                teamBId TEXT NOT NULL,
                stakeId TEXT,
                state TEXT,
                time TEXT NOT NULL,
                mode TEXT NOT NULL,
                title TEXT,
                subtitle TEXT,
                scoreA INTEGER,
                scoreB INTEGER,
                vetos TEXT NOT NULL,
                FOREIGN KEY (teamAId) REFERENCES teams(id),
                FOREIGN KEY (teamBId) REFERENCES teams(id)
            );
        """)

        for team in data["teams"]:
            con.execute(
                "INSERT INTO teams (id, name, short, logo, country, color) VALUES (?, ?, ?, ?, ?, ?)",
                (team["id"], team["name"], team.get("short") or team["name"][:3].upper(), team_logos.get(team["id"]), team.get("country", ""), team.get("color", "#ffffff")),
            )

        for player in data["players"]:
            con.execute(
                "INSERT INTO players (id, nickname, realname, country, avatar, teamId, steamid) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (player["id"], player["nickname"], player.get("realname", ""), player.get("country", ""), player_avatars.get(player["id"]), player.get("teamId"), player.get("steamid", "")),
            )

        # default maps
        con.executemany("INSERT INTO maps (id, name, code, state) VALUES (?, ?, ?, ?)", [
            ("3a278010-6f7c-4ec5-bebd-2f0fc77d1001", "inferno", "de_inferno", 1),
            ("3a278010-6f7c-4ec5-bebd-2f0fc77d1002", "mirage", "de_mirage", 1),
            ("3a278010-6f7c-4ec5-bebd-2f0fc77d1003", "dust2", "de_dust2", 1),
            ("3a278010-6f7c-4ec5-bebd-2f0fc77d1004", "nuke", "de_nuke", 1),
            ("3a278010-6f7c-4ec5-bebd-2f0fc77d1005", "ancient", "de_ancient", 1),
            ("3a278010-6f7c-4ec5-bebd-2f0fc77d1006", "anubis", "de_anubis", 1),
            ("3a278010-6f7c-4ec5-bebd-2f0fc77d1007", "train", "de_train", 0),
            ("3a278010-6f7c-4ec5-bebd-2f0fc77d1008", "overpass", "de_overpass", 0),
            ("3a278010-6f7c-4ec5-bebd-2f0fc77d1009", "vertigo", "de_vertigo", 0),
        ])

        con.commit()
        con.close()

        # --- build scenes.json ---
        scenes_path = os.path.join(tmp, "scenes.json")
        with open(scenes_path, "w") as f:
            json.dump(build_default_scenes(), f, indent=2)

        # --- package output zip ---
        with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zout:
            zout.write(db_path, "db/database.sqlite")
            zout.write(scenes_path, "db/scenes.json")
            for fname in os.listdir(images_dir):
                zout.write(os.path.join(images_dir, fname), f"db/images/{fname}")

        teams_count = len(data["teams"])
        players_count = len(data["players"])
        images_count = len(os.listdir(images_dir))
        print(f"Done: {teams_count} teams, {players_count} players, {images_count} images -> {output_zip}")


if __name__ == "__main__":
    inp = sys.argv[1] if len(sys.argv) > 1 else "stagelink-export.zip"
    out = sys.argv[2] if len(sys.argv) > 2 else "pewpewrelay-import.zip"
    convert(inp, out)
