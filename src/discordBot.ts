import { Client, IntentsBitField } from "discord.js";
import { downloadAnimeNiEpisode, downloadAnimeNiSeries } from "./downloadVideo";
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("messageCreate", async (msg) => {
  const msgParts = msg.content.split(" ");
  switch (msgParts[0]) {
    case "/full":
      const seriesUrl = msgParts[1];
      const startEpisode =
        msgParts.length >= 3 ? Number(msgParts[2]) : undefined;
      const endEpisode = msgParts.length >= 4 ? Number(msgParts[3]) : undefined;
      downloadAnimeNiSeries(seriesUrl, startEpisode, endEpisode);
      break;
    case "/one": {
      const seriesUrl = msgParts[1];
      downloadAnimeNiEpisode(seriesUrl);
      break;
    }
    default:
      break;
  }
});

client.login(Bun.env.DISCORD_API_TOKEN);

