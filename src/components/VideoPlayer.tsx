import { useState } from "react";
import { Play, Film } from "lucide-react";

type Props = {
  thumbnailUrl?: string | null;
  playbackUrl?: string | null;
  streamUid?: string | null;
  title?: string;
};

/**
 * Video önizleme + oynatma. Önce kare/poster gösterir; tıklanınca oynatıcı açılır.
 * Cloudflare Stream → iframe; yerel → <video>. Oynatma yoksa bilgi mesajı.
 */
export default function VideoPlayer({ thumbnailUrl, playbackUrl, streamUid, title }: Props) {
  const [playing, setPlaying] = useState(false);

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
            src={`${playbackUrl}?autoplay=true`}
            title={title || "Video"}
            className="w-full h-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          />
        ) : (
          <video src={playbackUrl} controls autoPlay className="w-full h-full" />
        )}
      </div>
    );
  }

  // Önizleme (poster) — tıklanınca oynat
  return (
    <button
      onClick={() => setPlaying(true)}
      className="group relative aspect-video w-full rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center"
      aria-label="Videoyu oynat"
    >
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt={title || "Önizleme"} className="w-full h-full object-cover opacity-90 group-hover:opacity-70 transition" />
      ) : (
        // Stream thumbnail yoksa (yerel) videonun ilk karesini poster olarak kullan
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
