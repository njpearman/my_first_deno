import { Command } from "../deps.ts";

import dockerComposeYmlTemplate from "./../templates/yaml/docker_compose.yml.ts";
import appDevelopmentEnvTemplate from "./../templates/simple_pairs/app_development_env.ts";
import DockerfileTemplate from "./../templates/mustache/dockerfile.ts";
import * as FileSystem from "./../file_system.ts";
import { Render } from "./../templates/rendering.ts";

const encoder = new TextEncoder();

async function createFileWithPath(
  fileWithPath: string,
  renderContents: Render,
) {
  const filenameStartIndex = fileWithPath.lastIndexOf("/") + 1;
  const filepath = fileWithPath.slice(0, filenameStartIndex);

  // This is hardcoded for nixy paths and needs to be made more cleverer.
  if (filepath.length > 0 && filepath !== "./") {
    await FileSystem.ensureDirectoryExists(filepath);
  }

  const render = async () => {
    const encodedContents = encoder.encode(await renderContents());
    await Deno.writeFile(fileWithPath, encodedContents);
  };

  await FileSystem.fileExists(fileWithPath);
  await render();
}

async function initDocker(dockerfileTemplate: DockerfileTemplate) {
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
    if (options.allows) {
      console.log(`Docker will allow: ${options.allows}`);
      initDocker(new DockerfileTemplate(file, options.allows));
    } else {
      console.log("Docker will allow nothing in Deno script");
      initDocker(new DockerfileTemplate(file));
    }
  });

export default command;
