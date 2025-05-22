export const dynamic = 'force-dynamic';

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sessions from "./session";

export default async function Page() {
  const [session, activeSessions] =
    await Promise.all([
      auth.api.getSession({
        headers: await headers(),
      }),
      auth.api.listSessions({
        headers: await headers(),
      }),
      auth.api.listDeviceSessions({
        headers: await headers(),
      }),
    ]).catch((e) => {
      console.log(e);
      throw redirect("/auth");
    });
  return (
    <main className="flex items-center justify-center min-h-[100%] relative p-4">
      <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
        <Sessions
          session={JSON.parse(JSON.stringify(session))}
          activeSessions={JSON.parse(JSON.stringify(activeSessions))}
        />
      </div>
    </main>
  );
}