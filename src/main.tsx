import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

const TRACK_ATTRIBUTE = "data-track-action";
const pendingActions: string[] = [];

const flushRybbitQueue = () => {
  if (!window.rybbit?.event || pendingActions.length === 0) return false;
  while (pendingActions.length > 0) {
    const action = pendingActions.shift();
    if (action) {
      window.rybbit.event(action);
    }
  }
  return true;
};

const sendAction = (action: string) => {
  if (window.rybbit?.event) {
    window.rybbit.event(action);
    return;
  }
  pendingActions.push(action);
};

const rybbitFlushTimer = window.setInterval(() => {
  if (flushRybbitQueue()) {
    window.clearInterval(rybbitFlushTimer);
  }
}, 1000);

const inputTrackTimers = new Map<Element, number>();

const UTM_SESSION_KEY = "utm_entry_start";
const sendUtmEntryNotification = () => {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const hasUtm = Array.from(params.keys()).some((key) => key.startsWith("utm_"));
  if (!hasUtm) return;
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  const utmPayload = {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_id: params.get("utm_id") || "",
    utm_content: params.get("utm_content") || "",
    utm_term: params.get("utm_term") || "",
  };
  const ua = navigator.userAgent || "";
  const isTablet = /iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua);
  const isMobile = !isTablet && /Mobi|Android|iPhone|iPod/i.test(ua);
  const deviceInfo = isTablet ? "tablet" : isMobile ? "mobil" : "desktop";
  const url = "https://ntfy.sarbu.dev/intrari";
  sessionStorage.setItem(UTM_SESSION_KEY, String(Date.now()));
  const payloadLines = [
    `Intrare UTM`,
    `URL: ${cleanUrl}`,
    `Device: ${deviceInfo}`,
  ];

  if (utmPayload.utm_source) payloadLines.push(`utm_source: ${utmPayload.utm_source}`);
  if (utmPayload.utm_medium) payloadLines.push(`utm_medium: ${utmPayload.utm_medium}`);
  if (utmPayload.utm_campaign) payloadLines.push(`utm_campaign: ${utmPayload.utm_campaign}`);
  if (utmPayload.utm_id) payloadLines.push(`utm_id: ${utmPayload.utm_id}`);
  if (utmPayload.utm_content) payloadLines.push(`utm_content: ${utmPayload.utm_content}`);
  if (utmPayload.utm_term) payloadLines.push(`utm_term: ${utmPayload.utm_term}`);

  const payload = payloadLines.join("\n");

  fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer tk_wxtf5gxetg3aapld1642s4jsdn65a",
      "X-Title": "Intrare cu UTM",
      "Content-Type": "text/plain",
    },
    body: payload,
  }).catch(() => undefined);
};

sendUtmEntryNotification();

const sendUtmExitNotification = () => {
  const startRaw = sessionStorage.getItem(UTM_SESSION_KEY);
  if (!startRaw) return;
  const startTime = Number(startRaw);
  if (!Number.isFinite(startTime)) return;
  const durationSeconds = Math.max(0, Math.round((Date.now() - startTime) / 1000));
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;
  const ua = navigator.userAgent || "";
  const isTablet = /iPad|Tablet|PlayBook|Silk|Android(?!.*Mobile)/i.test(ua);
  const isMobile = !isTablet && /Mobi|Android|iPhone|iPod/i.test(ua);
  const deviceInfo = isTablet ? "tablet" : isMobile ? "mobil" : "desktop";
  const payload = [
    "Iesire UTM",
    `URL: ${cleanUrl}`,
    `Device: ${deviceInfo}`,
    `Durata: ${durationSeconds}s`,
  ].join("\n");

  const url = "https://ntfy.sarbu.dev/iesiri";
  const headers = {
    Authorization: "Bearer tk_wxtf5gxetg3aapld1642s4jsdn65a",
    "X-Title": "Iesire cu UTM",
    "Content-Type": "text/plain",
  };

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "text/plain" });
    navigator.sendBeacon(url, blob);
    return;
  }

  fetch(url, {
    method: "POST",
    headers,
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
};

window.addEventListener("pagehide", () => {
  sendUtmExitNotification();
});

const getTrackValue = (element: Element) => {
  if (element instanceof HTMLInputElement) {
    if (element.type === "checkbox") {
      return element.checked ? "da" : "nu";
    }
    if (element.type === "radio") {
      return element.checked ? element.value : "";
    }
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    return element.value ?? "";
  }
  return "";
};

const scheduleInputTrack = (element: Element, action: string, value: string) => {
  const existing = inputTrackTimers.get(element);
  if (existing) {
    window.clearTimeout(existing);
  }
  const timer = window.setTimeout(() => {
    const safeValue = value.trim();
    sendAction(safeValue ? `${action}: ${safeValue}` : action);
    inputTrackTimers.delete(element);
  }, 600);
  inputTrackTimers.set(element, timer);
};

document.addEventListener(
  "click",
  (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest(`[${TRACK_ATTRIBUTE}]`);
    if (!target) return;
    if (target.matches("input, textarea, select")) return;
    const action = target.getAttribute(TRACK_ATTRIBUTE);
    if (!action) return;
    sendAction(action);
  },
  true
);

document.addEventListener(
  "input",
  (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest(`[${TRACK_ATTRIBUTE}]`);
    if (!target) return;
    if (!target.matches("input, textarea, select")) return;
    const action = target.getAttribute(TRACK_ATTRIBUTE);
    if (!action) return;
    const value = getTrackValue(target);
    if (!value.trim()) return;
    scheduleInputTrack(target, action, value);
  },
  true
);

document.addEventListener(
  "change",
  (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest(`[${TRACK_ATTRIBUTE}]`);
    if (!target) return;
    if (!target.matches("input, textarea, select")) return;
    const action = target.getAttribute(TRACK_ATTRIBUTE);
    if (!action) return;
    const value = getTrackValue(target);
    if (!value.trim()) return;
    scheduleInputTrack(target, action, value);
  },
  true
);

createRoot(document.getElementById("root")!).render(<App />);
