import React, { useRef, useState, type ChangeEvent } from "react";
import { useAuth } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const VideoCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // FIX: Use ref for chunks to avoid stale state in callbacks
  const chunksRef = useRef<BlobPart[]>([]);
  
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const [caption, setCaption] = useState("");
  const navigate = useNavigate();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      
      // Reset chunks
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        // FIX: Read from chunksRef.current instead of state
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        console.log("Recorded Blob Size:", blob.size); // Debug log
        setRecordedBlob(blob);
        
        // Stop camera stream
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      alert("Camera access denied or error starting");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!token) return alert("Login required");
    
    // Prioritize file upload, otherwise use recorded video
    const videoToUpload = file || recordedBlob;
    
    if (!videoToUpload) return alert("No video to upload!");

    // Double check size
    if (videoToUpload.size === 0) return alert("Error: Video is empty. Please record again.");

    setLoading(true);
    try {
      const formData = new FormData();
      // Ensure we send a filename with extension so backend recognizes it
      if (file) {
        formData.append("video", file);
      } else {
        
        formData.append("video", videoToUpload, "capture.webm");
      }
      
      formData.append("caption", caption);
      
      await axios.post("http://localhost:5000/upload", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/feed");
    } catch (err) {
      console.error(err);
      alert("Upload failed. Check server console.");
    } finally {
      setLoading(false);
    }
  };

  
  if (recordedBlob || file) {
    const previewUrl = file ? URL.createObjectURL(file) : (recordedBlob ? URL.createObjectURL(recordedBlob) : "");
    
    return (
      <div style={{ height: "100vh", background: "#000", display: "flex", flexDirection: "column" }}>
        <video src={previewUrl} autoPlay loop controls style={{ flex: 1, objectFit: "contain", width: "100%" }} />
        
        <div style={{ padding: 20, background: "#111", borderTop: "1px solid #333" }}>
          <input
            type="text"
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "none", marginBottom: 15, background: "#222", color: "white" }}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={() => { setFile(null); setRecordedBlob(null); }} 
              style={{ flex: 1, padding: 12, background: "#333", color: "#fff", borderRadius: 8, border: "none", cursor: "pointer" }}
            >
              Retake
            </button>
            <button 
              onClick={handleUpload} 
              disabled={loading} 
              style={{ flex: 1, padding: 12, background: loading ? "#555" : "#0095f6", color: "#fff", borderRadius: 8, border: "none", fontWeight: "bold", cursor: "pointer" }}
            >
              {loading ? "Posting..." : "Share Reel"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", width: "100%", background: "#000", position: "relative" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      
      <button 
        onClick={() => navigate("/feed")} 
        style={{ position: "absolute", top: 20, left: 20, background: "rgba(0,0,0,0.5)", color: "white", width: 40, height: 40, borderRadius: "50%", border: "none", fontSize: 20, cursor: "pointer" }}>
        ✕
      </button>

      <div style={{ position: "absolute", bottom: 40, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 40 }}>
        
        <div style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "white" }}>
                <span style={{ fontSize: "12px", fontWeight: 500 }}>Gallery</span>
            </div>
            <input 
                type="file" 
                accept="video/*" 
                onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]); }} 
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} 
            />
        </div>

        <button
          onClick={recording ? stopRecording : startRecording}
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            border: "4px solid white",
            background: recording ? "red" : "transparent",
            transition: "all 0.2s",
            cursor: "pointer"
          }}
        />

        <div style={{ width: 40 }}></div>
      </div>
    </div>
  );
};

export default VideoCapture;