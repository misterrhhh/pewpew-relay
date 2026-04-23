import type { MatchMode, VetoType } from "./types.js";

export function createClientId() {
  const cryptoObject = globalThis.crypto as { randomUUID?: () => string } | undefined;

  if (typeof cryptoObject?.randomUUID === "function") {
    return cryptoObject.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatMatchTime(dateValue: string) {
  if (!dateValue) {
    return "";
  }

  const fixedTime = dateValue.match(/^(\d{2}):(\d{2})$/);
  if (fixedTime) {
    return `${fixedTime[1]}:${fixedTime[2]}`;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  const now = new Date();
  const isToday =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();

  if (!isToday) {
    const day = parsed.getDate().toString().padStart(2, "0");
    const month = (parsed.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  }

  return parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function compareMatchDateValues(left: string, right: string) {
  const leftParsed = Date.parse(left.includes("T") ? left : left.replace(" ", "T"));
  const rightParsed = Date.parse(right.includes("T") ? right : right.replace(" ", "T"));

  if (!Number.isNaN(leftParsed) && !Number.isNaN(rightParsed)) {
    return leftParsed - rightParsed;
  }

  return left.localeCompare(right);
}

export function parseMatchDateValue(value: string) {
  const parsed = Date.parse(value.includes("T") ? value : value.replace(" ", "T"));
  return Number.isNaN(parsed) ? null : parsed;
}

export function formatMatchDateLabel(dateValue: string) {
  if (!dateValue) return "";

  if (/^\d{2}:\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;

  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatCountdown(totalMilliseconds: number) {
  const clamped = Math.max(0, totalMilliseconds);
  const totalSeconds = Math.floor(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return [minutes, seconds].map((value) => value.toString().padStart(2, "0")).join(":");
}

export function getNextFixedTimeTimestamp(timeValue: string, now = Date.now()) {
  const match = timeValue.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const target = new Date(now);
  target.setHours(Number(match[1]), Number(match[2]), 0, 0);

  if (target.getTime() <= now) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime();
}

export function getTypeByVetoIndexAndMode(mode: MatchMode, index: number): VetoType {
  if (index >= 6) {
    return "decider";
  }

  if (mode === "bo1") {
    return "ban";
  }

  if (mode === "bo3") {
    return index === 2 || index === 3 ? "pick" : "ban";
  }

  if (mode === "bo5") {
    return index >= 2 && index <= 5 ? "pick" : "ban";
  }

  return "ban";
}

export function formatStat(value: number | null, fractionDigits: number) {
	if (value === null) {
		return "TBD";
	}

	return value.toFixed(fractionDigits);
}
