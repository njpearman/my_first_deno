import { Command } from "./deps.ts";

import commandForAddPostgres from "./commands/add_postgres.ts";
import commandForNew from "./commands/new.ts";
import commandForPurge from "./commands/purge.ts";

await new Command()
  .name("archy")
  .version("0.0.1")
  .description(
    "Simple set up for a simple Deno project backed by a Docker environment. Why archy? Archosaurs begat Dinosaurs.",
  )
  .command("new", commandForNew)
  .command("add_pg", commandForAddPostgres)
  .command("purge", commandForPurge)
  .parse(Deno.args);
