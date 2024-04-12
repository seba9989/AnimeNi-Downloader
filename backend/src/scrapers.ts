import * as cheerio from "cheerio";

export async function animeNiSeriesScraper(url: string) {
  const html = await (await fetch(url)).text();
  const $ = cheerio.load(html);

  const lastEpisode = $("span:contains('Nowy Odcinek')").parent();

  const lastEpisodeNumber = Number(lastEpisode.find(".epcur").text().split(" ")[1]);

  const lastEpisodeUrl = lastEpisode.attr("href");
  if (lastEpisodeUrl === undefined) {
    throw new Error("Link do AnimeNi jest błędny:", {
      cause: "Nie można odnaleźć span:contains('Nowy Odcinek')",
    });
  }
  const baseEpisodeUrl = lastEpisodeUrl.replace(lastEpisodeNumber + "/", "");

  const seriesTitle = $("h1.entry-title").text();

  return {
    lastEpisodeNumber,
    baseEpisodeUrl,
    seriesTitle,
  };
}

export async function animeNiEpisodeScraper(url: string) {
  const html = await (await fetch(url)).text();
  const $ = cheerio.load(html);

  const cdaUrl = String($("#pembed iframe").prop("src"));
  const series = $("#singlepisode h2 > a").text();
  const title = $(".entry-title").text();

  return { cdaUrl, series, title };
}

export async function cdaScraper(url: string) {
  const html = await (await fetch(url)).text();
  const $ = cheerio.load(html);

  const playerData = String($("div[player_data]").attr("player_data"));

  return playerData;
}
