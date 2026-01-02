import { redis } from "../configs";
import { BOOST_KEY } from "../constants";

interface BoostProduct {
  id: number;
  name: string;
  image: string;
  run_at: number;
  result: boolean;
  message: string | null;
}

redis.defineCommand("addBoost", {
  numberOfKeys: 1,
  lua: `
    local key = KEYS[1]
    local newItem = ARGV[1]
    local productId = tonumber(ARGV[2])
    local maxSize = tonumber(ARGV[3])

    local list = redis.call('LRANGE', key, 0, maxSize - 1)

    for _, item in ipairs(list) do
      local decoded = cjson.decode(item)
      if decoded.id == productId then
        redis.call('LREM', key, 1, item)
        break
      end
    end

    redis.call('LPUSH', key, newItem)
    redis.call('LTRIM', key, 0, maxSize - 1)

    return 1
  `,
});

redis.defineCommand("updateBoost", {
  numberOfKeys: 1,
  lua: `
    local key = KEYS[1]
    local productId = tonumber(ARGV[1])
    local result = ARGV[2] == "true"
    local message = ARGV[3]
    local runAt = tonumber(ARGV[4])

    if message == "null" then
      message = nil
    end

    local list = redis.call('LRANGE', key, 0, 4)

    for i, item in ipairs(list) do
      local decoded = cjson.decode(item)
      if decoded.id == productId then
        decoded.run_at = runAt
        decoded.result = result
        decoded.message = message

        redis.call('LSET', key, i - 1, cjson.encode(decoded))
        return 1
      end
    end

    return 0
  `,
});


/**
 * Lấy danh sách product đang boost (tối đa 5)
 *
 * Performance: O(N) với N = 5, rất nhanh vì range cố định
 */
export const getBoostList = async (): Promise<BoostProduct[]> => {
  try {
    const rawList = await redis.lrange(BOOST_KEY, 0, 4);

    if (!rawList?.length) {
      return [];
    }

    const products = rawList.reduce<BoostProduct[]>((acc, item) => {
      try {
        const parsed = JSON.parse(item) as BoostProduct;
        acc.push(parsed);
      } catch (parseError) {
        console.error("Failed to parse boost product:", parseError);
      }
      return acc;
    }, []);

    return products;
  } catch (error) {
    console.error("Failed to fetch boost list:", error);
    return [];
  }
};

/**
 * Thêm product vào boost list với deduplication
 * Sử dụng Lua script để đảm bảo atomic operation
 *
 * Performance: O(N) với N = số items trong list (tối đa 5)
 * Network: Chỉ 1 round-trip thay vì 4 → giảm 75% latency
 */
export const addBoostProduct = async ({
  id: id,
  name,
  image,
}: {
  id: number;
  name: string;
  image: string;
}): Promise<void> => {
  try {
    const newProduct: BoostProduct = {
      id: id,
      name: name,
      image: image,
      run_at: 0,
      result: false,
      message: null,
    };

    // @ts-expect-error - Custom command defined via defineCommand
    await redis.addBoost(
      BOOST_KEY,
      JSON.stringify(newProduct),
      id.toString(),
      "5"
    );
  } catch (error) {
    console.error("Failed to add boost product:", error);
    throw error;
  }
};

/**
 * Update boost product với atomic operation
 *
 * Performance: O(N) với N = số items trong list (tối đa 5)
 * Sử dụng Lua script để đảm bảo không có race condition
 */
export const updateBoostProduct = async (
  productId: number,
  result: boolean,
  message: string
): Promise<void> => {
  try {
    // @ts-expect-error - Custom command defined via defineCommand
    await redis.updateBoost(
      BOOST_KEY,
      productId.toString(),
      result.toString(),
      message,
      Date.now().toString()
    );
  } catch (error) {
    console.error("Failed to update boost product error:", error);
    throw error;
  }
};
