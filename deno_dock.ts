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

async function createFileWithPath(item: Deno.DirEntry, fileWithPath: string, contents: string) {
  const filenameStartIndex = fileWithPath.lastIndexOf("/") + 1;
  const filename = fileWithPath.slice(filenameStartIndex);
  const filepath = fileWithPath.slice(0, filenameStartIndex);

  // handle a nested path here.
  //   abort on `../`?
  //   abort on `/ ...`?

  if (item.name === filename && !item.isFile) {
    console.log(`Expected ${fileWithPath} to be a file; found a directory`);
  } else if (item.name === filename) {
    console.log(`Found existing ${filename}`);
    // halt if found?
  } else {
    // create Dockerfile
    const encodedContents = encoder.encode(contents);
    await Deno.writeFile(`${filepath}${filename}`, encodedContents);
  }
}

async function initDocker() {
  for await (const item of Deno.readDir(".")) {
    createFileWithPath(item, `./${dockerFile}`, "")
    createFileWithPath(item, `./${dockerComposeFile}`, "")

    // check if .env/development/ exists
    if (item.name === envFolder) {
      console.log("Found existing .env/");
      // halt if found?
    } else {
      // create .env/
    }
    // check if .env/development/app exists
    // halt if found?
    // create empty .env/development/app
  }
}

initDocker();
