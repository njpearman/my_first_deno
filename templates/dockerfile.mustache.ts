const Template = ` FROM hayd/alpine-deno:1.1.1

EXPOSE 4604

WORKDIR /app

USER deno

ADD . .

RUN deno cache {{scriptName}}

CMD ["run", {{&allows}} "{{scriptName}}"]`;

export default Template;

