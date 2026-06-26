import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { Play, Film } from "lucide-react";

type Props = {
  thumbnailUrl?: string | null;
  playbackUrl?: string | null;
  streamUid?: string | null;
  title?: string;
  /** Dışarıdan videoda bir saniyeye atlamak için: seekRef.current?.(saniye) */
  seekRef?: MutableRefObject<((seconds: number) => void) | null>;
};

/**
 * Video önizleme + oynatma. Önce kare/poster gösterir; tıklanınca oynatıcı açılır
 * (otomatik oynatma yok — kullanıcı başlatır). Cloudflare Stream → iframe; yerel → <video>.
 * seekRef ile dışarıdan belirli bir ana atlanabilir (kanıt/timeline tıklaması).
 */
export default function VideoPlayer({ thumbnailUrl, playbackUrl, streamUid, title, seekRef }: Props) {
  const [playing, setPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!seekRef) return;
    seekRef.current = (seconds: number) => {
      setStartTime(seconds);
      setPlaying(true);
      const v = videoRef.current; // zaten oynuyorsa anında atla
      if (v) {
        v.currentTime = seconds;
        v.play().catch(() => {});
      }
    };
    return () => {
      seekRef.current = null;
    };
  }, [seekRef]);

  if (!playbackUrl) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 rounded-lg p-4">
        <Film className="w-4 h-4" /> Video önizleme için Cloudflare Stream yapılandırılmalı.
      </div>
    );
  }

  if (playing) {
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
        {streamUid ? (
          <iframe
            src={`${playbackUrl}?autoplay=true&startTime=${startTime}s`}
            title={title || "Video"}
            className="w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={playbackUrl}
            controls
            autoPlay
            onLoadedMetadata={(e) => {
              if (startTime) e.currentTarget.currentTime = startTime;
            }}
            className="w-full h-full"
          />
        )}
      </div>
    );
  }

  // Önizleme (poster) — tıklanınca baştan oynat
  return (
    <button
      onClick={() => {
        setStartTime(0);
        setPlaying(true);
      }}
      className="group relative aspect-video w-full rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center"
      aria-label="Videoyu oynat"
    >
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt={title || "Önizleme"} className="w-full h-full object-cover opacity-90 group-hover:opacity-70 transition" />
      ) : (
        <video src={`${playbackUrl}#t=2`} preload="metadata" className="w-full h-full object-cover opacity-90 group-hover:opacity-70 transition" muted />
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition">
          <Play className="w-7 h-7 text-blue-600 ml-1" fill="currentColor" />
        </span>
      </span>
    </button>
  );
}
