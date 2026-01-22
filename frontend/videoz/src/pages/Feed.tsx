import { useEffect, useState } from "react";
import { fetchVideos } from "../services/VideoService";
import { ReelVideo } from "./ReelVideo";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import "./Feed.css"; 

interface Reel {
  reel_id: string;   
  user_id: string;
  username: string;
  video_url: string;
  caption: string;
  duration: number;
  likes: string;     // Postgres COUNT returns a string
  comments: string;  // Postgres COUNT returns a string
}

export default function Feed() {
  const [videos, setVideos] = useState<Reel[]>([]);
  const navigate = useNavigate();
  const { logout } = useAuth(); 

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const reels = await fetchVideos();
        console.log("Loaded reels:", reels); // Debugging
        setVideos(reels);
      } catch (err) {
        console.error("Failed to fetch reels:", err);
      }
    };
    loadVideos();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/"); 
  };

  return (
    <div style={{ position: "relative" }}>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>

      <div className="feed">
        {videos.map((reel) => (
          <div key={reel.reel_id} className="reel">
            <ReelVideo 
                src={`http://localhost:5000${reel.video_url}`}
                username={reel.username}
                caption={reel.caption}
                // Convert string counts to numbers for the Component
                likes={Number(reel.likes) || 0} 
                comments={Number(reel.comments) || 0}
                reelId={reel.reel_id} 
                userId={reel.user_id} 
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/create")}
        style={{ position: "fixed", bottom: 20, right: 20, fontSize: 24, zIndex: 1000 }}
      >
        +
      </button>
    </div>
  );
}