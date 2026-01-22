import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Profile.css";

interface UserProfile {
  username: string;
  post_count: string;
  total_likes: string;
}

interface GridVideo {
  reel_id: string;
  video_url: string;
  likes: string;
}

export default function Profile() {
  const { id } = useParams(); // Get ID from URL
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<GridVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get(`http://localhost:5000/users/${id}`);
        setProfile(userRes.data);

        const videoRes = await axios.get(`http://localhost:5000/users/${id}/videos`);
        setVideos(videoRes.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div style={{color: "white", padding: 20}}>Loading...</div>;
  if (!profile) return <div style={{color: "white", padding: 20}}>User not found</div>;

  return (
    <div className="profile-container">
      {/* Back Button */}
      <div style={{padding: 10}}>
        <button onClick={() => navigate("/feed")} style={{background: "none", border: "none", color: "white", fontSize: 20, cursor: "pointer"}}>← Back</button>
      </div>

      {/* Header */}
      <div className="profile-header">
        <div className="profile-avatar">&#x1F464;</div>
        <div className="profile-info">
          <div className="profile-username">{profile.username}</div>
          <div className="profile-stats">
            <div>
              <span className="stat-value">{profile.post_count}</span> <span className="stat-label">Posts</span>
            </div>
            <div>
              <span className="stat-value">{profile.total_likes}</span> <span className="stat-label">Likes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="video-grid">
        {videos.map((vid) => (
          <div key={vid.reel_id} className="grid-item">
            <video src={`http://localhost:5000${vid.video_url}`} className="grid-video" muted />
            <div className="grid-likes">&#9829; {vid.likes}</div>
          </div>
        ))}
      </div>
      
      {videos.length === 0 && (
        <div style={{textAlign: "center", padding: 40, color: "#666"}}>No videos yet.</div>
      )}
    </div>
  );
}