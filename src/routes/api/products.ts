import { Hono } from "hono";
import { getProducts } from "../../controllers/products";

const productsRoutes = new Hono();

productsRoutes.get("/", async (c) => {
  const page = c.req.query("page") || "1";
  const products = await getProducts({ page });
  return c.json(products);
});

export default productsRoutes;
