import { renderEmpty } from "./../rendering.ts";

const appDevelopmentEnvFile = "./.env/development/app";

const appDevelopmentEnvTemplate = {
  filepath: appDevelopmentEnvFile,
  renderContents: renderEmpty,
};

export default appDevelopmentEnvTemplate;
