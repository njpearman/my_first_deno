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

import { IFlags } from "https://deno.land/x/cliffy@v0.10.0/packages/flags/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.10.0/packages/command/mod.ts";
import Mustache from "https://raw.githubusercontent.com/janl/mustache.js/v4.0.1/mustache.mjs";

const dockerComposeFile = "./docker-compose.yml";
const appDevelopmentEnvFile = "./.env/development/app";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const onNotFoundDefault = () => new Promise<string>(resolve => resolve(""));

async function ignoreNotFound(fileSystemOperation: () => Promise<any>, onNotFound: () => Promise<any> = onNotFoundDefault) {
  try {
    await fileSystemOperation();
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      await onNotFound();
    } else {
      console.log(`Error ignoring not found: ${error}`);
      throw error;
    }
  }
}

const renderEmpty = async () => {
  return new Promise<string>((resolve) => resolve(""));
};

/**
 * Using `Mustache` here produces a TS error in Vim:
 * Cannot invoke an object that is possibly undefined.
 *
 * However, Deno runs happily with this code. I've tried to hunt around for the reason that it
 * happens and can't find anything. It might be because the language server implementation doesn't
 * know how to handle external imports fully, or because I'm not strictly importing the module
 * correctly.
 **/
const renderMustacheTemplate = async (
  templateName: string,
  values: object = {},
) => {
  const template = await Deno.readFile(templateName);
  return Mustache.render(decoder.decode(template), values);
};

type Render = typeof renderEmpty; //() => Promise<string>;

class DockerfileTemplate {
  #scriptName: string;
  #allows: string[];
  constructor(scriptName: string, allows: string[] = [], public filepath: string = "./Dockerfile") {
    this.#scriptName = scriptName;
    this.#allows = allows;
    this.renderContents = this.renderContents.bind(this);
  }

  renderContents() {
    console.log(`allows are: ${this.#allows.join(";")}`);
    let values: { scriptName: string, allows?: string } = { scriptName: this.#scriptName };
    if (this.#allows.length > 0) {
      values.allows = this.#allows.map(allow => `"--allow-${allow}"`).join(", ") + ", ";
    }
    return renderMustacheTemplate(
      "Dockerfile.mustache",
      values,
    );
  }
}

let dockerfileTemplate: DockerfileTemplate;

const dockerComposeYmlTemplate = {
  filepath: dockerComposeFile,
  renderContents: () => {
    return renderMustacheTemplate("docker-compose.yml.mustache");
  },
};

const appDevelopmentEnvTemplate = {
  filepath: appDevelopmentEnvFile,
  renderContents: renderEmpty,
};

async function ensureDirectoryExists(filepath: string) {
  const isDirectoryCheck = async () => {
    const info = Deno.lstat(filepath);

    if (!(await info).isDirectory) {
      // we have a problem
      throw new Error(`Expected ${filepath} to be a directory`);
    }
  };

  const makeDirectory = async () => {
    try {
      // make the directory!
      await Deno.mkdir(filepath, { recursive: true });
    } catch (err) {
      console.log(`Unable to create directory ${filepath}`);
      throw err;
    }
  };

  await ignoreNotFound(isDirectoryCheck, makeDirectory);
}

async function createFileWithPath(
  fileWithPath: string,
  renderContents: Render,
) {
  const filenameStartIndex = fileWithPath.lastIndexOf("/") + 1;
  const filename = fileWithPath.slice(filenameStartIndex);
  const filepath = fileWithPath.slice(0, filenameStartIndex);

  // This is hardcoded for nixy paths and needs to be made more cleverer.
  if (filepath.length > 0 && filepath !== "./") {
    await ensureDirectoryExists(filepath);
  }

  /**
   * Essentially a modified copy of
   * [std/fs/exists.ts](https://github.com/denoland/deno/blob/v1.1.2/std/fs/exists.ts).
   * I'm using my own implementation because, at the time of writing, I'd prefer to have control over any 
   * specifics I might need rather than importing a small function that might make things harder for me to
   * understand or implement.
   */
  const fileExists = async () => {
    // for my reference, lstat gets info about the symlink source, i.e. the original file/dir, rather than
    // the symlink itself
    const fileInfo = await Deno.lstat(fileWithPath);

    if (!fileInfo.isFile) {
      console.log(`Expected ${fileWithPath} to be a file; found a directory`);
    } else {
      console.log(`Found existing ${filename}`);
      // halt if found?
    }
  }

  const render = async () => {
    const encodedContents = encoder.encode(await renderContents());
    await Deno.writeFile(`${filepath}${filename}`, encodedContents);
  }

  await ignoreNotFound(fileExists, render);
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
  .option("-a, --allows <allows:string[]>", "comma separated list of Deno permissions. Use the Deno run allow you want, minus `--allow-`")
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
  .action(async () => {
    console.log("Deleting all Docker files and directories");
    const dockerFiles = ["Dockerfile", "docker-compose.yml"];
    const dockerDirectories = [".env"];

    for (const file of dockerFiles) {
      ignoreNotFound(() => Deno.remove(file));
    }

    for (const directory of dockerDirectories) {
      ignoreNotFound(() => Deno.remove(directory, { recursive: true }));
    }
  });

await new Command()
  .name("deno_dock")
  .version("0.0.1")
  .description(
    "Simple set up for a simple Docker environment for a Deno project",
  )
  .arguments("<command>")
  .command("new", commandForNew)
  .command("purge", commandForPurge)
  .parse(Deno.args);
