import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",

      // Ranchi
      center: [85.3096, 23.3441],
      zoom: 11,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl(),
      "top-right"
    );

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    />
  );
}