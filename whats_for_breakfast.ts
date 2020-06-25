const NEW_LINE_AS_BYTE = new TextEncoder().encode("\n")[0];

/**
 * My first Deno class!
 * 
 * It is not a great example of programming but it is noteworthy for me as I explore DenoLand.
 * I'm sure there are some naïve aspects to this implementation, which I might come back to as I get more
 * experience with Deno.
 **/
class BreakfastReader {
  #inputting = true;
  #decoder = new TextDecoder();

  /**
   * This should be a private function / method for the class. It extracts the looped routine that reads a 
   * specified number of bytes from the provided stream.
   **/
  async bufferInputStream(inStream: Deno.Reader, bufferSize: number): Promise<string> {
    const buffer = new Uint8Array(bufferSize); // Array of unsigned 8 bit integers. But why 20?
    const readCount = await inStream.read(buffer); // Read from stdin into the buffer asynchronously, recording the 
                                             // number of bytes read afterwards
    if(readCount === null || readCount === 0) {
      // No bytes were read, so break from the loop
      this.#inputting = false;
      return "";
    }

    const indexOfNewLine = buffer.indexOf(NEW_LINE_AS_BYTE);

    if (indexOfNewLine > -1) {
      this.#inputting = false;
      return this.#decoder.decode(buffer.slice(0, indexOfNewLine));
    } else {
      return this.#decoder.decode(buffer);
    }
  }

  /**
   * This function started off as the `getStdin() method from https://deno.land/x/get_stdin/mod.ts / https://github.com/rjoydip/get_stdin/blob/master/mod.ts
   * I'm using it as the basis for learning a bit about using stdin and streams in Deno, and to help me better understand
   * `async` / `await` usage.
   **/
  async getBreakfast(): Promise<string> {
    let breakfast = [];

    const inStream = Deno.stdin; // the input stream, stdin

    while(this.#inputting) {
      breakfast.push(await this.bufferInputStream(inStream, 20)); 
    }

    return breakfast.join('');
  }
}

const breakfastReader = new BreakfastReader();

console.log("What's for breakfast?");
const breakfast = await breakfastReader.getBreakfast();

console.log(`${breakfast}? Tasty!`);
