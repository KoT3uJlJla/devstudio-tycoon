export function registerResearchRoutes(app, deps) {
  app.post("/api/research/unlock", deps.requireTelegramUser, async (req, res) => {
    res.status(501).json({ ok: false, error: "not_implemented" });
  });
}
