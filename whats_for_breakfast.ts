/**
 * This function is lifted from https://deno.land/x/get_stdin/mod.ts / https://github.com/rjoydip/get_stdin/blob/master/mod.ts
 * I'm using it as the basis for learning a bit about using stdin and streams in Deno, and to help me better understand
 * `async` / `await` usage.
 **/
async function getBreakfast() {
  let breakfast = "";

  const inStream = Deno.stdin; // the input stream, stdin
  const decoder = new TextDecoder();
  let readCount: number | null = null; // number or null, in order to keep track of bytes read

  const newLineAsByte = new TextEncoder().encode("\n");

  let inputting = true;

  while(inputting) {
    const buffer = new Uint8Array(20); // Array of unsigned 8 bit integers. But why 20?
    readCount = await inStream.read(buffer); // Read from stdin into the buffer asynchronously, recording the 
                                             // number of bytes read afterwards
    if(readCount === null || readCount === 0) {
      // no bytes were read, so break from the loop
      break;
    }

    const indexOfNewLine = buffer.indexOf(newLineAsByte[0]);

    if (indexOfNewLine > -1) {
      inputting = false;
      const bufferedInputFragment = decoder.decode(buffer.slice(0, indexOfNewLine));
      breakfast += bufferedInputFragment;
    } else {
      const bufferedInputFragment = decoder.decode(buffer);
      breakfast += bufferedInputFragment;
    }
  }

  return breakfast
}

console.log("What's for breakfast?");
const breakfast = await getBreakfast();

console.log(`${breakfast}? Tasty!`);
