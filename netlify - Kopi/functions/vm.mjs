import { getStore } from "@netlify/blobs";

const ADMIN_CODE = "olesen2026";

export default async (req, context) => {
  const store = getStore("vm2026");
  const method = req.method;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  // GET: hent alle deltagere og resultater
  if (method === "GET") {
    if (action === "participants") {
      try {
        const data = await store.get("participants", { type: "json" });
        return new Response(JSON.stringify(data || []), { headers });
      } catch {
        return new Response("[]", { headers });
      }
    }
    if (action === "results") {
      try {
        const data = await store.get("results", { type: "json" });
        return new Response(JSON.stringify(data || {}), { headers });
      } catch {
        return new Response("{}", { headers });
      }
    }
  }

  // POST: gem tips eller resultater
  if (method === "POST") {
    const body = await req.json();

    if (action === "submit") {
      // Gem deltager tips
      let participants = [];
      try {
        participants = await store.get("participants", { type: "json" }) || [];
      } catch {}
      const existing = participants.findIndex(
        p => p.email === body.email || p.name === body.name
      );
      const entry = { name: body.name, email: body.email, tips: body.tips, points: 0, submitted: new Date().toISOString() };
      if (existing >= 0) participants[existing] = entry;
      else participants.push(entry);
      await store.set("participants", JSON.stringify(participants));
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    if (action === "results") {
      // Gem kampresultater (kræver admin kode)
      if (body.code !== ADMIN_CODE) {
        return new Response(JSON.stringify({ error: "Forkert kode" }), { status: 401, headers });
      }
      await store.set("results", JSON.stringify(body.results));
      // Genberegn point
      let participants = [];
      try {
        participants = await store.get("participants", { type: "json" }) || [];
      } catch {}
      const MATCHES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72];
      participants.forEach(p => {
        let pts = 0;
        MATCHES.forEach(id => {
          if (body.results[id] && p.tips[id] === body.results[id]) pts++;
        });
        p.points = pts;
      });
      await store.set("participants", JSON.stringify(participants));
      return new Response(JSON.stringify({ ok: true }), { headers });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers });
};

export const config = { path: "/api/vm" };
