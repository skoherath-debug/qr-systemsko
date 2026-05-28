import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up JSON body parsers with ample limits
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const configPath = path.join(process.cwd(), "so-config.json");
  const scansPath = path.join(process.cwd(), "so-scans.json");

  // Load configuration schema
  app.get("/api/config", (req, res) => {
    try {
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, "utf-8");
        return res.json(JSON.parse(data));
      } else {
        return res.json({ users: [], sites: [], theme: "classic" });
      }
    } catch (error) {
      console.error("Error reading so-config.json:", error);
      return res.status(500).json({ error: "Failed to load database configuration parameters." });
    }
  });

  // Save/Update configuration parameters (users, sites, theme, etc.)
  app.post("/api/config", (req, res) => {
    try {
      const configData = req.body;
      if (!configData || typeof configData !== "object") {
        return res.status(400).json({ error: "Invalid database configuration payload." });
      }

      // Read current config if exists to merge optionally
      let currentConfig: any = { users: [], sites: [], theme: "classic" };
      if (fs.existsSync(configPath)) {
        try {
          currentConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        } catch (e) {}
      }

      // Merge payload
      const mergedConfig = {
        users: Array.isArray(configData.users) ? configData.users : currentConfig.users,
        sites: Array.isArray(configData.sites) ? configData.sites : currentConfig.sites,
        theme: typeof configData.theme === "string" ? configData.theme : (currentConfig.theme || "classic")
      };

      fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2), "utf-8");
      return res.json({ status: "success", config: mergedConfig });
    } catch (error) {
      console.error("Error writing so-config.json:", error);
      return res.status(500).json({ error: "Failed to persist database configuration changes." });
    }
  });

  // Get historical dispatch logs
  app.get("/api/scans", (req, res) => {
    try {
      if (fs.existsSync(scansPath)) {
        const data = fs.readFileSync(scansPath, "utf-8");
        return res.json(JSON.parse(data));
      } else {
        return res.json([]);
      }
    } catch (error) {
      console.error("Error reading so-scans.json:", error);
      return res.status(500).json({ error: "Failed to load scans collection database." });
    }
  });

  // Save/Append/Update scans records
  app.post("/api/scans", (req, res) => {
    try {
      const scansPayload = req.body;
      if (!Array.isArray(scansPayload)) {
        return res.status(400).json({ error: "Invalid scans payload format. Expected array." });
      }

      // Standardize file write
      fs.writeFileSync(scansPath, JSON.stringify(scansPayload, null, 2), "utf-8");
      return res.json({ status: "success", count: scansPayload.length });
    } catch (error) {
      console.error("Error writing so-scans.json:", error);
      return res.status(500).json({ error: "Failed to append scans records to database safely." });
    }
  });

  // Hot Module Replacement and Vite Asset Server Mounting for Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SO Engine] Full-stack Server online on port ${PORT}`);
  });
}

startServer();
