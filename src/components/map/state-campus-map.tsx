"use client";

import type { CampusPin, CampusProfessorGroup } from "@/lib/us-geography";
import {
  STATE_NAMES,
  STATE_VIEW,
  regionLabel,
} from "@/lib/us-geography";
import {
  geocodeInstitution,
  getMapTilerKey,
  mapTilerStreetsUrl,
} from "@/lib/maptiler";
import { cn } from "@/lib/utils";
import type { Professor } from "@/lib/types";
import { ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";

export function StateCampusMap({
  stateCode,
  campuses: knownCampuses,
  unresolvedProfessors = [],
  selectedCampusId,
  onSelectCampus,
  onBack,
  className,
}: {
  stateCode: string;
  campuses: CampusProfessorGroup[];
  unresolvedProfessors?: Professor[];
  selectedCampusId: string | null;
  onSelectCampus: (id: string | null) => void;
  onBack: () => void;
  className?: string;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const [ready, setReady] = useState(false);
  const [tileMode, setTileMode] = useState<"maptiler" | "osm">("osm");
  const [geocoded, setGeocoded] = useState<CampusProfessorGroup[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const pinCssId = useId().replace(/:/g, "");

  const mapKey = getMapTilerKey();

  // Geocode institutions that aren't in the static campus table
  useEffect(() => {
    if (!mapKey || unresolvedProfessors.length === 0) {
      setGeocoded([]);
      return;
    }

    let cancelled = false;
    setGeocoding(true);

    void (async () => {
      const byInst = new Map<string, Professor[]>();
      for (const p of unresolvedProfessors) {
        const key = p.institution.trim();
        if (!key) continue;
        const list = byInst.get(key) ?? [];
        list.push(p);
        byInst.set(key, list);
      }

      const stateName = STATE_NAMES[stateCode] ?? stateCode;
      const groups: CampusProfessorGroup[] = [];

      for (const [institution, professors] of byInst) {
        const hit = await geocodeInstitution(
          institution,
          stateCode,
          stateName,
          mapKey,
        );
        if (!hit) continue;
        const id = `geo_${institution.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 40)}`;
        const campus: CampusPin = {
          id,
          match: institution.toLowerCase(),
          name: institution,
          city: hit.placeName.split(",")[0]?.trim() || stateName,
          state: stateCode,
          lat: hit.lat,
          lng: hit.lng,
        };
        groups.push({ campus, professors });
      }

      if (!cancelled) {
        setGeocoded(groups);
        setGeocoding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mapKey, unresolvedProfessors, stateCode]);

  const campuses = useMemo(() => {
    const seen = new Set(knownCampuses.map((g) => g.campus.id));
    const merged = [...knownCampuses];
    for (const g of geocoded) {
      if (!seen.has(g.campus.id)) merged.push(g);
    }
    return merged;
  }, [knownCampuses, geocoded]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!mapEl.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current) return;

      if (!document.getElementById(`apple-pin-${pinCssId}`)) {
        const style = document.createElement("style");
        style.id = `apple-pin-${pinCssId}`;
        style.textContent = `
          .apple-maps-root .leaflet-container {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
            background: #e8eef5;
          }
          .apple-maps-root .leaflet-control-attribution {
            background: rgba(255,255,255,0.72);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border-radius: 8px 0 0 0;
            color: #8e8e93;
            font-size: 10px;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          .apple-maps-root .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.06) !important;
            border-radius: 12px !important;
            overflow: hidden;
          }
          .apple-maps-root .leaflet-control-zoom a {
            width: 36px !important;
            height: 36px !important;
            line-height: 36px !important;
            color: #007aff !important;
            background: rgba(255,255,255,0.92) !important;
            border: none !important;
            font-size: 18px !important;
            backdrop-filter: blur(12px);
          }
          .apple-maps-root .leaflet-control-zoom a:hover {
            background: #fff !important;
          }
          .apple-maps-root .leaflet-control-zoom-in {
            border-bottom: 1px solid rgba(60,60,67,0.12) !important;
          }
          .apple-pin { background: transparent; border: none; }
          .apple-pin-inner {
            position: relative;
            width: 28px;
            height: 40px;
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.28));
            transition: transform 180ms cubic-bezier(.2,.8,.2,1);
            transform-origin: bottom center;
          }
          .apple-pin-inner.is-active {
            transform: scale(1.18);
            filter: drop-shadow(0 6px 12px rgba(0,0,0,0.32));
          }
          .apple-pin-inner svg { display: block; width: 28px; height: 40px; }
          .apple-pin-label {
            position: absolute;
            left: 50%;
            bottom: calc(100% + 6px);
            transform: translateX(-50%);
            white-space: nowrap;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 5px 10px;
            border-radius: 980px;
            background: rgba(255,255,255,0.94);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            box-shadow: 0 4px 18px rgba(0,0,0,0.14), 0 0 0 0.5px rgba(0,0,0,0.06);
            color: #1c1c1e;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: -0.01em;
            pointer-events: none;
            opacity: 1;
          }
          .apple-pin-count {
            position: absolute;
            top: 6px;
            left: 50%;
            transform: translateX(-50%);
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            line-height: 1;
            text-shadow: 0 1px 1px rgba(0,0,0,0.2);
          }
        `;
        document.head.appendChild(style);
      }

      const view = STATE_VIEW[stateCode] ?? { lat: 39.8, lng: -98.5, zoom: 5 };
      const map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: true,
        minZoom: 4,
        maxZoom: 18,
      }).setView([view.lat, view.lng], view.zoom);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      if (mapKey) {
        L.tileLayer(mapTilerStreetsUrl(mapKey), {
          tileSize: 512,
          zoomOffset: -1,
          minZoom: 1,
          maxZoom: 18,
          attribution:
            '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">© MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>',
          crossOrigin: true,
        }).addTo(map);
        setTileMode("maptiler");
      } else {
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
        setTileMode("osm");
      }

      mapRef.current = map;
      setReady(true);
    }

    void boot();

    return () => {
      cancelled = true;
      markersRef.current.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setReady(false);
    };
  }, [stateCode, pinCssId, mapKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current) return;

      for (const m of markersRef.current.values()) m.remove();
      markersRef.current.clear();

      const latLngs: [number, number][] = [];

      for (const group of campuses) {
        const { campus, professors } = group;
        const active = selectedCampusId === campus.id;
        const count = professors.length;
        const icon = L.divIcon({
          className: "apple-pin",
          iconSize: [28, 40],
          iconAnchor: [14, 40],
          html: `
            <div class="apple-pin-inner ${active ? "is-active" : ""}">
              <div class="apple-pin-label">${escapeHtml(shortCampusName(campus.name))}</div>
              <svg viewBox="0 0 28 40" aria-hidden="true">
                <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z"
                  fill="${active ? "#ff3b30" : "#ff453a"}"/>
                <circle cx="14" cy="14" r="6" fill="#fff"/>
              </svg>
              ${count > 1 ? `<span class="apple-pin-count">${count}</span>` : ""}
            </div>
          `,
        });

        const marker = L.marker([campus.lat, campus.lng], {
          icon,
          riseOnHover: true,
          zIndexOffset: active ? 800 : 0,
        }).addTo(map);

        marker.on("click", () => {
          onSelectCampus(selectedCampusId === campus.id ? null : campus.id);
        });

        markersRef.current.set(campus.id, marker);
        latLngs.push([campus.lat, campus.lng]);
      }

      if (latLngs.length === 1) {
        map.setView(latLngs[0], 14, { animate: true });
      } else if (latLngs.length > 1) {
        map.fitBounds(L.latLngBounds(latLngs), {
          padding: [64, 64],
          maxZoom: 13,
          animate: true,
        });
      } else {
        const view = STATE_VIEW[stateCode];
        if (view) map.setView([view.lat, view.lng], view.zoom, { animate: true });
      }

      requestAnimationFrame(() => map.invalidateSize());
    })();

    return () => {
      cancelled = true;
    };
  }, [campuses, selectedCampusId, ready, stateCode, onSelectCampus]);

  const selected = campuses.find((c) => c.campus.id === selectedCampusId);

  return (
    <div
      className={cn(
        "apple-maps-root relative overflow-hidden rounded-[18px]",
        className,
      )}
      style={{
        boxShadow:
          "0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06), inset 0 0 0 0.5px rgba(255,255,255,0.6)",
      }}
    >
      <div ref={mapEl} className="h-[min(62vh,520px)] w-full min-h-[320px]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-3 p-3 sm:p-4">
        <button
          type="button"
          onClick={onBack}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-semibold text-[#007aff] transition active:scale-[0.98]"
          style={frost}
        >
          <ChevronLeft className="h-4 w-4" />
          United States
        </button>

        <div className="pointer-events-auto max-w-[55%] rounded-2xl px-3.5 py-2 text-right" style={frost}>
          <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#1c1c1e]">
            {regionLabel(stateCode)}
          </div>
          <div className="text-[11px] text-[#8e8e93]">
            {campuses.length} campus{campuses.length === 1 ? "" : "es"}
            {geocoding ? " · locating…" : ""}
            {" · "}
            {tileMode === "maptiler" ? "MapTiler HD" : "OSM preview"}
          </div>
        </div>
      </div>

      {!mapKey ? (
        <div
          className="pointer-events-auto absolute inset-x-3 bottom-3 z-[1000] rounded-2xl p-3.5 text-left sm:inset-x-4 sm:bottom-4"
          style={frost}
        >
          <div className="text-[13px] font-semibold text-[#1c1c1e]">
            Add a free MapTiler key for sharp campus maps
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[#636366]">
            1) Sign up at{" "}
            <a
              className="text-[#007aff] underline"
              href="https://cloud.maptiler.com/account/keys/"
              target="_blank"
              rel="noreferrer"
            >
              MapTiler Cloud
            </a>{" "}
            → copy API key → 2) Vercel → Project → Settings → Environment
            Variables → add{" "}
            <code className="rounded bg-black/5 px-1 font-mono text-[11px]">
              NEXT_PUBLIC_MAPTILER_KEY
            </code>{" "}
            → Redeploy. Then pins sit on HD streets with building-level detail.
          </p>
        </div>
      ) : null}

      {mapKey && selected ? (
        <div
          className="absolute inset-x-3 bottom-3 z-[1000] animate-in rounded-2xl p-3.5 sm:inset-x-4 sm:bottom-4"
          style={frost}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[15px] font-semibold tracking-[-0.02em] text-[#1c1c1e]">
                {selected.campus.name}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[12px] text-[#8e8e93]">
                <MapPin className="h-3 w-3" />
                {selected.campus.city}, {selected.campus.state}
                <span className="opacity-50">
                  · {selected.campus.lat.toFixed(4)}, {selected.campus.lng.toFixed(4)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onSelectCampus(null)}
              className="rounded-full px-2.5 py-1 text-[12px] font-medium text-[#007aff] hover:bg-black/5"
            >
              Done
            </button>
          </div>
          <ul className="mt-2.5 max-h-36 space-y-1.5 overflow-y-auto">
            {selected.professors.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/professors/${p.id}`}
                  className="block rounded-xl px-2.5 py-2 text-[13px] font-medium text-[#1c1c1e] transition hover:bg-black/[0.04]"
                >
                  {p.name}
                  <div className="text-[11px] font-normal text-[#8e8e93]">
                    {p.title || "Professor"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!ready ? (
        <div className="absolute inset-0 z-[900] flex items-center justify-center bg-[#e8eef5]">
          <div className="text-[13px] text-[#8e8e93]">Loading map…</div>
        </div>
      ) : null}
    </div>
  );
}

const frost: CSSProperties = {
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
};

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shortCampusName(name: string) {
  return name
    .replace(/^University of /i, "U. of ")
    .replace(/ Institute of Technology$/i, " Tech");
}
