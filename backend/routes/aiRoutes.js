import express from "express";
import pool from "../config/db.js";

const router = express.Router();

const AVAILABILITY_PHRASES = [
  "do you have",
  "do u have",
  "do you guys have",
  "do u guys have",
  "have you got",
  "got any",
  "is there",
  "are there",
  "available",
  "availability",
  "collection",
];

function normalizeWord(word) {
  const value = word.toLowerCase();

  if (value.endsWith("ies")) {
    return value.slice(0, -3) + "y";
  }

  if (value.endsWith("es")) {
    return value.slice(0, -2);
  }

  if (value.endsWith("s")) {
    return value.slice(0, -1);
  }

  return value;
}

function getSearchTerms(text = "") {
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "is",
    "are",
    "do",
    "does",
    "you",
    "your",
    "guys",
    "have",
    "has",
    "any",
    "some",
    "for",
    "to",
    "of",
    "in",
    "on",
    "at",
    "with",
    "me",
    "i",
    "we",
    "my",
    "our",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "can",
    "could",
    "would",
    "should",
    "please",
    "tell",
    "show",
    "give",
    "want",
    "need",
    "looking",
    "good",
    "great",
    "best",
    "suggest",
    "recommend",
    "available",
    "availability",
    "option",
    "options",
    "item",
    "items",
    "rental",
    "rent",
    "rentals",
    "book",
    "booking",
    "price",
    "cost",
    "budget",
    "day",
    "days",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeWord)
    .filter((word) => word.length > 2)
    .filter((word) => !stopWords.has(word));
}

function isAvailabilityQuestion(text = "") {
  const lower = text.toLowerCase();

  return AVAILABILITY_PHRASES.some((phrase) =>
    lower.includes(phrase)
  );
}

function findMatchingItems(items, message) {
  const terms = getSearchTerms(message);

  return items.filter((item) => {
    const searchableText = [
      item.title,
      item.category,
      item.city,
      item.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return terms.some((term) =>
      searchableText.includes(term)
    );
  });
}

function formatInventory(items) {
  return items
    .map(
      (item) =>
        `#${item.id} ${item.title} | ${
          item.category || "general"
        } | ${item.city} | ₹${item.price_per_day}/day | ${
          item.description || ""
        }`
    )
    .join("\n");
}

router.post("/chat", async (req, res) => {
  try {
    const incomingMessages = Array.isArray(
      req.body?.messages
    )
      ? req.body.messages
      : [];

    if (incomingMessages.length === 0) {
      return res.status(400).json({
        message: "Messages are required",
      });
    }

    const history = incomingMessages
      .filter(
        (message) =>
          (message.role === "user" ||
            message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim()
      )
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.content.trim(),
      }));

    const latestUserMessage =
      [...history]
        .reverse()
        .find(
          (message) => message.role === "user"
        )?.content || "";

    const inventoryResult = await pool.query(
  `SELECT id, title, category, city, price_per_day, description, image_url
   FROM items
   ORDER BY id DESC
   LIMIT 20`
);

    const inventory = inventoryResult.rows;

    /*
     * Ground explicit availability questions
     * against the real PostgreSQL inventory.
     */
    if (
      isAvailabilityQuestion(latestUserMessage)
    ) {
      const matches = findMatchingItems(
        inventory,
        latestUserMessage
      );

      /*
       * IMPORTANT:
       * If the database has no matching item,
       * do not ask the AI to answer.
       */
      if (matches.length === 0) {
  return res.json({
    reply:
      "I don't see a matching item currently listed on RentMyThing.",
    matches: [],
  });
}

      const verifiedInventory =
        formatInventory(matches);

      const systemMessage = `
You are RentMyThing's AI rental assistant.

Have a natural, friendly conversation.

Rules:
- Use the conversation history to understand context.
- Do not repeat the user's sentence unnecessarily.
- Do not restate information already established.
- Ask only one follow-up question at a time.
- Handle short replies naturally.
- The user can change topics at any time.
- Keep responses concise and conversational.
- Never invent products, prices, cities, or availability.
- ONLY talk about items in the VERIFIED INVENTORY below.
- Do not mention any item that is not in the VERIFIED INVENTORY.

VERIFIED INVENTORY:
${verifiedInventory}

Actual RentMyThing rental flow:
1. Explore rental items.
2. Open an item's details.
3. Select start and end dates.
4. Click "Book & Pay".
5. Complete Razorpay checkout.
6. Successful payment confirms the booking.
7. The booking appears in "My Bookings".

Do not claim shipping, delivery tracking, tracking numbers,
confirmation emails, or other features that are not listed above.
`;

      const baseUrl = (
        process.env.OLLAMA_BASE_URL ||
        "http://localhost:11434"
      ).replace(/\/$/, "");

      const model =
        process.env.OLLAMA_MODEL ||
        "llama3:latest";

      const response = await fetch(
        `${baseUrl}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            stream: false,
            messages: [
              {
                role: "system",
                content: systemMessage,
              },
              ...history,
            ],
          }),
          signal: AbortSignal.timeout(60000),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Ollama returned ${response.status}`
        );
      }

      const data = await response.json();

      return res.json({
  reply:
    data.message?.content ||
    "I couldn't generate a response.",
  matches: matches.slice(0, 4),
});
    }

    /*
     * Normal conversation:
     * Give the model the real inventory and
     * conversation history.
     */
    const fullInventory =
      formatInventory(inventory) ||
      "No inventory is currently listed.";

    const systemMessage = `
You are RentMyThing's AI rental assistant.

Have a natural, friendly conversation with the user.

Rules:
- Use the conversation history to understand context.
- Do not repeat the user's sentence unnecessarily.
- Do not restate information already established.
- Ask only one follow-up question at a time.
- Do not ask for information the user already gave.
- Handle short replies such as yes, no, okay, sure, thanks, etc. naturally.
- The user can change topics at any time.
- Do not force every message into a rental search.
- Keep responses concise and conversational.
- Never invent rental items, prices, cities, availability, or website features.
- When discussing rentals, ONLY mention items in the VERIFIED INVENTORY.
- If the requested item is not in the inventory, say it is not currently listed.

VERIFIED INVENTORY:
${fullInventory}

Actual RentMyThing rental flow:
1. Explore rental items.
2. Open an item's details.
3. Select start and end dates.
4. Click "Book & Pay".
5. Complete Razorpay checkout.
6. Successful payment confirms the booking.
7. The booking appears in "My Bookings".

Do not claim shipping, delivery tracking, tracking numbers,
confirmation emails, or other features that are not listed above.
`;

    const baseUrl = (
      process.env.OLLAMA_BASE_URL ||
      "http://localhost:11434"
    ).replace(/\/$/, "");

    const model =
      process.env.OLLAMA_MODEL ||
      "llama3:latest";

    const response = await fetch(
      `${baseUrl}/api/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: "system",
              content: systemMessage,
            },
            ...history,
          ],
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Ollama returned ${response.status}`
      );
    }

    const data = await response.json();

    const relevantMatches = findMatchingItems(
  inventory,
  latestUserMessage
);

return res.json({
  reply:
    data.message?.content ||
    "I couldn't generate a response.",
  matches: relevantMatches.slice(0, 4),
});
  } catch (error) {
    console.error(
      "AI assistant error:",
      error
    );

    res.status(500).json({
      message: "AI assistant failed",
    });
  }
});

export default router;