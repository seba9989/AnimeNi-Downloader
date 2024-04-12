export default async function downloadVideo(
  url: string,
  fileName: string,
  path: string,
) {
  const startPath = Bun.env.START_PATH ?? "/download";

  const file = await fetch(url);
  const fullPath = `${startPath}/${path}/${fileName}.mp4`;
  try {
    await Bun.write(fullPath, file);
  } catch (err) {
    throw new Error("Download Error: ", { cause: err });
  }
}
