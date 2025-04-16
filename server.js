const express = require("express");
const youtubedl = require("youtube-dl-exec");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Halaman utama
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Halaman untuk YouTube downloader
app.get("/youtube", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "youtube.html"));
});

// Halaman untuk Instagram downloader
app.get("/instagram", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "instagram.html"));
});

// Halaman untuk Facebook downloader
app.get("/facebook", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "facebook.html"));
});

// Halaman untuk TikTok downloader
app.get("/tiktok", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "tiktok.html"));
});

// Halaman untuk TikTok downloader
app.get("/bilibili", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "bilibili.html"));
});

// API untuk mengunduh YouTube video dan audio
app.get("/download/youtube/:type", async (req, res) => {
  const { url } = req.query;
  const { type } = req.params;

  if (!url) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    const info = await youtubedl(url, { dumpJson: true });
    const title = info.title.replace(/[^a-zA-Z0-9-_ ]/g, "");
    const format = type === "video" ? "bestvideo[height<=1080]+bestaudio" : "bestaudio";

    res.header("Content-Disposition", `attachment; filename="${title}.${type === "video" ? "mp4" : "mp3"}"`);

    const process = youtubedl.exec(url, {
      format,
      output: "-",
      progress: true,
    });

    process.stdout.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch download info" });
  }
});

// API untuk mengunduh video dan foto Instagram
app.get("/download/instagram/:type", async (req, res) => {
  const { url } = req.query;
  const { type } = req.params;

  if (!url) {
    return res.status(400).json({ error: "URL Instagram tidak valid" });
  }

  try {
    // Ambil informasi media dari Instagram dengan cookies
    const info = await youtubedl(url, { 
      dumpJson: true, 
      userAgent: "Mozilla/5.0",
      cookie: "cookies.txt" // Perbaikan dari `cookies` ke `cookie`
    });

    if (!info) {
      return res.status(500).json({ error: "Gagal mendapatkan informasi media" });
    }

    // Membersihkan judul untuk digunakan sebagai nama file
    const title = info.title ? info.title.replace(/[^a-zA-Z0-9-_ ]/g, "") : "instagram_media";

    if (type === "video") {
      // Pastikan mengambil URL video dengan benar
      const videoUrl = info.formats?.find(f => f.url)?.url || info.url;
      if (!videoUrl) {
        return res.status(500).json({ error: "Tidak dapat menemukan URL video" });
      }

      res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
      const process = youtubedl.exec(url, {
        format: "bv+ba",
        output: "-",
        progress: true,
        cookie: "cookies.txt" // Gunakan cookies untuk akses media
      });

      process.stdout.pipe(res);
    } else if (type === "photo") {
      // Ambil URL gambar
      const imageUrl = info.thumbnail || info.url;
      if (!imageUrl) {
        return res.status(500).json({ error: "Tidak dapat menemukan URL gambar" });
      }

      res.redirect(imageUrl);
    } else {
      return res.status(400).json({ error: "Tipe unduhan tidak valid" });
    }
  } catch (error) {
    console.error("Error saat mengunduh media dari Instagram:", error);
    res.status(500).json({ error: "Gagal mengunduh media dari Instagram. Pastikan cookies masih valid!" });
  }
});

// API untuk mengunduh Facebook video, audio, dan gambar
app.get("/download/facebook/:type", async (req, res) => {
  const { url } = req.query;
  const { type } = req.params;

  if (!url) {
    return res.status(400).json({ error: "URL Facebook tidak valid" });
  }

  try {
    // Mengambil informasi media dari Facebook
    const info = await youtubedl(url, { 
      dumpJson: true, 
      userAgent: "Mozilla/5.0" 
    });

    if (!info) {
      return res.status(500).json({ error: "Gagal mendapatkan informasi media" });
    }

    // Bersihkan judul untuk digunakan sebagai nama file
    const title = info.title ? info.title.replace(/[^a-zA-Z0-9-_ ]/g, "") : "facebook_media";

    if (type === "video") {
      // Pastikan mengambil URL video
      const videoUrl = info.formats?.find(f => f.url)?.url || info.url;
      if (!videoUrl) {
        return res.status(500).json({ error: "Tidak dapat menemukan URL video" });
      }

      res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
      const process = youtubedl.exec(url, {
        format: "bv+ba",
        output: "-",
        progress: true
      });

      process.stdout.pipe(res);
    } else if (type === "audio") {
      // Pastikan mengambil URL audio
      const audioUrl = info.formats?.find(f => f.acodec !== "none")?.url;
      if (!audioUrl) {
        return res.status(500).json({ error: "Tidak dapat menemukan URL audio" });
      }

      res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
      const process = youtubedl.exec(url, {
        format: "bestaudio",
        output: "-",
        progress: true
      });

      process.stdout.pipe(res);
    } else if (type === "photo") {
      // Pastikan mengambil URL gambar
      const imageUrl = info.thumbnail || info.url;
      if (!imageUrl) {
        return res.status(500).json({ error: "Tidak dapat menemukan URL gambar" });
      }

      res.redirect(imageUrl);
    } else {
      return res.status(400).json({ error: "Tipe unduhan tidak valid" });
    }
  } catch (error) {
    console.error("Error saat mengunduh media dari Facebook:", error);
    res.status(500).json({ error: "Gagal mengunduh media dari Facebook." });
  }
});

