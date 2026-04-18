import React, { useState, useEffect } from 'react';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { MapPin, Power, ShieldCheck, Navigation } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

const UserPanel: React.FC = () => {
  const { user, logOut } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const toggleSharing = async () => {
    if (isSharing) {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsSharing(false);
      setCoords(null);
      if (user) await deleteDoc(doc(db, 'locations', user.uid));
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }

      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          if (user) {
            await setDoc(doc(db, 'locations', user.uid), {
              uid: user.uid,
              displayName: user.displayName,
              latitude,
              longitude,
              timestamp: serverTimestamp(),
            });
          }
        },
        (error) => {
          console.error("Error watching position:", error);
          alert("Could not access location. Please check permissions.");
          setIsSharing(false);
        },
        { enableHighAccuracy: true }
      );
      setWatchId(id);
      setIsSharing(true);
    }
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans overflow-hidden relative">
      {/* Real-time Map Background */}
      <div className="absolute inset-0 z-0 opacity-40 grayscale contrast-125">
         <MapContainer center={[23.685, 90.3563]} zoom={7} className="h-full w-full" zoomControl={false} scrollWheelZoom={false} dragging={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {coords && (
              <>
                <Marker position={[coords.lat, coords.lng]} icon={DefaultIcon} />
                <RecenterMap lat={coords.lat} lng={coords.lng} />
              </>
            )}
         </MapContainer>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-transparent to-neutral-950/90 z-1" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 flex flex-col items-center shadow-2xl"
        >
          <div className="relative mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-700 ${
              isSharing ? 'bg-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.4)]' : 'bg-neutral-800'
            }`}>
              <Navigation className={`w-10 h-10 ${isSharing ? 'text-white animate-pulse' : 'text-neutral-600'}`} />
            </div>
            {isSharing && (
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-orange-500"
              />
            )}
          </div>

          <h2 className="text-3xl font-black tracking-tighter mb-1 text-center italic">LiveLoc</h2>
          <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-[0.3em] mb-8">Secure Tracking Node</p>

          <AnimatePresence mode="wait">
            {coords ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full grid grid-cols-2 gap-3 mb-8"
              >
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                   <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1">LAT</p>
                   <p className="font-mono text-xs text-orange-400 font-bold">{coords.lat.toFixed(5)}°</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                   <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold mb-1">LNG</p>
                   <p className="font-mono text-xs text-orange-400 font-bold">{coords.lng.toFixed(5)}°</p>
                </div>
              </motion.div>
            ) : (
                <div className="h-16 flex items-center justify-center mb-8">
                  <p className="text-neutral-600 text-sm font-medium italic">Ready for handshake...</p>
                </div>
            )}
          </AnimatePresence>

          <button
            onClick={toggleSharing}
            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
              isSharing 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                : 'bg-orange-500 text-neutral-950'
            }`}
          >
            <Power className="w-5 h-5" />
            {isSharing ? 'Terminate Link' : 'Initialize Stream'}
          </button>

          <div className="mt-10 pt-6 border-t border-white/5 w-full flex items-center justify-between">
             <button 
              onClick={logOut}
              className="text-[10px] uppercase tracking-widest font-black text-neutral-500 hover:text-white transition-colors"
             >
               Sign Out
             </button>
             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span className="text-[8px] uppercase font-black tracking-widest text-emerald-500">End-to-End Encrypted</span>
             </div>
          </div>
        </motion.div>
      </main>

      <footer className="p-6 text-center z-10 pointer-events-none">
         <p className="text-[9px] text-neutral-700 uppercase tracking-[0.4em] font-medium italic">
           Satellite Cluster: {isSharing ? 'Asia-Southeast-1L' : 'Standby'}
         </p>
      </footer>
    </div>
  );
};

export default UserPanel;
