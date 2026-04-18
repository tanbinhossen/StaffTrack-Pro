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

function LocationMarker({ loc, map }: { loc: any, map: any, key?: string }) {
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

interface AdminPanelProps {
  deferredPrompt: any;
  setDeferredPrompt: (e: any) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ deferredPrompt, setDeferredPrompt }) => {
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'track' | 'details' | 'contact'>('track');
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

  const menuItems = [
    { id: 'home', label: 'Admin Home', icon: Shield },
    { id: 'track', label: 'Live Tracking', icon: Navigation },
    { id: 'details', label: 'User Details', icon: Users },
  ];

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Tap '⋮' and select 'Add to Home Screen'");
    }
  };

  return (
    <div className="flex h-[100dvh] bg-neutral-100 overflow-hidden font-sans relative">
      {/* Top Navigation Bar for Mobile */}
      <header className={`lg:hidden fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-6 transition-all ${
        currentView === 'track' ? 'bg-transparent' : 'bg-white border-b border-neutral-200 shadow-sm'
      }`}>
        <div className={`flex items-center gap-2 transition-opacity ${currentView === 'track' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
           <Shield className="w-5 h-5 text-orange-600" />
           <span className="font-black text-neutral-900 uppercase tracking-tight text-sm">LiveLoc Admin</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2 transition-colors ${currentView === 'track' ? 'bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-neutral-200' : 'text-neutral-800'}`}
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar - Pro Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] w-[280px] bg-neutral-900 text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-orange-600 p-2.5 rounded-2xl">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none text-white">LiveLoc</h1>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-orange-500 mt-1">Satellite Hub</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as any);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all ${
                  currentView === item.id 
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
            
            <button
              onClick={handleInstall}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all text-neutral-400 hover:text-white hover:bg-white/5 mt-4 border border-dashed border-white/10"
            >
              <Navigation className="w-5 h-5" />
              Download App
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5">
          <button 
            onClick={logOut}
            className="w-full flex items-center justify-center gap-3 py-4 text-red-400 hover:text-red-300 transition-colors font-bold text-xs bg-red-400/5 rounded-2xl border border-red-400/10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Control</span>
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
            className="lg:hidden fixed inset-0 bg-neutral-950/60 backdrop-blur-md z-[55]"
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`flex-1 relative z-10 lg:pt-0 h-full overflow-hidden flex flex-col ${currentView === 'track' ? 'pt-0' : 'pt-16'}`}>
        {currentView === 'track' && (
          <div className="flex-1 relative">
            <div className="absolute top-4 left-4 z-20 pointer-events-none lg:block hidden">
               <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-neutral-200 shadow-xl">
                  <p className="text-[10px] font-black text-neutral-900 tracking-widest uppercase">Live Tracking Active</p>
               </div>
            </div>
            
            {/* User List Overlay for Track View (Desktop: Sidebar, Mobile: Horizontal Bottom List) */}
            <div className="absolute bottom-6 left-0 right-0 lg:left-6 lg:right-auto lg:bottom-6 z-20 px-6 lg:px-0">
               <div className="bg-white/90 backdrop-blur-md rounded-[2rem] border border-neutral-200 shadow-2xl overflow-hidden lg:w-72">
                  <div className="p-4 lg:p-5 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                     <p className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Active Personnel</p>
                     <p className="text-[10px] font-bold text-orange-600 lg:hidden">{locations.length} Online</p>
                  </div>
                  
                  {/* Desktop Vertical List / Mobile Horizontal List */}
                  <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto lg:max-h-60 p-2 gap-1 lg:gap-1 scrollbar-hide">
                     {locations.length === 0 ? (
                        <p className="text-[10px] text-neutral-400 italic p-3 w-full text-center">No units active</p>
                     ) : (
                        locations.map(loc => (
                           <button
                             key={loc.id}
                             onClick={() => setSelectedUid(loc.uid)}
                             className={`flex items-center gap-3 p-3 rounded-2xl transition-all shrink-0 lg:shrink ${
                               selectedUid === loc.uid ? 'bg-orange-600 text-white' : 'hover:bg-neutral-100 text-neutral-700'
                             }`}
                           >
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                               selectedUid === loc.uid ? 'bg-white text-orange-600 shadow-sm' : 'bg-neutral-200 text-neutral-500'
                             }`}>
                               {loc.displayName?.[0] || 'U'}
                             </div>
                             <span className="text-xs font-bold truncate max-w-[80px] lg:max-w-none">{loc.displayName}</span>
                             {selectedUid === loc.uid && <div className="w-1.5 h-1.5 bg-white rounded-full lg:block hidden shrink-0" />}
                           </button>
                        ))
                     )}
                  </div>
               </div>
            </div>

            <MapContainer center={[23.685, 90.3563]} zoom={7} className="h-full w-full outline-none">
              <MapView locations={locations} selectedUid={selectedUid} />
            </MapContainer>
          </div>
        )}

        {currentView === 'home' && (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-neutral-50">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-3xl font-[1000] text-neutral-900 mb-2 italic">Operation Overview</h2>
              <p className="text-neutral-500 font-medium mb-12 uppercase tracking-[0.2em] text-[10px]">Command Center Dashboard</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-neutral-100">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Total Units</p>
                  <p className="text-5xl font-black text-neutral-900">{locations.length}</p>
                </div>
                <div className="bg-orange-600 p-8 rounded-[2.5rem] shadow-xl shadow-orange-600/20 text-white">
                  <p className="text-[10px] font-black text-neutral-100/60 uppercase tracking-widest mb-2">Signal Status</p>
                  <p className="text-2xl font-black italic">OPTIMIZED</p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-neutral-100 flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                  <Navigation className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-neutral-900">System Ready</h3>
                  <p className="text-neutral-500 text-sm font-medium">Global satellite synchronization is active and stable.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {currentView === 'details' && (
          <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-neutral-50">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-[1000] text-neutral-900 mb-8 italic">Personnel Data</h2>
              
              <div className="space-y-4">
                {locations.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-neutral-300">
                    <p className="text-neutral-400 font-medium italic">No personnel broadcasting signal.</p>
                  </div>
                ) : (
                  locations.map(loc => (
                    <div key={loc.id} className="bg-white p-6 rounded-[2rem] shadow-md border border-neutral-100 flex items-center justify-between group hover:shadow-xl transition-shadow">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center text-white font-black text-xl">
                          {loc.displayName?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-lg font-black text-neutral-800">{loc.displayName}</p>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">ID: {loc.uid.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-1">Last Contact</p>
                        <p className="text-sm font-medium text-neutral-900">
                          {new Date(loc.timestamp?.toDate ? loc.timestamp.toDate() : loc.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
