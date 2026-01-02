import { redis } from "../configs";
import { setProductList } from "../repositories";

/* =======================
   Types
======================= */

interface ProductModel {
  id: number;
  name: string;
  image: string;
  start_time: number | null;
}

interface OnGoingCampaigns {
  campaign_type: number;
  start_time: number;
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
  promotion_detail?: {
    ongoing_campaigns?: OnGoingCampaigns[];
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

/* =======================
   Constants
======================= */

const SHOPEE_API =
  "https://banhang.shopee.vn/api/v3/opt/mpsku/list/v2/get_product_list";

const PAGE_SIZE = 12;

/* =======================
   Helpers
======================= */

const fetchShopee = async (
  url: string,
  cookie: string
): Promise<ShopeeResponse> => {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json, text/plain, */*",
      "content-type": "application/json;charset=UTF-8",
      cookie,
      locale: "vi",
    },
  });

  return res.json();
};

const mapProduct = (product: Product): ProductModel => ({
  id: product.id,
  name: product.name,
  image: product.cover_image,
  start_time:
    product.promotion_detail?.ongoing_campaigns?.[0]?.start_time ?? null,
});

/* =======================
   Shopee API
======================= */

const getPages = async ({
  spc_cds,
  cookie,
}: {
  spc_cds: string | null;
  cookie: string | null;
}): Promise<number> => {
  if (!spc_cds || !cookie) return 0;

  const url = `${SHOPEE_API}?SPC_CDS=${spc_cds}&SPC_CDS_VER=2&page_number=1&page_size=${PAGE_SIZE}&list_type=live_all`;

  const data = await fetchShopee(url, cookie);

  if (data.code !== 0) return 0;

  const { total, page_size } = data.data.page_info;
  return Math.ceil(total / page_size);
};

const getProductFromShopee = async ({
  spc_cds,
  cookie,
  page,
}: {
  spc_cds: string;
  cookie: string;
  page: number;
}): Promise<ShopeeResponse | null> => {
  try {
    const url = `${SHOPEE_API}?SPC_CDS=${spc_cds}&SPC_CDS_VER=2&page_number=${page}&page_size=${PAGE_SIZE}&list_type=live_all`;

    const data = await fetchShopee(url, cookie);
    
    return data.code === 0 ? data : null;
  } catch (err) {
    console.error(`[Shopee] fetch page ${page} failed`, err);
    return null;
  }
};

/* =======================
   Main Sync Logic
======================= */

const syncProducts = async () => {
  const [spc_cds, cookie] = await Promise.all([
    redis.hget("settings", "spc_cds"),
    redis.hget("settings", "cookie"),
  ]);

  if (!spc_cds || !cookie) {
    throw new Error("Missing spc_cds or cookie in Redis settings");
  }

  const pages = await getPages({ spc_cds, cookie });
  if (pages === 0) return;

  // fetch all pages in parallel
  const requests = Array.from({ length: pages }, (_, i) =>
    getProductFromShopee({
      spc_cds,
      cookie,
      page: i + 1,
    })
  );

  const responses = await Promise.all(requests);

  const products: ProductModel[] = responses
    .filter((r): r is ShopeeResponse => r !== null)
    .flatMap((r) => r.data.products.map(mapProduct));

  console.log(products);

  await setProductList(products);

  console.log(`✓ Synced ${products.length} products from Shopee`);
};

/* =======================
   Export
======================= */

export { syncProducts };
