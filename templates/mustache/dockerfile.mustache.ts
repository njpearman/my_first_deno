import Mustache from "https://raw.githubusercontent.com/janl/mustache.js/v4.0.1/mustache.mjs";

class TemplateError extends Deno.errors.NotFound {
  constructor(templateName: string, cause: Error) {
    super(`Unable to read template ${templateName}. Underlying error: ${cause}`);
  }
}


/**
 * Using `Mustache` here produces a TS error in Vim:
 * Cannot invoke an object that is possibly undefined.
 *
 * However, Deno runs happily with this code. I've tried to hunt around for the reason that it
 * happens and can't find anything. It might be because the language server implementation doesn't
 * know how to handle external imports fully, or because I'm not strictly importing the module
 * correctly.
 **/
const renderMustacheTemplate = async (
  template: string,
  templateName: string,
  values: object = {},
) => {
    try {
      return Mustache.render(template, values);
    } catch (err) {
      throw new TemplateError(templateName, err);
    }
};

class DockerfileTemplate {
  #scriptName: string;
  #allows: string[];
  constructor(scriptName: string, allows: string[] = [], public filepath: string = "./Dockerfile") {
    this.#scriptName = scriptName;
    this.#allows = allows;
    this.renderContents = this.renderContents.bind(this);
  }

  renderContents() {
    console.log(`allows are: ${this.#allows.join(";")}`);
    let values: { scriptName: string, allows?: string } = { scriptName: this.#scriptName };
    if (this.#allows.length > 0) {
      values.allows = this.#allows.map(allow => `"--allow-${allow}"`).join(", ") + ", ";
    }
    return renderMustacheTemplate(
      Template,
      "./Dockerfile",
      values,
    );
  }
}

const Template = ` FROM hayd/alpine-deno:1.1.1

EXPOSE 4604

WORKDIR /app

USER deno

ADD . .

RUN deno cache {{scriptName}}

CMD ["run", {{&allows}} "{{scriptName}}"]`;

export default DockerfileTemplate;

