import { Command } from "https://deno.land/x/cliffy@v0.10.0/packages/command/mod.ts";

import * as FileSystem from "./../file_system.ts";

const command = new Command()
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

export default command;
