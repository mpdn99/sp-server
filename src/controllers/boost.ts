import { redis } from "../configs";
import { getBoostList, updateBoostProduct } from "../repositories";

interface BoostResponse {
  code: number;
  message: string;
  user_message: string;
}

async function boostProduct(productId: number): Promise<BoostResponse> {
  const spc_cds = await redis.hget("settings", "spc_cds");
  const cookie = await redis.hget("settings", "cookie");
  const url = `https://banhang.shopee.vn/api/v3/opt/product/boost_product/?version=3.1.0&SPC_CDS=${spc_cds}&SPC_CDS_VER=2`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json;charset=UTF-8",
      cookie: `${cookie}`,
      locale: "vi",
      "user-agent": "insomnia/11.1.0",
      "sc-fe-ver": "21.129153",
    },
    body: JSON.stringify({ id: productId }),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to boost product ID ${productId}: ${res.status} ${res.statusText}`
    );
  }

  return (await res.json()) as BoostResponse;
}

export async function boost() {
  const products = await getBoostList();

  for (let i = 0; i < products.length; i++) {
    const id = products[i].id;
    try {
      const result = await boostProduct(id);

      console.log(`✓ Boosted product ID ${id}:`, result);

      await updateBoostProduct(
        id,
        result.code === 0 ||
          result.code === 1000100216 ||
          result.code === 1000100217,
        result.user_message
      );

      if (i < products.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (err) {
      console.error(`✗ Lỗi:`, err);
      await updateBoostProduct(id, false, String(err));
    }
  }
}
