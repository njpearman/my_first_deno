import { Command } from "https://deno.land/x/cliffy@v0.10.0/packages/command/mod.ts";

import dockerComposeYmlTemplate from "./../templates/yaml/docker_compose.yml.ts";
import appDevelopmentEnvTemplate from "./../templates/simple_pairs/app_development_env.ts";
import DockerfileTemplate from "./../templates/mustache/dockerfile.ts";
import * as FileSystem from "./../file_system.ts";
import { Render } from "./../templates/rendering.ts";

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

const command = new Command()
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

export default command;
