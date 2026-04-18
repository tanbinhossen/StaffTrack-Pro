import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, LogOut, Navigation, Menu, X, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AnimatePresence, motion } from 'motion/react';

// Fix Leaflet marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

async function getAddress(lat: number, lng: number) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
    const data = await response.json();
    return data.display_name;
  } catch (error) {
    return "Address not found";
  }
}

function LocationMarker({ loc, map }: { loc: any, map: any }) {
  const [address, setAddress] = useState<string>("Loading address...");

  const fetchAddress = async () => {
    const addr = await getAddress(loc.latitude, loc.longitude);
    setAddress(addr);
  };

  return (
    <Marker 
      position={[loc.latitude, loc.longitude]}
      eventHandlers={{
        click: () => {
          map.flyTo([loc.latitude, loc.longitude], 16);
          fetchAddress();
        },
      }}
    >
      <Popup onOpen={fetchAddress}>
        <div className="p-2 min-w-[200px] max-w-[250px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-orange-100 italic">
              {loc.displayName?.[0] || 'U'}
            </div>
            <div>
              <p className="font-bold text-neutral-800 leading-tight">{loc.displayName || 'Anonymous User'}</p>
              <p className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">Active Now</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <div>
              <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Location Name / Address</p>
              <p className="text-xs text-neutral-700 leading-snug font-medium mt-0.5">{address}</p>
            </div>
            <div>
              <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Coordinates</p>
              <p className="text-[10px] font-mono text-neutral-500">{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</p>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function MapView({ locations, selectedUid }: { locations: any[], selectedUid: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (selectedUid) {
      const selected = locations.find(l => l.uid === selectedUid);
      if (selected) {
        map.flyTo([selected.latitude, selected.longitude], 16);
      }
    }
  }, [selectedUid, locations, map]);

  return (
    <>
      <TileLayer
        attribution='Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
      />
      {locations.map((loc) => (
        <LocationMarker key={loc.id} loc={loc} map={map} />
      ))}
    </>
  );
}

const AdminPanel: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logOut } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'locations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLocations(locs);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex h-screen bg-neutral-100 overflow-hidden font-sans relative">
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 bg-orange-600 text-white p-4 rounded-full shadow-2xl active:scale-95 transition-transform"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Users className="w-6 h-6" />}
      </button>

      {/* Sidebar - Responsive */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-neutral-200 flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-600 p-2.5 rounded-2xl shadow-lg shadow-orange-600/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-neutral-900 tracking-tight leading-none">LiveLoc</h1>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-orange-600 mt-1">Admin Console</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Live Units</p>
              <p className="text-2xl font-black text-neutral-900">{locations.length}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Tracked Personnel</p>
          {locations.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-neutral-300 text-sm italic">No users active</p>
            </div>
          ) : (
            locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => {
                  setSelectedUid(loc.uid);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center gap-4 ${
                  selectedUid === loc.uid 
                  ? 'bg-orange-50 border-orange-200 shadow-sm' 
                  : 'bg-white border-transparent hover:bg-neutral-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${
                  selectedUid === loc.uid ? 'bg-orange-500' : 'bg-neutral-200 text-neutral-500'
                }`}>
                  {loc.displayName?.[0] || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-neutral-800 truncate leading-tight">{loc.displayName || 'Anonymous User'}</p>
                  <p className="text-[10px] text-neutral-400 truncate font-medium">
                    {new Date(loc.timestamp?.toDate ? loc.timestamp.toDate() : loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {selectedUid === loc.uid && (
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 mt-auto">
          <button 
            onClick={logOut}
            className="w-full flex items-center justify-center gap-2 py-3 text-neutral-500 hover:text-red-500 transition-colors font-bold text-sm bg-neutral-50 rounded-xl border border-neutral-100 hover:bg-red-50 hover:border-red-100 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>

      {/* Main Map Area */}
      <main className="flex-1 relative z-10">
        <div className="absolute top-4 left-4 right-4 lg:left-6 lg:right-auto z-20 pointer-events-none">
           <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-neutral-200 shadow-xl flex items-center justify-between lg:justify-start gap-4 inline-flex">
              <div className="flex items-center gap-2.5">
                <Navigation className="w-4 h-4 text-orange-600 animate-pulse" />
                <p className="text-xs font-black text-neutral-900 tracking-tight">Active Satellite Stream</p>
              </div>
              <div className="h-4 w-px bg-neutral-200 hidden lg:block" />
              <p className="text-[10px] font-bold text-neutral-500 lg:block hidden">SECURE LINK: {locations.length} NODES</p>
           </div>
        </div>

        <MapContainer center={[23.685, 90.3563]} zoom={7} className="h-full w-full">
          <MapView locations={locations} selectedUid={selectedUid} />
        </MapContainer>
      </main>
    </div>
  );
};

export default AdminPanel;
