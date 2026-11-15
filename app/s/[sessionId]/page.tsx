import { Suspense } from "react";
import { Chat } from "@/app/_components/chat";

async function SessionChat({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  // Key on the session so each conversation gets a fresh hook.
  return <Chat key={sessionId} sessionId={sessionId} />;
}

export default function SessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  return (
    <Suspense>
      <SessionChat params={params} />
    </Suspense>
  );
}
