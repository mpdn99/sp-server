import { redis } from "../configs";
import { getBoostList, updateBoostProduct } from "../repositories";

/* =======================
   Types
======================= */

interface BoostResponse {
  code: number;
  message: string;
  user_message: string;
}

/* =======================
   Constants
======================= */

const BOOST_SUCCESS_CODES = new Set<number>([
  0,
  1000100216, // already boosted
  1000100217, // boost cooldown
]);

const BOOST_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 10_000;

/* =======================
   Helpers
======================= */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (
  input: RequestInfo,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
};

const extractErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
};

/* =======================
   Shopee API
======================= */

async function boostProduct(
  productId: number,
  spc_cds: string,
  cookie: string
): Promise<BoostResponse> {
  const url = `https://banhang.shopee.vn/api/v3/opt/product/boost_product/?version=3.1.0&SPC_CDS=${spc_cds}&SPC_CDS_VER=2`;

  const res = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json;charset=UTF-8",
        cookie,
        locale: "vi",
        "user-agent": "insomnia/11.1.0",
        "sc-fe-ver": "21.129153",
      },
      body: JSON.stringify({ id: productId }),
    },
    REQUEST_TIMEOUT_MS
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/* =======================
   Main Logic
======================= */

export async function boost(): Promise<void> {
  const products = await getBoostList();
  if (!products.length) return;

  const [spc_cds, cookie] = await Promise.all([
    redis.hget("settings", "spc_cds"),
    redis.hget("settings", "cookie"),
  ]);

  if (!spc_cds || !cookie) {
    throw new Error("Missing spc_cds or cookie in Redis settings");
  }

  for (let i = 0; i < products.length; i++) {
    const { id } = products[i];

    try {
      const response = await boostProduct(id, spc_cds, cookie);

      const success = BOOST_SUCCESS_CODES.has(response.code);

      console.log(
        success
          ? `✓ Boosted product ${id}`
          : `⚠ Boost rejected ${id}: ${response.user_message}`
      );

      await updateBoostProduct(id, success, response.user_message);
    } catch (err) {
      const message = extractErrorMessage(err);

      console.error(`✗ Boost failed ${id}:`, message);

      await updateBoostProduct(id, false, message);
    }

    // delay giữa các boost
    if (i < products.length - 1) {
      await sleep(BOOST_DELAY_MS);
    }
  }
}
