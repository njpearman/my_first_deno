import { parse, stringify } from "https://deno.land/std/encoding/yaml.ts";
import { Command } from "https://deno.land/x/cliffy@v0.10.0/packages/command/mod.ts";

import * as FileSystem from "./../file_system.ts";

const dockerComposeFilePath = "./docker-compose.yml";
const databaseEnvFilePath = "./.env/development/database";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const command = new Command()
  .throwErrors()
  .action(async () => {
    // check for docker-compose.yml
    if (!(await FileSystem.fileExists(dockerComposeFilePath))) {
      console.log(
        "No docker-compose.yml file found. Do you need to run `deno new`?",
      );
      Deno.exit(3);
    }

    // read YAML
    const yamlString = decoder.decode(
      await Deno.readFile(dockerComposeFilePath),
    );
    const dockerCompose: any = parse(yamlString);
    if (
      !dockerCompose.version ||
      !dockerCompose.services?.web?.env_file
    ) {
      console.log(
        `docker-compose.yml has an unexpected structure. Expected to match \n{ version, services: { web: { env_file }. database? }\n but got:`,
      );
      console.log(dockerCompose);
      Deno.exit(4);
    }

    if (dockerCompose.services.database) {
      console.log(
        `docker-compose.yml already contains a database service:\n${dockerCompose.services.database}`,
      );
      Deno.exit(5);
    }

    if (await FileSystem.fileExists(databaseEnvFilePath)) {
      const databaseDevEnv = new TextDecoder().decode(
        await Deno.readFile("./.env/development/database"),
      );
      const contentCheck = databaseDevEnv.split("\n").map((pair): number => {
        if (pair.match(/^POSTGRES_USER/)) {
          return 1;
        } else if (pair.match(/^POSTGRES_PASSWORD/)) {
          return 2;
        } else if (pair.match(/^POSTGRES_DB/)) {
          return 4;
        }
        return 0;
      }).reduce((total, current) => total + current);

      if (contentCheck != 0) {
        console.log(
          "Not continuing as .env/development/database already contained configuration values.",
        );
        Deno.exit(6);
      }
    }

    const fileContents = encoder.encode(
      "POSTGRES_USER=deno\nPOSTGRES_PASSWORD=password\nPOSTGRES_DB=deno\nPOSTGRES_HOST=database",
    );
    await Deno.writeFile(databaseEnvFilePath, fileContents);

    dockerCompose.services.web.env_file = [
      ...dockerCompose.services.web.env_file,
      databaseEnvFilePath,
    ];

    dockerCompose.services.database = {
      image: "postgres",
      ports: [
        '5432:5432',
      ],
      env_file: [
        databaseEnvFilePath,
      ],
    };

    const newDockerCompose = stringify(dockerCompose);
    await Deno.writeFile(
      dockerComposeFilePath,
      encoder.encode(newDockerCompose),
    );

    console.log("Finished adding database service to docker-compose.yml");
    console.log(newDockerCompose);
  });

export default command;
