import { User } from "https://deno.land/x/grammy@v1.7.0/platform.deno.ts";

type Song = {
  artist: string;
  title: string;
  url: URL;
  id: string;
  fmt: string;
  requester: User;
};

export default Song;
