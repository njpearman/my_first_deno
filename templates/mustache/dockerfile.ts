import { renderMustacheTemplate } from "./rendering.ts";

class DockerfileTemplate {
  #scriptName: string;
  #allows: string[];
  constructor(
    scriptName: string,
    allows: string[] = [],
    public filepath: string = "./Dockerfile",
  ) {
    this.#scriptName = scriptName;
    this.#allows = allows;
    this.renderContents = this.renderContents.bind(this);
  }

  renderContents() {
    console.log(`allows are: ${this.#allows.join(";")}`);
    let values: { scriptName: string; allows?: string } = {
      scriptName: this.#scriptName,
    };
    if (this.#allows.length > 0) {
      values.allows = this.#allows.map((allow) =>
        `"--allow-${allow}"`
      ).join(", ") + ", ";
    }
    return renderMustacheTemplate(
      Template,
      "./Dockerfile",
      values,
    );
  }
}

const Template = `FROM hayd/alpine-deno:1.1.1

USER deno

ENV DENO_INSTALL_ROOT "/home/deno/.deno"
ENV DENO_DIR "/home/deno/.module_cache"
RUN mkdir -p $DENO_INSTALL_ROOT $DENO_DIR

ENV PATH "$DENO_INSTALL_ROOT/bin:$PATH"

EXPOSE 4604

WORKDIR /app

ADD . .

RUN deno cache {{scriptName}}

ENTRYPOINT []

CMD ["deno", "run", {{&allows}} "{{scriptName}}"]`;

export default DockerfileTemplate;
