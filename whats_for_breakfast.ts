/**
 * This function is lifted from https://deno.land/x/get_stdin/mod.ts / https://github.com/rjoydip/get_stdin/blob/master/mod.ts
 * I'm using it as the basis for learning a bit about using stdin and streams in Deno, and to help me better understand
 * `async` / `await` usage.
 **/
async function getBreakfast() {
  let breakfast = "";

  const inStream = Deno.stdin; // the input stream, stdin
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let readCount: number | null = null; // number or null, in order to keep track of bytes read

  const returns = decoder.decode(Uint8Array.of(10)); // I luckily found Uint8Array.of while stumbling through the std/bytes docs. I would like to know where Uint8Array is fully documented
  const returnPlusEmpty = decoder.decode(Uint8Array.of(10, 0));

  if (returnPlusEmpty === returns) {
    console.log("Empty byte is dropped by decoder");
  } else {
    console.log(`Empty byte is included in resulting string: ${encoder.encode(returnPlusEmpty)}`);
  }

  while(true) {
    const buffer = new Uint8Array(20); // Array of unsigned 8 bit integers. But why 20?
    readCount = await inStream.read(buffer); // Read from stdin into the buffer asynchronously, recording the 
                                             // number of bytes read afterwards
    if(readCount === null || readCount === 0) {
      // no bytes were read, so break from the loop
      break;
    }

    for (const byte of buffer) {
      const character = decoder.decode(Uint8Array.of(byte));
      console.log(`Have byte ${byte} representing character ${character}`);
      
      if (byte === 0) {
        console.log("Breaking on empty");
        // I naïvely take this to be the start of end-padding in the buffer
        return breakfast;
      }

      if (character === "\n" || character === "\r") {
        console.log("Breaking on enter");
        // Enter will break from reading
        return breakfast;
      }

      breakfast += character;
    }
  }

  return breakfast
}

console.log("What's for breakfast?");
const breakfast = await getBreakfast();

console.log(`${breakfast}? Tasty!`);
