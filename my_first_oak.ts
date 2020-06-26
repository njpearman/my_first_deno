import { Application } from "https://deno.land/x/oak/mod.ts";

const app = new Application();

app.use((ctx) => {
  ctx.response.body = "...from an acorn, 🌳";
});

await app.listen({ port: 4604 });

