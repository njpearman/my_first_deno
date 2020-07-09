const Template = `version: "3.4"

services:
  web:
    build: .
    ports:
      - "4604:4604"
    volumes:
      - .:/app
    env_file:
      - .env/development/app`;

export default Template;
