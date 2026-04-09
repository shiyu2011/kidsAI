import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { classifyEffort, effortToScore } from "@/lib/effort";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { detectProject, getCurrentPhase } from "@/lib/projects";
import OpenAI from "openai";

const MAX_TURNS_CHAT = 20;
const MAX_TURNS_PROJECT = 40;
const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT = 30; // max kid messages per window
const RATE_WINDOW_MS = 60_000; // 1 minute

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

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

    // DB-based rate limit: count kid turns in this session within the last minute
    const windowStart = new Date(Date.now() - RATE_WINDOW_MS);
    const recentCount = await prisma.turn.count({
      where: {
        sessionId: session.id,
        role: "kid",
        createdAt: { gte: windowStart },
      },
    });
    if (recentCount >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({ error: "Slow down! Too many messages. Try again in a minute. Want more access or have feedback? Email shiyu.xu@precisionxbio.com" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Detect project from first message in the session
    const firstKidTurn = session.turns.find((t) => t.role === "kid");
    const project = firstKidTurn ? detectProject(firstKidTurn.content) : detectProject(message);
    const maxTurns = project ? MAX_TURNS_PROJECT : MAX_TURNS_CHAT;

    // DB-based turn count (atomic — prevents race conditions on double-click)
    const kidTurnCount = await prisma.turn.count({
      where: { sessionId: session.id, role: "kid" },
    });
    if (kidTurnCount >= maxTurns) {
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
    const systemPrompt = buildSystemPrompt(effortLevel, totalTurnCount, project);

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
      max_completion_tokens: project ? 250 : 150,
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
          const aiTurn = await prisma.turn.create({
            data: {
              sessionId: session.id,
              role: "ai",
              content: fullResponse,
              effortScore: 0,
            },
          });

          // Generate image at project phase transitions
          const newKidTurnCount = kidTurnCount + 1;
          if (project) {
            const prevPhaseInfo = kidTurnCount > 0 ? getCurrentPhase(project, kidTurnCount) : null;
            const currPhaseInfo = getCurrentPhase(project, newKidTurnCount);

            // Only trigger image when phase actually changes, or at final turn
            const phaseChanged = prevPhaseInfo !== null && prevPhaseInfo.index !== currPhaseInfo.index;
            const isLastTurn = newKidTurnCount >= maxTurns;

            if (phaseChanged || isLastTurn) {
              // The phase that just completed is the one that might need an image
              const completedPhase = prevPhaseInfo?.phase ?? currPhaseInfo.phase;

              if (completedPhase.generateImage && completedPhase.imagePromptHint) {
                // Check we haven't already generated an image for this session recently
                const existingImages = await prisma.turn.count({
                  where: { sessionId: session.id, imageUrl: { not: null } },
                });
                const maxImages = 3;

                if (existingImages < maxImages) {
                  try {
                    const kidMessages = [...session.turns.filter((t) => t.role === "kid").map((t) => t.content), message].slice(-4).join(". ");
                    const imagePrompt = `${completedPhase.imagePromptHint}. Based on the kid's ideas: ${kidMessages.slice(0, 300)}. Style: colorful, fun, safe for children, no text or words in the image.`;

                    const imageResponse = await openai.images.generate({
                      model: "dall-e-3",
                      prompt: imagePrompt,
                      n: 1,
                      size: "1024x1024",
                      quality: "standard",
                    });

                    const imageUrl = imageResponse.data?.[0]?.url;
                    if (imageUrl) {
                      await prisma.turn.update({
                        where: { id: aiTurn.id },
                        data: { imageUrl },
                      });
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ image: imageUrl })}\n\n`)
                      );
                    }
                  } catch (imgErr) {
                    console.error("Image generation failed:", imgErr);
                  }
                }
              }
            }
          }

          // Check if session should end after this turn
          if (newKidTurnCount >= maxTurns) {
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
