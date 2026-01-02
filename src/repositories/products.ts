import { redis } from "../configs";
import { PRODUCT_KEY } from "../constants";

interface ProductModel {
  id: number;
  name: string;
  image: string;
  start_time?: number | null;
}

const getProductList = async () => {
  const products = await redis.lrange(PRODUCT_KEY, 0, -1);
  return products.map((item) => JSON.parse(item));
};

const setProductList = async (products: ProductModel[]) => {
  const pipeline = redis.pipeline();
  pipeline.del(PRODUCT_KEY);
  products.forEach((product) => {
    pipeline.rpush(PRODUCT_KEY, JSON.stringify(product));
  });
  await pipeline.exec();
};

export { getProductList, setProductList };