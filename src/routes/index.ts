import { Hono } from "hono";
import apiRoutes from "./api";

const routes = new Hono().route("/api/v1", apiRoutes);

export default routes;
