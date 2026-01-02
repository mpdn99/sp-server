import { getProductList } from "../repositories/products";

const getProducts = async () => {
  const productsListRedis = await getProductList();
  return productsListRedis;
};

export { getProducts };
