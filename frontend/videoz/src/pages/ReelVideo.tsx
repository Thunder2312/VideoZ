import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { toggleLike, postComment, fetchComments } from "../services/VideoService";
import "./ReelVideo.css";

interface ReelVideoProps {
  src: string;
  username: string;
  caption: string;
  likes: number;
  comments: number;
  reelId: string; // UUID
  userId: string; 
}

export const ReelVideo: React.FC<ReelVideoProps> = ({
  src,
  username,
  caption,
  likes: initialLikes,
  comments: initialComments,
  reelId,
  userId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // --- STATE ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false); 
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [commentCount, setCommentCount] = useState(initialComments);
  
  // Comment Section State
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  // Auto-play/pause logic based on visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: 0.6 } // Video must be 60% visible to play
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);


  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!token) return alert("Please login to like!");

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount((prev) => (newLikedState ? prev + 1 : prev - 1));

    try {
      await toggleLike(reelId, token);
    } catch (err) {
      // Revert if API fails
      setLiked(!newLikedState);
      setLikeCount((prev) => (!newLikedState ? prev + 1 : prev - 1));
      console.error("Like failed", err);
    }
  };

  const handleShowComments = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(true);
    

    try {
      const data = await fetchComments(reelId);
      setCommentList(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  const handleSendComment = async () => {
    if (!token) return alert("Please login to comment!");
    if (!newComment.trim()) return;

    try {
      const savedComment = await postComment(reelId, newComment, token);
      
      setCommentList([savedComment, ...commentList]); 
      setCommentCount((prev) => prev + 1);
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  };

  const handleNavigateToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${userId}`);
  };


  return (
    <div className="reel-container">
      <video
        ref={videoRef}
        onClick={togglePlay}
        src={src}
        playsInline
        loop
        className="reel-video-player"
      />

      <div className="reel-gradient-overlay" />

      <div className="reel-sidebar">
        
        {/* Like Button */}
        <div className="sidebar-item" onClick={handleLike}>
          <div className="icon-circle">
            <div className={`icon icon-heart ${liked ? "liked" : ""}`}></div>
          </div>
          <span className="sidebar-text">{likeCount}</span>
        </div>

        <div className="sidebar-item" onClick={handleShowComments}>
          <div className="icon-circle">
             <div className="icon icon-comment"></div>
          </div>
          <span className="sidebar-text">{commentCount}</span>
        </div>

        <div className="sidebar-item">
          
        
        </div>
      </div>

      <div className="reel-info">
        <div className="user-row">
          <div 
            className="avatar" 
            onClick={handleNavigateToProfile}
            style={{cursor: "pointer"}}
          >&#x1F464;</div>
          
          {/* Clickable Username */}
          <div 
            className="username" 
            onClick={handleNavigateToProfile}
            style={{cursor: "pointer"}}
          >
            {username}
          </div>
          
        
        </div>

        <div className="caption-row">
        </div>

        <div className="audio-row">
          <div className="icon-audio"></div>
        </div>
      </div>

      {/* --- COMMENTS POPUP OVERLAY --- */}
      {showComments && (
        <div className="comments-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="comments-header">
            <span>Comments ({commentCount})</span>
            <span 
                onClick={(e) => { e.stopPropagation(); setShowComments(false); }} 
                style={{cursor: "pointer", padding: "5px"}}
            >
                ✕
            </span>
          </div>
          
          <div className="comments-list">
            {commentList.length === 0 ? (
                <div style={{opacity: 0.5, textAlign: "center", marginTop: 20}}>
                    No comments yet. Be the first!
                </div>
            ) : (
                commentList.map((c) => (
                <div key={c.comment_id} className="comment-item">
                    <div style={{display: 'flex', gap: 8}}>
                        <div style={{fontWeight: 'bold', color: '#ccc'}}>@{c.username}</div>
                        <div style={{color: '#777', fontSize: 12}}>{new Date(c.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{marginTop: 2}}>{c.text}</div>
                </div>
                ))
            )}
          </div>

          <div className="comment-input-area">
            <input 
                type="text" 
                className="comment-input" 
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            />
            <button className="comment-send-btn" onClick={handleSendComment}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
};