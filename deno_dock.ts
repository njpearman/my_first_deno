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
import DockerfileTemplate from "./templates/mustache/dockerfile.ts";
import dockerComposeYmlTemplate from "./templates/yaml/docker_compose.yml.ts";
import appDevelopmentEnvTemplate from "./templates/simple_pairs/app_development_env.ts";
import { Render } from "./templates/rendering.ts";
import commandForAddPostgres from "./commands/add_postgres.ts";
import { Command } from "https://deno.land/x/cliffy@v0.10.0/packages/command/mod.ts";

const encoder = new TextEncoder();

let dockerfileTemplate: DockerfileTemplate;

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

async function initDocker() {
  // Is this necessary..? I understand the benefit of triggering things asynchronously but I doubt
  // that this is the way to do it.
  const templates = {
    templateList: [
      dockerfileTemplate,
      dockerComposeYmlTemplate,
      appDevelopmentEnvTemplate,
    ],
    [Symbol.asyncIterator]() {
      return {
        templatesLeft: [...this.templateList],
        async next() {
          const currentTemplate = this.templatesLeft.pop();
          if (currentTemplate) {
            await createFileWithPath(
              currentTemplate.filepath,
              currentTemplate.renderContents,
            );
            return { done: false, value: currentTemplate };
          } else {
            return { done: true };
          }
        },
      };
    },
  };

  for await (let template of templates) {
    if (template) {
      console.log(`Worked ${template.filepath}`);
    }
  }
}

const commandForNew = new Command()
  .arguments("<file>")
  .option(
    "-a, --allows <allows:string[]>",
    "comma separated list of Deno permissions. Use the Deno run allow you want, minus `--allow-`",
  )
  .action((options: { allows: string[] }, file: string) => {
    console.log(`Running new command with ${file}`);
    console.log(`Docker will allow: ${options.allows}`);
    if (options.allows) {
      dockerfileTemplate = new DockerfileTemplate(file, options.allows);
    } else {
      dockerfileTemplate = new DockerfileTemplate(file);
    }
    initDocker();
  });

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
