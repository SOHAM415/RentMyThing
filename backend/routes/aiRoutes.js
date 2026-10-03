import express from "express";
import pool from "../config/db.js";

const router = express.Router();

function normalizeHistory(rawMessage) {
  if (Array.isArray(rawMessage)) {
    return rawMessage
      .filter(
        (message) =>
          message &&
          (message.role === "user" ||
            message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim()
      )
      .slice(-10)
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        content: message.content.trim(),
      }));
  }

  const text = String(rawMessage || "").trim();

  return text
    ? [{ role: "user", content: text }]
    : [];
}

function findMatches(items, latestMessage) {
  const query = latestMessage.toLowerCase();

  const budgetMatch = query.match(
    /(?:under|below|less than|up to|within)\s*[₹rs.]?\s*(\d+)/i
  );

  const budget = budgetMatch
    ? Number(budgetMatch[1])
    : null;

  const words = query
    .replace(/[₹,?!.]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 3)
    .filter(
      (word) =>
        ![
          "need",
          "want",
          "looking",
          "lookingfor",
          "rent",
          "rental",
          "please",
          "under",
          "below",
          "less",
          "than",
          "per",
          "day",
          "days",
          "something",
          "find",
          "show",
        ].includes(word)
    );

  const scored = items
    .map((item) => {
      const searchable = `
        ${item.title || ""}
        ${item.category || ""}
        ${item.city || ""}
        ${item.description || ""}
      `.toLowerCase();

      let score = 0;

      for (const word of words) {
        if (searchable.includes(word)) {
          score += 1;
        }
      }

      if (budget !== null && Number(item.price_per_day) <= budget) {
        score += 2;
      }

      return {
        ...item,
        score,
      };
    })
    .filter((item) => {
      if (budget !== null) {
        return Number(item.price_per_day) <= budget;
      }

      return item.score > 0;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map(({ score, ...item }) => item);
}

router.post("/chat", async (req, res) => {
  try {
    const history = normalizeHistory(req.body?.message);

    if (history.length === 0) {
      return res.status(400).json({
        message: "Message is required",
      });
    }

    const inventoryResult = await pool.query(
      `SELECT
        id,
        title,
        category,
        city,
        price_per_day,
        description,
        image_url
       FROM items
       ORDER BY id DESC
       LIMIT 20`
    );

    const inventory = inventoryResult.rows;

    const latestUserMessage =
      [...history]
        .reverse()
        .find((message) => message.role === "user")
        ?.content || "";

    const matches = findMatches(
      inventory,
      latestUserMessage
    );

    const inventoryContext = inventory
      .map(
        (item) =>
          `#${item.id} ${item.title} | ${
            item.category || "general"
          } | ${item.city || "location unavailable"} | ₹${
            item.price_per_day
          }/day | ${item.description || ""}`
      )
      .join("\n");

    const systemPrompt = `
You are RentMyThing's AI rental assistant.

Your job is to help users discover and understand rentals on RentMyThing.

Rules:
- Be conversational, concise, and practical.
- Only mention rental items that exist in the provided inventory.
- Never invent listings, prices, cities, availability, owners, or platform features.
- Help with rental-related questions, booking basics, pricing, categories, and the current marketplace.
- If the user asks about a rental that does not appear in the inventory, clearly say it is not currently listed.
- Do not repeat information unnecessarily.
- Ask at most one useful follow-up question when needed.

Current inventory:
${inventoryContext || "No rentals are currently listed."}
`.trim();

    const contents = [...history];

    contents[0] = {
      role: "user",
      content: `${systemPrompt}\n\nUser conversation begins:\n${contents[0].content}`,
    };

    const apiKey = process.env.GEMINI_API_KEY;
    const model =
      process.env.GEMINI_MODEL || "gemini-3.8-flash";

    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not configured.");

      return res.json({
        reply:
          inventory.length > 0
            ? `I can help you search the ${inventory.length} rentals currently listed on RentMyThing. Try asking for a category, city, or budget.`
            : "There are no rentals listed yet.",
        matches,
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: contents.map((message) => ({
            role: message.role,
            parts: [
              {
                text: message.content,
              },
            ],
          })),
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Gemini API ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() ||
      "I couldn't generate a response right now.";

    return res.json({
      reply,
      matches,
    });
  } catch (error) {
    console.error("AI service error:", error);

    return res.json({
      reply:
        "The AI assistant is temporarily unavailable. You can still browse and book rentals normally.",
      matches: [],
    });
  }
});

export default router;