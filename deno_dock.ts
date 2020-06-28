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

const dockerFile = "./Dockerfile";
const dockerComposeFile = "./docker-compose.yml";
const appDevelopmentEnvFile = "./.env/development/app";
const encoder = new TextEncoder();

async function createFileWithPath(fileWithPath: string, contents: string) {
  const filenameStartIndex = fileWithPath.lastIndexOf("/") + 1;
  const filename = fileWithPath.slice(filenameStartIndex);
  const filepath = fileWithPath.slice(0, filenameStartIndex);

  //   abort on `../`?
  //   abort on `/ ...`?
 
  // This is hardcoded for nixy paths and needs to be made more cleverer.
  if (filepath.length > 0 && filepath !== "./") {
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
          await Deno.mkdir(filepath, { recursive: true })
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

  // Is this necessary..? I understand the benefit of triggering things asynchronously but I doubt
  // that this is the way to do it.
  
  const files = {
    fileList: [dockerFile, dockerComposeFile, appDevelopmentEnvFile],
    [Symbol.asyncIterator]() {
      return {
        filesLeft: [...this.fileList],
        async next() {
          const currentFile = this.filesLeft.pop();
          if(currentFile) {
            await createFileWithPath(currentFile, "");
            return { done: false, value: currentFile };
          } else {
            return { done: true };
          }
        }
      };
    }
  };
  
  for await (let file of files) {
    console.log(`Worked ${file}`);
  }
}

initDocker();
