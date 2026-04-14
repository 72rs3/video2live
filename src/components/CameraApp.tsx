import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Download, 
  RefreshCw, 
  Settings2, 
  Image as ImageIcon, 
  X, 
  Check, 
  Circle,
  Zap,
  Maximize2,
  Trash2,
  DownloadCloud,
  Code2,
  Info,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  url: string;
  timestamp: number;
}

const FILTERS = [
  { name: 'Normal', value: 'none' },
  { name: 'Grayscale', value: 'grayscale(100%)' },
  { name: 'Sepia', value: 'sepia(100%)' },
  { name: 'Contrast', value: 'contrast(150%)' },
  { name: 'Vintage', value: 'sepia(50%) brightness(90%) contrast(110%) saturate(120%)' },
  { name: 'Cool', value: 'hue-rotate(180deg) saturate(120%)' },
  { name: 'Invert', value: 'invert(100%)' },
];

export default function CameraApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showNativeGuide, setShowNativeGuide] = useState(false);
  const [isIntentMode, setIsIntentMode] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    // Check if we are in "Intent Mode" via URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('intent') === 'capture' || params.get('mode') === 'spoof') {
      setIsIntentMode(true);
      // Automatically trigger gallery if in spoof mode
      if (params.get('auto') === 'true') {
        setTimeout(() => document.getElementById('video-upload')?.click(), 1000);
      }
    }
  }, []);
  const [virtualVideoUrl, setVirtualVideoUrl] = useState<string | null>(null);
  const [isVirtualMode, setIsVirtualMode] = useState(false);
  const virtualVideoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setError(null);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Could not access camera. Please ensure you have granted permission.');
    }
  }, [facingMode, stream]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const capturePhoto = () => {
    const activeVideo = isVirtualMode ? virtualVideoRef.current : videoRef.current;
    if (!activeVideo || !canvasRef.current) return;

    setIsCapturing(true);
    const video = activeVideo;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // For virtual video, we might need to handle natural dimensions
      const width = video instanceof HTMLVideoElement ? (video.videoWidth || video.clientWidth) : video.clientWidth;
      const height = video instanceof HTMLVideoElement ? (video.videoHeight || video.clientHeight) : video.clientHeight;
      
      canvas.width = width;
      canvas.height = height;

      // Apply filters to canvas
      context.filter = `${activeFilter.value} brightness(${brightness}%) contrast(${contrast}%)`;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const url = canvas.toDataURL('image/jpeg');
      const newPhoto: Photo = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        timestamp: Date.now(),
      };

      setPhotos(prev => [newPhoto, ...prev]);
      
      // Flash effect
      setTimeout(() => setIsCapturing(false), 150);
    }
  };

  const downloadPhoto = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `cam2pic-${id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (virtualVideoUrl) URL.revokeObjectURL(virtualVideoUrl);
      const url = URL.createObjectURL(file);
      setVirtualVideoUrl(url);
      setIsVirtualMode(true);
      // Stop camera if it's running
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const toggleMode = () => {
    if (isVirtualMode) {
      setIsVirtualMode(false);
      startCamera();
    } else {
      // If we have a virtual video, just switch to it
      if (virtualVideoUrl) {
        setIsVirtualMode(true);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      } else {
        // Trigger file upload if no video yet
        document.getElementById('video-upload')?.click();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col md:relative md:w-full md:max-w-4xl md:h-[700px] md:rounded-3xl md:overflow-hidden md:shadow-2xl">
      {/* Top Status Bar - Professional Style */}
      <div className="h-12 bg-black flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", isVirtualMode ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]", "animate-pulse")} />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-white/90">
            {isVirtualMode ? 'VIRTUAL_SOURCE_ACTIVE' : 'SYSTEM_LIVE_FEED'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNativeGuide(true)}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Code2 className="w-3 h-3 text-blue-400" />
            <span className="text-[9px] font-mono text-white/60">NATIVE_SDK</span>
          </button>
        </div>
      </div>

      {/* Viewport Area */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {!isVirtualMode ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              facingMode === 'user' && "scale-x-[-1]"
            )}
            style={{ 
              filter: `${activeFilter.value} brightness(${brightness}%) contrast(${contrast}%)` 
            }}
          />
        ) : (
          <video
            ref={virtualVideoRef}
            src={virtualVideoUrl || undefined}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-all duration-300"
            style={{ 
              filter: `${activeFilter.value} brightness(${brightness}%) contrast(${contrast}%)` 
            }}
          />
        )}
        
        {/* Android 10 Style Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-10">
            <div className="border-r border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-r border-b border-white/40" />
            <div className="border-b border-white/40" />
            <div className="border-r border-white/40" />
            <div className="border-r border-white/40" />
            <div />
          </div>

          {/* Corner Brackets */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-white/20" />
          <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/20" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-white/20" />
          <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-white/20" />
        </div>

        {/* Capture Flash */}
        <AnimatePresence>
          {isCapturing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white z-50"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Controls - Mobile Style */}
      <div className="bg-black/90 backdrop-blur-xl p-8 pb-12 flex flex-col gap-8">
        {/* Filter Scroll */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
          {FILTERS.map((f) => (
            <button
              key={f.name}
              onClick={() => setActiveFilter(f)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-2 transition-all",
                activeFilter.name === f.name ? "scale-110" : "opacity-40"
              )}
            >
              <div 
                className="w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden"
                style={{ filter: f.value, background: 'linear-gradient(45deg, #444, #888)' }}
              />
              <span className="text-[10px] text-white font-mono uppercase">{f.name}</span>
            </button>
          ))}
        </div>

        {/* Main Actions */}
        <div className="flex items-center justify-between px-4">
          <button 
            onClick={() => setShowGallery(true)}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white relative"
          >
            <ImageIcon className="w-6 h-6" />
            {photos.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {photos.length}
              </span>
            )}
          </button>

          {isIntentMode && isVirtualMode ? (
            <button 
              onClick={() => alert("NATIVE_BRIDGE: Media result sent to calling application.")}
              className="px-8 h-16 rounded-full bg-blue-600 text-white font-mono font-bold text-xs tracking-widest animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              SEND_TO_SYSTEM
            </button>
          ) : (
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white/30 p-1 active:scale-90 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-white" />
            </button>
          )}

          <button 
            onClick={isVirtualMode ? toggleMode : () => setFacingMode(p => p === 'user' ? 'environment' : 'user')}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            {isVirtualMode ? <Camera className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
          </button>
        </div>

        {/* Spoof Toggle */}
        <div className="flex justify-center">
          <input type="file" id="video-upload" accept="video/*" className="hidden" onChange={handleVideoUpload} />
          <Button 
            variant="ghost" 
            onClick={toggleMode}
            className={cn(
              "text-[10px] font-mono tracking-widest h-8 px-6 rounded-full border border-white/10",
              isVirtualMode ? "text-blue-400 border-blue-400/30 bg-blue-400/5" : "text-white/40"
            )}
          >
            {isVirtualMode ? 'SPOOF ACTIVE' : 'LOAD GALLERY VIDEO'}
          </Button>
        </div>
      </div>

      {/* Native Implementation Guide Modal */}
      <AnimatePresence>
        {showNativeGuide && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[200] bg-[#121212] flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-blue-500" />
                <h2 className="font-mono font-bold text-sm tracking-widest text-white">ANDROID 10 TRICK GUIDE</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowNativeGuide(false)} className="text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <Smartphone className="w-4 h-4" />
                  <h3 className="text-xs font-bold font-mono">ANDROID 7+ DEPLOYMENT</h3>
                </div>
                <p className="text-blue-100/70 text-[11px] leading-relaxed">
                  For Android 7.0 and above, you <strong>must</strong> use a <code>FileProvider</code> to share media securely. Standard file URIs will cause crashes on newer Android versions.
                </p>
              </div>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold font-mono text-white/40">STEP 1: MANIFEST (FileProvider)</h3>
                  <span className="text-[9px] text-green-500 font-mono">REQUIRED FOR 7.0+</span>
                </div>
                <div className="bg-black p-4 rounded-lg border border-white/5">
                  <pre className="text-[10px] text-green-400 font-mono whitespace-pre-wrap">
{`<!-- Inside <application> -->
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="\${applicationId}.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>`}
                  </pre>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold font-mono text-white/40">STEP 2: JAVA (Secure Sharing)</h3>
                  <span className="text-[9px] text-blue-500 font-mono">CONTENT:// URI</span>
                </div>
                <div className="bg-black p-4 rounded-lg border border-white/5">
                  <pre className="text-[10px] text-blue-300 font-mono whitespace-pre-wrap">
{`public void returnResult(File file) {
    Uri contentUri = FileProvider.getUriForFile(this, 
        getPackageName() + ".fileprovider", file);
        
    Intent result = new Intent();
    result.setData(contentUri);
    result.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    setResult(RESULT_OK, result);
    finish();
}`}
                  </pre>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[10px] font-bold font-mono text-white/40">ANDROID 7+ CHECKLIST</h3>
                <div className="space-y-2">
                  {[
                    "Create res/xml/file_paths.xml",
                    "Use androidx.core.content.FileProvider",
                    "Grant READ_URI_PERMISSION flags",
                    "Handle MediaStore.EXTRA_OUTPUT if present"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold">
                        {i + 1}
                      </div>
                      <span className="text-[11px] text-white/70 font-mono">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
