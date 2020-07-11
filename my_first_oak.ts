import { Application, Context, Router } from "https://deno.land/x/oak/mod.ts";

const router = new Router();

function trees(context: Context) {
  context.response.body = {
    trees: [
      { name: "Oak" },
      { name: "Silver Birch" },
      { name: "Fir" },
    ],
  };
}

function dinosaurs(context: Context) {
  context.response.body = {
    dinosaurs: [
      { name: "Brontosaurus" },
      { name: "Stegosaurus" },
      { name: "Diplodocus" },
      { name: "Triceratops" },
    ],
  };
}

function root(context: Context) {
  context.response.body = "...from an acorn, 🌳";
}

router
  .get("/", root)
  .get("/trees", trees)
  .get("/dinosaurs", dinosaurs);

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods()); // Why does the doc example include this?

await app.listen({ port: 4604 }); // 4604 == 'acorn', n'est pas?
