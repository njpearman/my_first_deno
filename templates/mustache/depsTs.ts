import { renderMustacheTemplate } from "./rendering.ts";

export default class DepTsTemplate {
  constructor(public filepath: string = "./deps.ts") {
    this.renderContents = this.renderContents.bind(this);
  }

  renderContents() {
    return renderMustacheTemplate(
      Template,
      this.filepath
    );
  }
}

const Template = `/**
* All external dependencies should be placed in this file as exports.
* Reference this file in your source code rather than having direct dependencies
* scattered around your source code.
* It's easier to manage this way!
*
* e.g. in this file, put:
* \`export { decode, encode } from "https://deno.land/std@0.61/encoding/base64.ts";\`
* and then in a file that needs base64 encoding, put:
* \`import { decode, encode } from "./deps.ts";\`
**/`;
