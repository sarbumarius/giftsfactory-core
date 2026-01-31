import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';

type CityPing = {
  lat: number;
  lng: number;
  city: string;
  count: number;
};

interface GlobeHeroProps {
  data: CityPing[];
  className?: string;
  height?: number;
}

// Romania highlight ring data
const romaniaHighlight = [
  { lat: 45.9432, lng: 24.9668, label: 'România' } // Center of Romania
];

const GlobeHero = ({ data, className = '', height }: GlobeHeroProps) => {
  const globeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!globeRef.current) return;

    const rendererEl = globeRef.current;
    let globe: ReturnType<typeof Globe> | null = null;
    let resizeHandler: (() => void) | null = null;

    // Wait a tick for the container to have dimensions
    const timer = setTimeout(() => {
      if (!rendererEl) return;

      const containerWidth = rendererEl.clientWidth || window.innerWidth * 1.4;
      const containerHeight = rendererEl.clientHeight || window.innerHeight * 1.1;

      globe = Globe()
        .width(containerWidth)
        .height(containerHeight)
        .backgroundColor('rgba(0,0,0,0)')
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .hexBinPointWeight('count')
        .hexBinResolution(4)
        .hexMargin(0.2)
        .hexTopColor(() => '#1e1e28')
        .hexSideColor(() => '#0f0f16')
        .hexAltitude(({ sumWeight }) => 0.01 + Math.min(sumWeight / 50, 0.2))
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.25)
        .hexPolygonsData([])
        .pointsData(data)
        .pointLat('lat')
        .pointLng('lng')
        .pointLabel('city')
        .pointColor(() => '#f4f2ff')
        .pointAltitude(() => 0.01)
        .pointRadius(({ count }) => 0.4 + Math.min(count, 20) / 40)
        // Romania highlight - static ring (no animation)
        .ringsData(romaniaHighlight)
        .ringLat('lat')
        .ringLng('lng')
        .ringColor(() => '#c9a962')
        .ringMaxRadius(4)
        .ringPropagationSpeed(0)
        .ringRepeatPeriod(0);

      globe(rendererEl);

      globe.controls().autoRotate = true;
      globe.controls().enableZoom = true;
      globe.controls().enableRotate = true;
      globe.controls().enabled = true;
      globe.controls().enablePan = true;
      globe.controls().rotateSpeed = 0.00001;
      // Position camera to see Romania at the top of the visible hemisphere
      globe.pointOfView({ lat: 20, lng: 25, altitude: 1.6 }, 0);

      resizeHandler = () => {
        if (!rendererEl || !globe) return;
        globe.width(rendererEl.clientWidth);
        globe.height(rendererEl.clientHeight);
      };

      window.addEventListener('resize', resizeHandler);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
      if (rendererEl) {
        rendererEl.innerHTML = '';
      }
    };
  }, [data]);

  return <div ref={globeRef} className={`w-full h-full ${className}`} style={height ? { height } : undefined} />;
};

export default GlobeHero;
