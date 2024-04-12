export async function cdaApiSupport(playerData: string) {
  const videoData = JSON.parse(playerData)["video"];
  videoData.title = decodeURIComponent(videoData.title);

  const qualities = Object.values(videoData.qualities);
  let videoQuality;
  switch (Bun.env.QUALITY) {
    case "min":
      videoQuality = qualities[0];
      break;
    case "max":
      videoQuality = qualities[qualities.length - 1];
      break;
    default:
      videoQuality = qualities[qualities.length / 2];
  }

  const cdaApiParams = await JSON.stringify({
    jsonrpc: "2.0",
    method: "videoGetLink",
    params: [videoData.id, videoQuality, videoData.ts, videoData.hash2, {}],
    id: 1,
  });
  try {
    const cdaApiResponse = await fetch("https://www.cda.pl:443/", {
      method: "POST",
      body: cdaApiParams,
      headers: { "User-Agent": "Chrome" },
    });

    const videoURL: string = (await cdaApiResponse.json()).result.resp;

    return videoURL;
  } catch (err) {
    throw new Error("CdaApi Error: ", { cause: err });
  }
}
