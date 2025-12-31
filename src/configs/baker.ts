import { Baker, RedisPersistenceProvider } from "cronbake";
import { redis } from "./redis";
import { boost } from "../controllers/boost";

const baker = Baker.create({
  persistence: {
    enabled: true,
    provider: new RedisPersistenceProvider({
      client: redis,
      key: "cronbake:state",
    }),
  },
});

baker.add({
  name: "boost_cron",
  cron: "@every_4_hours",
  callback: () => boost(),
});

export { baker };
