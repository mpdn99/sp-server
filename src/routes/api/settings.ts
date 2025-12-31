import { Hono } from "hono";
import { getSettings, setSettings } from "../../repositories/settings";
import { zValidator } from "@hono/zod-validator";
import settingsSchema from "../../validators/settings";

const settingsRoutes = new Hono();

settingsRoutes.get("/", async (c) => {
  const settings = await getSettings();
  if (!settings) {
    return c.json({ message: "Settings not found" }, 404);
  }
  return c.json(settings);
});

settingsRoutes.post("/", zValidator("json", settingsSchema), async (c) => {
  const body = await c.req.json();
  const { spc_cds, cookie } = body;

  await setSettings({ spc_cds, cookie });

  return c.json({ message: "Settings saved successfully" });
});

export default settingsRoutes;
