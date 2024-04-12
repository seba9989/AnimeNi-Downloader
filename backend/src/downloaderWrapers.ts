import type { ServerWebSocket } from "bun";
import {
  animeNiEpisodeScraper,
  animeNiSeriesScraper,
  cdaScraper,
} from "./scrapers";
import type { Send } from "./types";
import { cdaApiSupport } from "./cdaApiSupport";
import downloadVideo from "./downloadVideo";

let errorCount = 0;
const maxErrorCount = Number(Bun.env.MAX_ERROR_COUNT ?? 5);

export async function downloadOne(url: string, send: Send) {
  try {
    const { cdaUrl, series, title } = await animeNiEpisodeScraper(url);
    const playerData = await cdaScraper(cdaUrl);
    const videoUrl = await cdaApiSupport(playerData);

    send({ startDownloading: title, videoUrl });
    await downloadVideo(videoUrl, title, series);
    send("Done: " + title);

    errorCount = 0;
  } catch (err) {
    if (errorCount >= maxErrorCount) {
      throw new Error("Full download Error: ", { cause: err });
    }

    errorCount++;

    console.error("Download Error: ", { cause: err });
    console.error("Error Count: ", errorCount);

    await downloadOne(url, send);
  }
}

export async function downloadMany(
  url: string,
  firstEpisode: number | null,
  lastEpisode: number | null,
  send: Send,
) {
  const { lastEpisodeNumber, baseEpisodeUrl } = await animeNiSeriesScraper(url);
  firstEpisode = firstEpisode ?? 1;

  if (lastEpisode === null || lastEpisode > lastEpisodeNumber) {
    lastEpisode = lastEpisodeNumber;
  }

  send({
    episodes: `${firstEpisode} - ${lastEpisode}`,
    baseEpisodeUrl,
  });

  for (let i = firstEpisode; i <= lastEpisode; i++) {
    url = i < 10 ? `${baseEpisodeUrl}0${i}` : `${baseEpisodeUrl}${i}`;
    await downloadOne(url, send);
  }
}


export async function downloadFull(
  url: string,
  send: Send,
) {
  const { lastEpisodeNumber, baseEpisodeUrl } = await animeNiSeriesScraper(url);

  send({
    episodes: `1 - ${lastEpisodeNumber}`,
    baseEpisodeUrl,
  });

  for (let i = 1; i <= lastEpisodeNumber; i++) {
    url = i < 10 ? `${baseEpisodeUrl}0${i}` : `${baseEpisodeUrl}${i}`;
    await downloadOne(url, send);
  }
}
