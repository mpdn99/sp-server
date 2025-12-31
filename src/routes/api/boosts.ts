import { Hono } from "hono";
import { addBoostProduct, getBoostList } from "../../repositories";

interface ProductsInput {
  id: number;
  name: string;
  image: string;
}

const boostsRouter = new Hono();

/**
 * GET: lấy danh sách 5 product đang boost
 */
boostsRouter.get("/", async (c) => {
  const products = await getBoostList();

  return c.json({ products });
});

/**
 * POST: thêm product vào boost list
 * - không trùng id
 * - tối đa 5 product
 */
boostsRouter.post("/", async (c) => {
  const body = await c.req.json<ProductsInput[]>();

  for (const item of body) {
    if (item.id === undefined || !item.name || !item.image) {
      return c.json(
        { error: "Missing required fields (id, name, image)" },
        400
      );
    }

    await addBoostProduct({
      id: item.id,
      name: item.name,
      image: item.image,
    });
  }

  return c.json({
    message: "Product added to boost list successfully",
  });
});

export default boostsRouter;
