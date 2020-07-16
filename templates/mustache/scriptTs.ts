import { renderMustacheTemplate } from "./rendering.ts";

export default class ScriptTsTemplate {
  constructor(public filepath: string = "./main.ts") {
    this.renderContents = this.renderContents.bind(this);
  }

  renderContents() {
    return renderMustacheTemplate(
      Template,
      this.filepath,
    );
  }
}

const Template = `/**
* Create your deno script in this file. Happy coding!
**/
`;
