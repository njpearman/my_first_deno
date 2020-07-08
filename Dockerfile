FROM hayd/alpine-deno:1.1.1

EXPOSE 4604

WORKDIR /app

USER deno

ADD . .

RUN deno cache my_first_oak.ts

CMD ["run", "--allow-read", "--allow-net",  "my_first_oak.ts"]
