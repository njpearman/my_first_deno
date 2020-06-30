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

import Mustache from "https://raw.githubusercontent.com/janl/mustache.js/v4.0.1/mustache.mjs";

const dockerFile = "./Dockerfile";
const dockerComposeFile = "./docker-compose.yml";
const appDevelopmentEnvFile = "./.env/development/app";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const renderEmpty = async () => {
  return new Promise<string>((resolve) => resolve(""));
};

const renderMustacheTemplate = async (
  templateName: string,
  values: object = {},
) => {
  const template = await Deno.readFile(templateName);
  return Mustache.render(decoder.decode(template), values);
};

type Render = typeof renderEmpty; //() => Promise<string>;

/**
 * Using `Mustache` here produces a TS error in Vim:
 * Cannot invoke an object that is possibly undefined.
 *
 * However, Deno runs happily with this code. I've tried to hunt around for the reason that it
 * happens and can't find anything. It might be because the language server implementation doesn't
 * know how to handle external imports fully, or because I'm not strictly importing the module
 * correctly.
 **/
const dockerfileTemplate = {
  filepath: dockerFile,
  renderContents: () => {
    return renderMustacheTemplate(
      "Dockerfile.mustache",
      { scriptName: "main.ts" },
    );
  },
};
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
  try {
    const info = Deno.lstat(filepath);

    if (!(await info).isDirectory) {
      // we have a problem
      throw new Error(`Expected ${filepath} to be a directory`);
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      try {
        // make the directory!
        await Deno.mkdir(filepath, { recursive: true });
      } catch (err) {
        console.log(`Unable to create directory ${filepath}`);
        throw err;
      }
    } else {
      // bad things happened
      throw err;
    }
  }
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
  try {
    // for my reference, lstat gets info about the symlink source, i.e. the original file/dir, rather than
    // the symlink itself
    const fileInfo = await Deno.lstat(fileWithPath);

    if (!fileInfo.isFile) {
      console.log(`Expected ${fileWithPath} to be a file; found a directory`);
    } else {
      console.log(`Found existing ${filename}`);
      // halt if found?
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      // we create the file
      const encodedContents = encoder.encode(await renderContents());
      await Deno.writeFile(`${filepath}${filename}`, encodedContents);
    } else {
      // something strange happened
      console.log(`Unexpected file error: ${err}`);
    }
  }
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

initDocker();
