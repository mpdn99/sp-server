import z from "zod";

const settingsSchema = z.object({
  spc_cds: z.string(),
  cookie: z.string(),
});

export default settingsSchema;
