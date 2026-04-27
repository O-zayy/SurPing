import { useState } from 'react';
import Axios from 'axios';

export default function IpLocator() {
    const [ip, setIp] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const locateIp = async () => {
        setLoading(true);
        try {
            const res = await Axios.get(`https://ipapi.co/${ip ? ip + '/' : ''}json/`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center bg-black overflow-hidden font-body text-white">
            {/* Background Video */}
            <video
                src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
                className="absolute inset-0 w-full h-full object-cover z-0"
                autoPlay
                loop
                muted
                playsInline
            />
            
            {/* Dark Overlays & Gradient Fades */}
            <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none"></div>
            <div className="absolute top-0 left-0 right-0 h-[200px] bg-gradient-to-b from-black to-transparent z-0 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-black to-transparent z-0 pointer-events-none"></div>

            <div className="relative z-10 w-full max-w-[1831px] px-8 md:px-16 flex flex-col items-center mt-32 pb-24">
                
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-16">
                    <div className="liquid-glass rounded-full px-4 py-1.5 mb-8">
                        <span className="text-xs font-medium text-white/90 uppercase tracking-widest">Network Intelligence</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.85] tracking-tight max-w-3xl mb-6">
                        Locate any signal.
                    </h1>
                    
                    <p className="text-sm md:text-base text-white/70 font-light leading-relaxed max-w-xl">
                        Pinpoint coordinates, reveal network architecture, and analyze connection origins in milliseconds.
                    </p>
                </div>

                {/* Search UI */}
                <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-4 mb-16">
                    <div className="liquid-glass flex-1 rounded-full p-2 flex items-center">
                        <input 
                            type="text" 
                            className="flex-1 bg-transparent border-none outline-none text-white px-6 font-light placeholder:text-white/40" 
                            placeholder="Enter IP address (or leave blank for yours)..." 
                            value={ip} 
                            onChange={(e) => setIp(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && locateIp()}
                        />
                    </div>
                    <button 
                        className="liquid-glass-strong rounded-full px-8 py-4 text-sm font-medium text-white flex items-center justify-center hover:bg-white/10 transition-colors whitespace-nowrap"
                        onClick={locateIp}
                        disabled={loading}
                    >
                        {loading ? 'Scanning...' : 'Trace Signal'}
                        {!loading && (
                            <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Results Grid */}
                {data && (
                    <div className="w-full max-w-4xl liquid-glass rounded-3xl p-8 md:p-12 transition-all duration-500">
                        {data.error ? (
                            <div className="text-center text-red-400 font-light">{data.reason || "Invalid IP address provided."}</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                <div className="flex flex-col">
                                    <span className="text-white/50 text-xs uppercase tracking-widest mb-2">IP Address</span>
                                    <span className="text-3xl font-heading italic text-white">{data.ip}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white/50 text-xs uppercase tracking-widest mb-2">Location</span>
                                    <span className="text-3xl font-heading italic text-white leading-tight">{data.city || 'Unknown'}<br/><span className="text-2xl text-white/70">{data.country_name || ''}</span></span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white/50 text-xs uppercase tracking-widest mb-2">Coordinates</span>
                                    <span className="text-3xl font-heading italic text-white leading-tight">{data.latitude}<br/><span className="text-2xl text-white/70">{data.longitude}</span></span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white/50 text-xs uppercase tracking-widest mb-2">Provider</span>
                                    <span className="text-2xl font-heading italic text-white leading-tight">{data.org || 'Unknown'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
