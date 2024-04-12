<script lang="ts">
  import {
    number,
    object,
    parse,
    string,
    type Output,
    nullable,
    picklist,
    startsWith,
  } from "valibot";

  const FormSchema = object({
    type: picklist(["one", "many", "full"]),
    firstEpisode: nullable(number()),
    lastEpisode: nullable(number()),
    url: string([
      startsWith("https://animeni.pl", "Please enter AnimeNi url."),
    ]),
  });

  let formData: Output<typeof FormSchema> = {
    type: "one",
    firstEpisode: null,
    lastEpisode: null,
    url: "",
  } as Output<typeof FormSchema>;

  type Message = {
    author: "client" | "server";
    message: string | Output<typeof FormSchema>;
  };

  let messages: Message[] = [];
  let socket: WebSocket;
  const connectWs = () => {
    socket = new WebSocket("ws://localhost:3000");

    socket.addEventListener("message", (e) => {
      console.log(e.data);

      console.log({ author: "server", message: e.data });
      messages = [...messages, { author: "server", message: e.data }];
    });

    socket.addEventListener("close", (e) => {
      messages = [
        ...messages,
        { author: "server", message: "Connection closed" },
      ];
    });

    socket.addEventListener("open", (e) => {
      messages = [
        ...messages,
        { author: "server", message: "Connection open" },
      ];
    });
  };
  connectWs();

  const sendData = () => {
    try {
      let parsedData = parse(FormSchema, formData);

      if (parsedData.type !== "many") {
        parsedData = {
          ...parsedData,
          firstEpisode: null,
          lastEpisode: null,
        };

        parsedData = parse(FormSchema, parsedData);
      }

      messages = [
        ...messages,
        {
          author: "client",
          message: parsedData,
        },
      ];

      console.log(parsedData);
      socket.send(JSON.stringify(parsedData));
    } catch (err: any) {
      console.log(err);

      messages = [
        ...messages,
        {
          author: "client",
          message: err.message,
        },
      ];
    }
  };

  const resetForm = () => {
    formData = {
      type: "one",
      firstEpisode: null,
      lastEpisode: null,
      url: "",
    };
  };
</script>

<main class="grid w-screen h-screen grid-cols-2">
  <div class="p-4">
    <form class="grid gap-4" on:submit|preventDefault>
      <div class="grid grid-flow-col gap-4 justify-items-stretch">
        <select
          class="select select-bordered"
          name="type"
          id="type"
          bind:value={formData.type}
        >
          <option value="one">one</option>
          <option value="many">many</option>
          <option value="full">full</option>
        </select>

        <input
          type="number"
          class="input input-bordered"
          placeholder="First episode"
          bind:value={formData.firstEpisode}
          class:input-disabled={formData.type !== "many"}
          disabled={formData.type !== "many"}
        />

        <input
          type="number"
          class="input input-bordered"
          placeholder="Last episode"
          bind:value={formData.lastEpisode}
          class:input-disabled={formData.type !== "many"}
          disabled={formData.type !== "many"}
        />
      </div>
      <input
        type="text"
        class="input input-bordered"
        placeholder="AnimeNi url"
        bind:value={formData.url}
      />
      <div class="grid grid-flow-col gap-4">
        <button type="reset" on:click={resetForm} class="btn btn-error">
          Clear
        </button>
        <button type="submit" class="btn btn-primary" on:click={sendData}>
          Send
        </button>
      </div>
      <button class="btn" on:click={connectWs}>Reconnect</button>
    </form>
  </div>
  <!-- Console -->
  <div class="card bg-base-300 m-4 p-4 overflow-auto flex-col-reverse">
    <div class="flex flex-col gap-4">
      {#each messages as message, i}
        {#if message.author === "client"}
          <div class="chat chat-start">
            {i}
            <div class="chat-bubble">
              {#if typeof message.message === "object"}
                Download: {message.message.url} <br />
                {#if message.message.type === "many"}
                  Episode:
                  {message.message.firstEpisode ?? "first"}
                  -
                  {message.message.lastEpisode ?? "end"}
                {/if}
              {:else}
                {message.message}
              {/if}
            </div>
          </div>
        {:else}
          {@const content = message.message}
          <div class="chat chat-end">
            <div
              class="chat-bubble whitespace-pre-line"
              class:chat-bubble-error={content === "Connection closed"}
              class:chat-bubble-success={content === "Connection open"}
            >
              {content}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</main>
