import { renderMustacheTemplate } from "./rendering.ts";

export default class ModTsTemplate {
  #scriptName: string;
  #moduleName: string;

  constructor(scriptName: string, moduleName: string,public filepath: string = "./mod.ts") {
    this.#scriptName = scriptName;
    this.#moduleName = moduleName;
    this.renderContents = this.renderContents.bind(this);
  }

  renderContents() {
    const values = { scriptName: this.#scriptName, moduleName: this.#moduleName };

    return renderMustacheTemplate(
      Template,
      this.filepath,
      values,
    );
  }
}

const Template = `/**
* Use this file to create an export entrypoint that others can reference.
* Aim to make references to any code in your module work like this:
* \`import { Thing } from "https://deno.land/x/coolThing@v1.0.0/mod.ts"\`
**/
export * as {{moduleName}} from "./{{scriptName}}";
`;
