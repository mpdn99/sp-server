import { redis } from "../configs";

interface Settings {
  spc_cds: string;
  cookie: string;
}

const setSettings = async (settings: Settings) => {
  await redis.hset("settings", {
    spc_cds: settings.spc_cds,
    cookie: settings.cookie,
  });
};

const getSettings = async (): Promise<Settings | null> => {
  const settings = await redis.hgetall("settings");
  if (Object.keys(settings).length === 0) {
    return null;
  }
  return {
    spc_cds: settings.spc_cds,
    cookie: settings.cookie,
  };
};

export { setSettings, getSettings };
