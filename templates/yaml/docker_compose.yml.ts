import { stringify } from "https://deno.land/std/encoding/yaml.ts";

const outputFile = "./docker-compose.yml";

const templater = {
  filepath: outputFile,
  renderContents: () => {
    const composeAsObject = {
      version: "3.4",
      services: {
        web: {
          build: ".",
          ports: [
            "4604:4604",
          ],
          volumes: [
            ".:/app",
          ],
          env_file: [
            ".env/development/app",
          ],
        },
      },
    };

    // do the YAML
    return new Promise<string>((resolve) =>
      resolve(stringify(composeAsObject))
    );
  },
};

export default templater;
