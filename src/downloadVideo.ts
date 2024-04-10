import * as cheerio from "cheerio";
import Bun from "bun";

async function scrapAnimeNiSeries(AnimeNiUrl: string) {
  const AnimeNiResponse = await fetch(AnimeNiUrl);
  const AnimeNiHtml = await AnimeNiResponse.text();
  const AnimeNi$ = cheerio.load(AnimeNiHtml);

  const lostEpisode = AnimeNi$("span:contains('Nowy Odcinek')");

  const lostEpisodeUrl = lostEpisode.parent().prop("href");
  if (!lostEpisodeUrl)
    throw new Error("Link do AnimeNi jest błędny:", {
      cause: "Nie można odnaleźć span:contains('Nowy Odcinek')",
    });
  const lostEpisodeNumber = Number(
    lostEpisodeUrl
      .split("-")
      [lostEpisodeUrl.split("-").length - 1].replace("/", ""),
  );
  const baseEpisodeUrl = lostEpisodeUrl.replace(lostEpisodeNumber + "/", "");
  const series = AnimeNi$("h1.entry-title").text();
  // console.log(baseEpisodeUrl);
  return {
    baseEpisodeUrl,
    lostEpisodeNumber,
    series,
  };
}

async function scrapAnimeNi(AnimeNiUrl: string) {
  const AnimeNiResponse = await fetch(AnimeNiUrl);
  const AnimeNiHtml = await AnimeNiResponse.text();
  const AnimeNi$ = cheerio.load(AnimeNiHtml);

  const CdaUrl = AnimeNi$("#pembed iframe").prop("src");
  const series = AnimeNi$("#singlepisode h2 > a").text();
  const title = AnimeNi$(".entry-title").text();

  if (CdaUrl !== undefined) {
    return {
      CdaUrl,
      series,
      title,
    };
  } else {
    throw new Error("Link do AnimeNi jest błędny:", {
      cause: "Nie można odnaleźć cda iframe",
    });
  }
}

async function scrapCda(CdaUrl: string) {
  const CdaResponse = await fetch(CdaUrl);
  const CdaHtml = await CdaResponse.text();
  const Cda$ = cheerio.load(CdaHtml);
  const playerData = Cda$("div[player_data]").attr("player_data");
  if (playerData !== undefined) {
    return playerData;
  } else {
    throw new Error("Link do Cda jest błędny:", {
      cause: "Nie można odnaleźć player_data",
    });
  }
}

async function extractVideoUrl(playerData: string) {
  const videoData = JSON.parse(playerData)["video"];
  videoData.title = decodeURIComponent(videoData.title);

  const qualities = Object.values(videoData.qualities);
  let ql;
  if (Bun.env.QUALITY == "low") {
    ql = qualities[1]; // low quality
  } else if (Bun.env.QUALITY == "high") {
    ql = qualities[qualities.length - 1]; // high quality
  }

  const CdaApiParams = await JSON.stringify({
    jsonrpc: "2.0",
    method: "videoGetLink",
    params: [videoData.id, ql, videoData.ts, videoData.hash2, {}],
    id: 1,
  });

  const CdaApiResponse = await fetch("https://www.cda.pl:443/", {
    method: "POST",
    body: CdaApiParams,
    headers: { "User-Agent": "Chrome" },
  });
  const videoURL = (await CdaApiResponse.json()).result.resp;
  // console.log(videoURL);
  return videoURL;
}

async function downloadVideo(videoURL: string, path: string, fileName: string) {
  console.log("Downloading: ", fileName, "URL: ", videoURL);
  const startPath = Bun.env.START_PATH ?? ".";
  const file = await fetch(videoURL);
  const fullPath = `${startPath}/${path}/${fileName}.mp4`;
  try {
    await Bun.write(fullPath, file);
    console.log("Done: ", fullPath);
  } catch (err) {
    throw new Error("Download Error: ", { cause: err });
  }
}

let errorCount = 0; // Error counter
const MaxErrorCount = Number(Bun.env.MAX_ERROR_COUNT) ?? 5;
// Downloader
export async function downloadAnimeNiEpisode(AnimeNiUrl: string) {
  try {
    console.log(AnimeNiUrl);
    const { CdaUrl, series, title } = await scrapAnimeNi(AnimeNiUrl);
    const playerData = await scrapCda(CdaUrl);
    const videoURL = await extractVideoUrl(playerData);
    await downloadVideo(videoURL, series, title);
  } catch (err) {
    if (errorCount >= MaxErrorCount) {
      throw new Error("Full download Error: ", { cause: err });
    }

    errorCount++;
    console.error("Download Error: ", { cause: err });
    console.error("Error Count: ", errorCount);
    await downloadAnimeNiEpisode(AnimeNiUrl);
  }

  errorCount = 0;
}

export async function downloadAnimeNiSeries(
  AnimeNiUrl: string,
  startEpisode: number = 1,
  endEpisode?: number,
) {
  const { baseEpisodeUrl, lostEpisodeNumber, series } =
    await scrapAnimeNiSeries(AnimeNiUrl);

  endEpisode = endEpisode ?? lostEpisodeNumber;

  for (let i = startEpisode; i <= endEpisode; i++) {
    const episodeNumber = i < 10 ? `0${i}` : i;
    const episodeUrl = baseEpisodeUrl + episodeNumber;
    // console.log(episodeUrl);
    await downloadAnimeNiEpisode(episodeUrl);
  }

  console.log(`Done Series: ${series}   ${startEpisode}-${endEpisode}`);
}
