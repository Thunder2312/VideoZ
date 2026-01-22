import express, { Request, Response } from "express";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import cors from "cors";
import fs from "fs";
import path from "path";
import { pool } from "./src/db";
import authRoutes from './routes/auth';
import { authenticate } from "./routes/auth";

ffmpeg.setFfmpegPath(ffmpegPath as string);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

interface AuthRequest extends Request {
  user?: { id: string; email: string; username: string };
}

const uploadDir = path.join(process.cwd(), "uploads");
const processedDir = path.join(process.cwd(), "processed");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });

app.use("/processed", express.static(processedDir));

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 },
  dest: uploadDir,
});

// Routes
// Upload Endpoint
app.post("/upload", authenticate, upload.single("video"), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "No video file uploaded" });
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const userId = req.user.id;
  const { caption } = req.body;
  const inputPath = req.file.path;
  const outputFile = `${Date.now()}.mp4`;
  const outputPath = path.join(processedDir, outputFile);

  ffmpeg()
    .input(inputPath)
    .outputOptions([
      "-vf scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2",
      "-preset fast",
      "-crf 28",
      "-movflags +faststart",
    ])
    .format("mp4")
    .save(outputPath)
    .on("end", async () => {
      fs.unlinkSync(inputPath); 

      try {
        const result = await pool.query(
          `INSERT INTO reels (user_id, video_url, caption, duration)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [userId, `/processed/${outputFile}`, caption || "", 0]
        );

        res.json({
          success: true,
          reel: result.rows[0],
          url: `http://localhost:5000/processed/${outputFile}`,
        });
      } catch (err) {
        console.error("Postgres error:", err);
        res.status(500).json({ error: "Database error" });
      }
    })
    .on("error", (err: Error) => {
      console.error("FFmpeg error:", err.message);
      res.status(500).json({ error: err.message });
    });
});

// Get Feed (All Videos)
app.get("/videos", async (req: Request, res: Response) => {
  try {
   
    const result = await pool.query(
      `SELECT r.reel_id, r.user_id, u.username, r.video_url, r.caption, r.duration,
              (SELECT COUNT(*) FROM likes l WHERE l.reel_id = r.reel_id) AS likes,
              (SELECT COUNT(*) FROM comments c WHERE c.reel_id = r.reel_id) AS comments
       FROM reels r
       JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch reels:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Toggle Like
app.post("/reels/:id/like", authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  
  const { id: reelId } = req.params;
  const userId = req.user.id;

  try {
    const existingLike = await pool.query(
      "SELECT * FROM likes WHERE user_id = $1 AND reel_id = $2",
      [userId, reelId]
    );

    if (existingLike.rows.length > 0) {
      await pool.query("DELETE FROM likes WHERE user_id = $1 AND reel_id = $2", [userId, reelId]);
      res.json({ liked: false });
    } else {
      await pool.query("INSERT INTO likes (user_id, reel_id) VALUES ($1, $2)", [userId, reelId]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});


// Add Comment
app.post("/reels/:id/comment", authenticate, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const { id: reelId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (!text) return res.status(400).json({ error: "Comment cannot be empty" });

  try {
    
    const result = await pool.query(
      `INSERT INTO comments (user_id, reel_id, text) 
       VALUES ($1, $2, $3) 
       RETURNING comment_id, text, created_at`,
      [userId, reelId, text]
    );

    const userRes = await pool.query("SELECT username FROM users WHERE id = $1", [userId]);
    
    res.json({
      ...result.rows[0],
      username: userRes.rows[0].username
    });
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ error: "Failed to post comment" });
  }
});

// Get Comments for a specific Reel 
app.get("/reels/:id/comments", async (req: Request, res: Response) => {
  const { id: reelId } = req.params;

  try {
    
    const result = await pool.query(
      `SELECT c.comment_id, c.text, c.created_at, u.username 
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.reel_id = $1
       ORDER BY c.created_at DESC`,
      [reelId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Fetch comments error:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});


// Get User Profile Details
app.get("/users/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userRes = await pool.query("SELECT id, username FROM users WHERE id = $1", [id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });

    // Get stats: Total Posts and Total Likes received
    const statsRes = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM reels WHERE user_id = $1) as post_count,
        (SELECT COUNT(*) FROM likes l JOIN reels r ON l.reel_id = r.reel_id WHERE r.user_id = $1) as total_likes
      `,
      [id]
    );

    res.json({ ...userRes.rows[0], ...statsRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get Specific User's Videos (Grid View)
app.get("/users/:id/videos", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT reel_id, video_url, caption,
              (SELECT COUNT(*) FROM likes WHERE reel_id = reels.reel_id) as likes
       FROM reels
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ... app.listen ...
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});