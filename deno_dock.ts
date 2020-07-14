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

import * as FileSystem from "./file_system.ts";
import { Render } from "./templates/rendering.ts";
import commandForAddPostgres from "./commands/add_postgres.ts";
import commandForNew from "./commands/new.ts";
import { Command } from "https://deno.land/x/cliffy@v0.10.0/packages/command/mod.ts";

const encoder = new TextEncoder();

async function createFileWithPath(
  fileWithPath: string,
  renderContents: Render,
) {
  const filenameStartIndex = fileWithPath.lastIndexOf("/") + 1;
  const filename = fileWithPath.slice(filenameStartIndex);
  const filepath = fileWithPath.slice(0, filenameStartIndex);

  // This is hardcoded for nixy paths and needs to be made more cleverer.
  if (filepath.length > 0 && filepath !== "./") {
    await FileSystem.ensureDirectoryExists(filepath);
  }

  const render = async () => {
    const encodedContents = encoder.encode(await renderContents());
    await Deno.writeFile(`${filepath}${filename}`, encodedContents);
  };

  await FileSystem.fileExists(fileWithPath);
  await render();
}

const commandForPurge = new Command()
  .option(
    "-f --force [force:boolean]",
    "Performs purge. Command will error if -f is not included",
  )
  .action(async ({ force }: any) => {
    if (!force) {
      console.log(
        "Purge destroys all Docker files. You must use --force to perform a purge. No files have been removed.",
      );
      Deno.exit(2);
    }

    console.log("Deleting all Docker files and directories");
    const dockerFiles = ["Dockerfile", "docker-compose.yml"];
    const dockerDirectories = [".env"];

    for (const file of dockerFiles) {
      FileSystem.removeWithLogging(file);
    }

    for (const directory of dockerDirectories) {
      FileSystem.removeWithLogging(directory, { recursive: true });
    }
  });

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
