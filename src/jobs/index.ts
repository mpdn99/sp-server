import { Baker, RedisPersistenceProvider } from "cronbake";
import { boost } from "../controllers/boost";
import { redis } from "../configs";
import { syncProducts } from "./sync-product";

const baker = Baker.create({
  persistence: {
    enabled: true,
    provider: new RedisPersistenceProvider({
      client: redis,
      key: "cronbake:state",
    }),
  },
});

// baker.add({
//   name: "sync_products_cron",
//   cron: "@every_30_seconds",
//   callback: () => syncProducts(),
// });

baker.add({
  name: "boost_cron",
  cron: "@every_4_hours_5_minutes",
  callback: () => boost(),
});

baker.bakeAll();

export default baker;
