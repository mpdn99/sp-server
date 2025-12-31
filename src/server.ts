import { Hono } from "hono";
import routes from "./routes";
import { baker } from "./configs";

const app = new Hono();

app.route("/", routes);

baker.bakeAll();

export default app;
