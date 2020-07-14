/**
 * So this is interesting. I'm thinking that I want to create a short script to init a Docker container for Deno.
 * This is perhaps a bit meta as I want to use the script in this repo.
 * Or perhaps not and I'm just being a bit pretentious.
 *
 * Either way, I need a list of the things that should be initialised, and then some thoughts about what each of
 * those things should contain. "Things" means "files" and "folders".
 *
 * I need a `Dockerfile`, a `docker-compose.yml` file, a `.env` folder containing `development` and `production`.
 * Do I need a `Dockerfile.prod`?
 * Not at this point, I think.
 * So arguably I also do not need a `.env/production` folder.
 *
 * Let's start with that.
 **/

import commandForAddPostgres from "./commands/add_postgres.ts";
import commandForNew from "./commands/new.ts";
import commandForPurge from "./commands/purge.ts";
import { Command } from "https://deno.land/x/cliffy@v0.10.0/packages/command/mod.ts";

await new Command()
  .name("deno_dock")
  .version("0.0.1")
  .description(
    "Simple set up for a simple Docker environment for a Deno project",
  )
  .command("new", commandForNew)
  .command("add_pg", commandForAddPostgres)
  .command("purge", commandForPurge)
  .parse(Deno.args);
