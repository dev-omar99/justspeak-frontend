"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

type City = { name: string; lat: number; lng: number };

const CITIES: Record<string, City> = {
  Cairo: { name: "Cairo", lat: 30.0444, lng: 31.2357 },
  Riyadh: { name: "Riyadh", lat: 24.7136, lng: 46.6753 },
  Dubai: { name: "Dubai", lat: 25.2048, lng: 55.2708 },
  Amman: { name: "Amman", lat: 31.9454, lng: 35.9284 },
  Beirut: { name: "Beirut", lat: 33.8938, lng: 35.5018 },
  Baghdad: { name: "Baghdad", lat: 33.3152, lng: 44.3661 },
  Doha: { name: "Doha", lat: 25.2854, lng: 51.531 },
  Kuwait: { name: "Kuwait", lat: 29.3759, lng: 47.9774 },
  Casablanca: { name: "Casablanca", lat: 33.5731, lng: -7.5898 },
  Tunis: { name: "Tunis", lat: 36.8065, lng: 10.1815 },
  Khartoum: { name: "Khartoum", lat: 15.5007, lng: 32.5599 },
  London: { name: "London", lat: 51.5074, lng: -0.1278 },
};

const ROUTE_PAIRS: [string, string][] = [
  ["Cairo", "Riyadh"],
  ["Cairo", "Casablanca"],
  ["Riyadh", "Dubai"],
  ["Beirut", "Amman"],
  ["Baghdad", "Kuwait"],
  ["Cairo", "Khartoum"],
  ["Doha", "Riyadh"],
  ["Cairo", "London"],
  ["Amman", "Doha"],
];

const ARC_COLOR = "#2563EB";
const POINT_COLOR = "#60A5FA";

export default function WorldConnectAnimation() {
  const globeEl = useRef<any>(null);
  const [dims, setDims] = useState({ width: 900, height: 900 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateSize = () => {
      const size = Math.max(window.innerWidth, window.innerHeight) * 1.6;
      setDims({ width: size, height: size });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!mounted || !globeEl.current) return;
    const controls = globeEl.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;
    globeEl.current.pointOfView({ lat: 26, lng: 35, altitude: 1.8 });
  }, [mounted]);

  const points = Object.values(CITIES).map((c) => ({
    lat: c.lat,
    lng: c.lng,
    size: 0.4,
    color: POINT_COLOR,
  }));

  const arcs = ROUTE_PAIRS.map(([a, b]) => ({
    startLat: CITIES[a].lat,
    startLng: CITIES[a].lng,
    endLat: CITIES[b].lat,
    endLng: CITIES[b].lng,
    color: ARC_COLOR,
  }));

  if (!mounted) {
    return <div className="absolute inset-0 bg-surface" />;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/10 via-white/70 to-surface" />

      <div style={{ marginTop: "-15%" }}>
        <Globe
          ref={globeEl}
          width={dims.width}
          height={dims.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          showAtmosphere={true}
          atmosphereColor="#2563EB"
          atmosphereAltitude={0.2}
          pointsData={points}
          pointColor="color"
          pointAltitude={0.01}
          pointRadius="size"
          arcsData={arcs}
          arcColor="color"
          arcDashLength={0.4}
          arcDashGap={2}
          arcDashInitialGap={() => Math.random() * 5}
          arcDashAnimateTime={2500}
          arcStroke={0.4}
          arcAltitudeAutoScale={0.3}
        />
      </div>
    </div>
  );
}