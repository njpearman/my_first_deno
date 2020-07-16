import { stringify } from "../../deps.ts";

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
            "deno_cache:/home/deno/.module_cache",
          ],
          env_file: [
            ".env/development/app",
          ],
        },
      },
      volumes: {
        deno_cache: null
      }
    };

    // do the YAML
    return new Promise<string>((resolve) =>
      resolve(stringify(composeAsObject))
    );
  },
};

export default templater;
