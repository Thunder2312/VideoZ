import axios from "axios";

const API_BASE = "http://localhost:5000";

export const uploadVideo = async (file: File | Blob, token: string, caption: string) => {
  const formData = new FormData();
  formData.append("video", file);
  formData.append("caption", caption);

  const res = await axios.post(`${API_BASE}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.url;
};

//to get videos
export const fetchVideos = async (token?: string): Promise<any[]> => {
  const res = await axios.get(`${API_BASE}/videos`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
};

//post like
export const toggleLike = async (reelId: string, token: string) => {
  const res = await axios.post(`${API_BASE}/reels/${reelId}/like`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data; 
};

//post comment
export const postComment = async (reelId: string, text: string, token: string) => {
  const res = await axios.post(
    `${API_BASE}/reels/${reelId}/comment`,
    { text },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data; 
};

export const fetchComments = async (reelId: string) => {
  const res = await axios.get(`${API_BASE}/reels/${reelId}/comments`);
  return res.data;
};