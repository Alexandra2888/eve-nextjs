import { eveChannel } from "eve/channels/eve";
import { localDev, none, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // Lets the eve TUI, server code and your Vercel deployments reach the agent.
    vercelOidc(),
    // Open on localhost for `eve dev` and `next dev`.
    localDev(),
    // Public demo: anyone with the URL can chat (and spend your Anthropic/OpenAI credits).
    // Swap for real auth (Auth.js, Clerk, httpBasic(...)) before sharing the URL widely.
    none(),
  ],
});
