import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { classifyEffort, effortToScore } from "@/lib/effort";
import { buildSystemPrompt } from "@/lib/system-prompt";
import OpenAI from "openai";

const MAX_TURNS = 20;
const MAX_MESSAGE_LENGTH = 2000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Simple in-memory rate limiter (per access token)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // max messages per window
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.slice(0, MAX_MESSAGE_LENGTH) : "";
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";

    if (!message || !accessToken) {
      return new Response(
        JSON.stringify({ error: "Message and accessToken are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (isRateLimited(accessToken)) {
      return new Response(
        JSON.stringify({ error: "Slow down! Too many messages. Try again in a minute." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find session by access token
    const session = await prisma.session.findUnique({
      where: { accessToken },
      include: {
        turns: { orderBy: { createdAt: "asc" } },
        child: true,
      },
    });

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (session.endedAt) {
      return new Response(
        JSON.stringify({ error: "Session has ended" }),
        { status: 410, headers: { "Content-Type": "application/json" } }
      );
    }

    // Count kid turns
    const kidTurnCount = session.turns.filter((t) => t.role === "kid").length;
    if (kidTurnCount >= MAX_TURNS) {
      await prisma.session.update({
        where: { id: session.id },
        data: { endedAt: new Date() },
      });
      return new Response(
        JSON.stringify({
          error: "Session complete",
          message: `Amazing thinking today! You asked ${kidTurnCount} great questions. Let's pick up next time!`,
        }),
        { status: 410, headers: { "Content-Type": "application/json" } }
      );
    }

    // Classify effort
    const effortLevel = classifyEffort(message);
    const effortScore = effortToScore(effortLevel);

    // Save kid's turn
    await prisma.turn.create({
      data: {
        sessionId: session.id,
        role: "kid",
        content: message,
        effortScore,
      },
    });

    // Update topic from first message if not set
    if (!session.topic && kidTurnCount === 0) {
      const topic = message.slice(0, 100);
      await prisma.session.update({
        where: { id: session.id },
        data: { topic },
      });
    }

    // Build conversation history for AI
    const totalTurnCount = kidTurnCount + 1;
    const systemPrompt = buildSystemPrompt(effortLevel, totalTurnCount);

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    for (const turn of session.turns) {
      messages.push({
        role: turn.role === "kid" ? "user" : "assistant",
        content: turn.content,
      });
    }

    // Add current message
    messages.push({ role: "user", content: message });

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages,
      stream: true,
      max_completion_tokens: 150,
      temperature: 0.7,
    });

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Save AI response
          await prisma.turn.create({
            data: {
              sessionId: session.id,
              role: "ai",
              content: fullResponse,
              effortScore: 0,
            },
          });

          // Check if session should end after this turn
          const newKidTurnCount = kidTurnCount + 1;
          if (newKidTurnCount >= MAX_TURNS) {
            await prisma.session.update({
              where: { id: session.id },
              data: { endedAt: new Date() },
            });
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ sessionEnded: true, message: `Amazing thinking today! You asked ${newKidTurnCount} great questions. Let's pick up next time!` })}\n\n`
              )
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "AI service error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
