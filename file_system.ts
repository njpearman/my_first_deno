class NotFound {}

async function isDirectoryCheck(filepath: string) {
  const info = Deno.lstat(filepath);

  if (!(await info).isDirectory) {
    // we have a problem
    throw new Error(`Expected ${filepath} to be a directory`);
  }
}

async function makeDirectory(filepath: string) {
  try {
    // make the directory!
    await Deno.mkdir(filepath, { recursive: true });
  } catch (err) {
    console.log(`Unable to create directory ${filepath}`);
    throw err;
  }
}

async function ignoreNotFound<T>(
  fileSystemOperation: () => Promise<T>,
): Promise<T | NotFound> {
  try {
    return await fileSystemOperation();
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return new Promise((resolve) => resolve(new NotFound()));
    } else {
      console.log(`Error ignoring not found: ${error}`);
      throw error;
    }
  }
}

export async function ensureDirectoryExists(filepath: string) {
  await ignoreNotFound(() => isDirectoryCheck(filepath));
  await makeDirectory(filepath);
}

export async function removeWithLogging(
  fileSystemObject: string,
  options: any = {},
) {
  ignoreNotFound(() => Deno.remove(fileSystemObject, options));
  console.log(`Removed ${fileSystemObject}`);
}

/**
   * Essentially a modified copy of
   * [std/fs/exists.ts](https://github.com/denoland/deno/blob/v1.1.2/std/fs/exists.ts).
   * I'm using my own implementation because, at the time of writing, I'd prefer to have control over any 
   * specifics I might need rather than importing a small function that might make things harder for me to
   * understand or implement.
   */
export async function fileExists(fileWithPath: string) {
  // for my reference, lstat gets info about the symlink source, i.e. the original file/dir, rather than
  // the symlink itself
  const fileInfoOrNotFound = await ignoreNotFound(() =>
    Deno.lstat(fileWithPath)
  );

  if (fileInfoOrNotFound instanceof NotFound) {
    console.log(`Found existing ${fileWithPath}`);
    return true;
  } else if (!fileInfoOrNotFound.isFile) {
    console.log(`Expected ${fileWithPath} to be a file; found a directory`);
  }
}
