export type Message = string | Record<string, any>;

export type Send = (message: Message) => void;

export type FormData = {
  type: string;
  firstEpisode: number | null;
  lastEpisode: number | null;
  url: string;
};