// API untuk mengunduh video dan audio dari TikTok
app.get("/download/tiktok/:type", async (req, res) => {
  const { url } = req.query;
  const { type } = req.params;

  if (!url) {
    return res.status(400).json({ error: "URL TikTok tidak valid" });
  }

  try {
    // Mengambil informasi media dari TikTok
    const info = await youtubedl(url, { 
      dumpJson: true, 
      userAgent: "Mozilla/5.0" 
    });

    if (!info) {
      return res.status(500).json({ error: "Gagal mendapatkan informasi media" });
    }

    // Bersihkan judul untuk digunakan sebagai nama file
    const title = info.title ? info.title.replace(/[^a-zA-Z0-9-_ ]/g, "") : "tiktok_media";

    if (type === "video") {
      // Ambil URL video terbaik
      const videoUrl = info.formats?.find(f => f.url)?.url || info.url;
      if (!videoUrl) {
        return res.status(500).json({ error: "Tidak dapat menemukan URL video" });
      }

      res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
      const process = youtubedl.exec(url, {
        format: "bv+ba",
        output: "-",
        progress: true
      });

      process.stdout.pipe(res);
    } else if (type === "audio") {
      // Ambil URL audio terbaik
      const audioUrl = info.formats?.find(f => f.acodec !== "none")?.url;
      if (!audioUrl) {
        return res.status(500).json({ error: "Tidak dapat menemukan URL audio" });
      }

      res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
      const process = youtubedl.exec(url, {
        format: "bestaudio",
        output: "-",
        progress: true
      });

      process.stdout.pipe(res);
    } else {
      return res.status(400).json({ error: "Tipe unduhan tidak valid" });
    }
  } catch (error) {
    console.error("Error saat mengunduh media dari TikTok:", error);
    res.status(500).json({ error: "Gagal mengunduh media dari TikTok." });
  }
});

// API untuk mengunduh video dan audio dari Bilibili
app.get("/download/bilibili/:type", async (req, res) => {
  const { url } = req.query;
  const { type } = req.params;

  if (!url) {
    return res.status(400).json({ error: "URL Bilibili tidak valid" });
  }

  try {
    // Mengambil informasi media dari Bilibili
    const info = await youtubedl(url, { 
      dumpJson: true, 
      userAgent: "Mozilla/5.0"
    });

    if (!info) {
      return res.status(500).json({ error: "Gagal mendapatkan informasi media" });
    }

    // Bersihkan judul untuk digunakan sebagai nama file
    const title = info.title ? info.title.replace(/[^a-zA-Z0-9-_ ]/g, "") : "bilibili_media";

    if (type === "video") {
      // Ambil URL video terbaik
      const videoUrl = info.formats?.find(f => f.url)?.url || info.url;
      if (!videoUrl) {
        return res.status(500).json({ error: "Tidak dapat menemukan URL video" });
      }

      res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
      const process = youtubedl.exec(url, {
        format: "bv+ba",
        output: "-",
        progress: true
      });

      process.stdout.pipe(res);
    } else if (type === "audio") {
      // Ambil URL audio terbaik
      const audioUrl = info.formats?.find(f => f.acodec !== "none")?.url;
      if (!audioUrl) {
        return res.status(500).json({ error: "Tidak dapat menemukan URL audio" });
      }

      res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
      const process = youtubedl.exec(url, {
        format: "bestaudio",
        output: "-",
        progress: true
      });

      process.stdout.pipe(res);
    } else {
      return res.status(400).json({ error: "Tipe unduhan tidak valid" });
    }
  } catch (error) {
    console.error("Error saat mengunduh media dari Bilibili:", error);
    res.status(500).json({ error: "Gagal mengunduh media dari Bilibili." });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
