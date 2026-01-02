import { Hono } from "hono";
import { getProducts } from "../../controllers/products";

const productsRoutes = new Hono();

productsRoutes.get("/", async (c) => {
  const products = await getProducts();
  return c.json(products);
});

export default productsRoutes;
