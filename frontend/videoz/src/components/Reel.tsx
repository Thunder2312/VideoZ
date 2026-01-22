import React, { useRef, useState, useEffect } from "react";
import './Reel.css'
interface ReelProps {
  src: string;
}

const Reel: React.FC<ReelProps> = ({ src }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  // Toggle mute/unmute
  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto-play when in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 } // 60% visible to play
    );

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, []);

  return (
    <div style={{ marginBottom: 20, position: "relative" }}>
      <video
  ref={videoRef}
  src={src}
  muted={muted}
  loop
  playsInline
  preload="metadata"
  className="reel-video"
/>


      <div style={{ marginTop: 5, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>
      </div>
    </div>
  );
};

export default Reel;
