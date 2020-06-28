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

const dockerFile = "Dockerfile";
const dockerComposeFile = "docker-compose.yml";
const envFolder = ".env";
const encoder = new TextEncoder();


async function createFileWithPath(fileWithPath: string, contents: string) {
  const filenameStartIndex = fileWithPath.lastIndexOf("/") + 1;
  const filename = fileWithPath.slice(filenameStartIndex);
  const filepath = fileWithPath.slice(0, filenameStartIndex);

  // handle a nested path here.
  //   abort on `../`?
  //   abort on `/ ...`?

  /**
   * Essentially a modified copy of
   * [std/fs/exists.ts](https://github.com/denoland/deno/blob/v1.1.2/std/fs/exists.ts).
   * I'm using my own implementation because, at the time of writing, I'd prefer to have control over any 
   * specifics I might need rather than importing a small function that might make things harder for me to
   * understand or implement.
   */
  try {
    const fileInfo = await Deno.lstat(fileWithPath);

    if (!fileInfo.isFile) {
      console.log(`Expected ${fileWithPath} to be a file; found a directory`);
    } else {
      console.log(`Found existing ${filename}`);
      // halt if found?
    }
  } catch(err) {
    if (err instanceof Deno.errors.NotFound) {
      // we create the file
      const encodedContents = encoder.encode(contents);
      await Deno.writeFile(`${filepath}${filename}`, encodedContents);
    } else {
      // something strange happened
    }
  }
}

async function initDocker() {
  createFileWithPath(`./${dockerFile}`, "")
  createFileWithPath(`./${dockerComposeFile}`, "")

  // check if .env/development/ exists
    // halt if found?
    // create .env/
  // check if .env/development/app exists
  // halt if found?
  // create empty .env/development/app
}

initDocker();
