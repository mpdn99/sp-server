import { Hono } from "hono";
import settingsRoutes from "./settings";
import productsRoutes from "./products";
import boostRouter from "./boosts";

const apiRoutes = new Hono()
  .route("/settings", settingsRoutes)
  .route("/products", productsRoutes)
  .route("/boosts", boostRouter);

export default apiRoutes;
