import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { detectProject } from "@/lib/projects";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

const IMAGE_MILESTONES = [5, 12, 20]; // early concept, mid-project, final
const MAX_BASE_IMAGES = 3;
const MAX_BONUS_IMAGES = 2;
const BREAKTHROUGH_THRESHOLD = 3; // breakthrough scores needed per bonus image

// Per-IP rate limit to prevent abuse even with leaked tokens
const ipRateLimit = new Map<string, { count: number; resetAt: number }>();
const IP_LIMIT = 10; // max image requests per IP per hour
const IP_WINDOW_MS = 60 * 60_000;

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRateLimit.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= IP_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getIp(request);
    if (!checkIpRateLimit(ip)) {
      return new Response(JSON.stringify({ skip: true, reason: "ip-rate-limit" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { accessToken } = await request.json();
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Token required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await prisma.session.findUnique({
      where: { accessToken },
      include: {
        turns: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Block ended sessions — no image generation for closed sessions
    if (session.endedAt) {
      return new Response(JSON.stringify({ skip: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Detect project
    const firstKidTurn = session.turns.find((t) => t.role === "kid");
    const project = firstKidTurn ? detectProject(firstKidTurn.content) : null;
    if (!project) {
      return new Response(JSON.stringify({ skip: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Count existing images and kid turns
    const existingImages = await prisma.turn.count({
      where: { sessionId: session.id, imageUrl: { not: null } },
    });
    const kidTurns = session.turns.filter((t) => t.role === "kid");
    const kidTurnCount = kidTurns.length;

    // Prevent re-generating for the same AI turn (key fix: attacker can't reuse milestone)
    const lastAiTurn = [...session.turns].reverse().find((t) => t.role === "ai");
    if (lastAiTurn?.imageUrl) {
      return new Response(JSON.stringify({ skip: true, reason: "already-has-image" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Count breakthrough scores for bonus images
    const breakthroughCount = session.turns.filter(
      (t) => t.role === "kid" && t.effortScore >= 3
    ).length;

    // Determine if we should generate an image
    const isMilestone = IMAGE_MILESTONES.includes(kidTurnCount);
    const isSessionEnd = !!session.endedAt && existingImages < MAX_BASE_IMAGES;

    // Bonus image: earned by breakthrough effort
    const bonusImagesEarned = Math.min(
      Math.floor(breakthroughCount / BREAKTHROUGH_THRESHOLD),
      MAX_BONUS_IMAGES
    );
    const bonusImagesDue = bonusImagesEarned - Math.max(0, existingImages - MAX_BASE_IMAGES);
    const isBonusTime = bonusImagesDue > 0 && existingImages >= MAX_BASE_IMAGES;

    const maxTotal = MAX_BASE_IMAGES + MAX_BONUS_IMAGES;

    if (!isMilestone && !isSessionEnd && !isBonusTime) {
      return new Response(JSON.stringify({ skip: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingImages >= maxTotal) {
      return new Response(JSON.stringify({ skip: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build context from conversation
    const recentTurns = session.turns
      .slice(-12)
      .map((t) => `${t.role === "kid" ? "Kid" : "AI"}: ${t.content}`)
      .join("\n");

    const imageStage = isSessionEnd
      ? "final completed project showcase"
      : isBonusTime
      ? "bonus reward image — the kid has been thinking extra hard, make it EPIC"
      : kidTurnCount <= 5
      ? "early concept sketch"
      : kidTurnCount <= 12
      ? "mid-project progress visualization"
      : "detailed project showcase";

    // Use GPT to generate a context-aware DALL-E prompt
    const promptResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You generate DALL-E image prompts for a kids learning project. Write a single vivid image prompt (max 100 words) that captures what the kid has been building/discussing. This is the ${imageStage}. The image should be: photorealistic where appropriate (science/engineering projects), or vivid illustrated style for creative projects. Safe for children, no text or words in the image. Focus on the SPECIFIC details the kid described — their exact choices, colors, designs. Output ONLY the prompt, nothing else.`,
        },
        {
          role: "user",
          content: `Project: ${project.title}\n\nRecent conversation:\n${recentTurns}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const imagePrompt =
      promptResponse.choices[0]?.message?.content ||
      `${project.title} project, detailed illustration for kids`;

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: imagePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save to the most recent AI turn (only if it doesn't already have an image)
    if (lastAiTurn && !lastAiTurn.imageUrl) {
      await prisma.turn.update({
        where: { id: lastAiTurn.id },
        data: { imageUrl },
      });
    }

    const isBonus = isBonusTime;
    return new Response(
      JSON.stringify({
        image: imageUrl,
        isBonus,
        message: isBonus
          ? "Your thinking earned you a bonus picture!"
          : undefined,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Image generation error:", err);
    return new Response(JSON.stringify({ error: "Image generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
