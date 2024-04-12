import {
  downloadFull,
  downloadMany,
  downloadOne,
} from "./src/downloaderWrapers";
import type { FormData, Message } from "./src/types";

let server = Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      return;
    }
  },
  websocket: {
    
    message: async function (ws, message: string) {
      const send = (message: Message) => {
        if (typeof message === "string") {
          ws.send(message);
        } else if (typeof message === "object") {
          let toSend: string = "";
          for (let key in message) {
            const values = message[key];
            const id = key
              .split(/(?=[A-Z])/)
              .join(" ")
              .toLowerCase();
            const name = id.charAt(0).toUpperCase() + id.slice(1);

            toSend = toSend + `${name}: ${values} \n`;
          }

          ws.send(toSend);
        }
      };

      const messageData: FormData = JSON.parse(message);
      console.log("message: ", messageData);

      // const { cdaUrl, series, title } = await animeNiEpisodeScraper(
      //   messageData.url,
      // );
      // const cdaData = await cdaScraper(cdaUrl);
      if (messageData.type === "one") {
        await downloadOne(messageData.url, send);
      }

      if (messageData.type === "many") {
        await downloadMany(
          messageData.url,
          messageData.firstEpisode,
          messageData.lastEpisode,
          send,
        );
      }

      if (messageData.type === "full") {
        await downloadFull(messageData.url, send);
      }

      //   ws.close();
    },
  },
});

console.log(server.port);
