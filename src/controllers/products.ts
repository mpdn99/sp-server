import { redis } from "../configs";

interface ProductModel {
  id: number;
  name: string;
  image: string;
  total_available_stock: number;
  statistics: {
    view_count: number;
    liked_count: number;
    sold_count: number;
  };
}

interface Product {
  id: number;
  name: string;
  cover_image: string;
  statistics: {
    view_count: number;
    liked_count: number;
    sold_count: number;
  };
  stock_detail: {
    total_available_stock: number;
  };
}

interface PageInfo {
  total: number;
  page_number: number;
  page_size: number;
}

interface ShopeeResponse {
  code: number;
  message: string;
  user_message: string;
  data: {
    page_info: PageInfo;
    products: Product[];
  };
}

const getProducts = async ({ page }: { page: string }) => {
  const spc_cds = await redis.hget("settings", "spc_cds");
  const cookie = await redis.hget("settings", "cookie");

  const url = `https://banhang.shopee.vn/api/v3/opt/mpsku/list/v2/get_product_list?SPC_CDS=${spc_cds}&SPC_CDS_VER=2&page_number=${page}&page_size=12&list_type=live_all`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json;charset=UTF-8",
      cookie: `${cookie}`,
      locale: "vi",
    },
    method: "GET",
  });

  const data = (await res.json()) as ShopeeResponse;
  if (data.code !== 0) {
    return { products: [], page_info: null };
  }
  const page_info = data.data.page_info;
  const products: ProductModel[] = data.data.products.map((p) => ({
    id: p.id,
    name: p.name,
    image: `https://cf.shopee.vn/file/${p.cover_image}`,
    total_available_stock: p.stock_detail.total_available_stock,
    statistics: {
      view_count: p.statistics.view_count,
      liked_count: p.statistics.liked_count,
      sold_count: p.statistics.sold_count,
    },
  }));

  return { products, page_info };
};

export { getProducts };
