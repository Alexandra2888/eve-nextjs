import { eveChannel } from "eve/channels/eve";
import { localDev, placeholderAuth, vercelOidc } from "eve/channels/auth";

export default eveChannel({
  auth: [
    // Lets the eve TUI, server code and your Vercel deployments reach the agent.
    vercelOidc(),
    // Open on localhost for `eve dev` and `next dev`; ignored in production.
    localDev(),
    // Blocks browser requests in production until you add real auth (Auth.js, Clerk, …).
    placeholderAuth(),
  ],
});
