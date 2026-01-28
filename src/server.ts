import { Hono } from "hono";
import routes from "./routes";
import "./jobs";

const app = new Hono();

app.route("/", routes);

export default {
  port: 3001,
  fetch: app.fetch,
};
