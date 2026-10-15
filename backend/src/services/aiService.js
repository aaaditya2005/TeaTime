require("dotenv").config();
const axios = require("axios");

async function askAI(title, category, description, question) {
    try {
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/interactions",
            {
                model: "gemini-3.5-flash-lite",
                store: false,
                input: `
                You are the AI assistant for It's TeaTime.
                Current Post
                Title: ${title}
                Category: ${category}
                Content: ${description}
                User Question:
                ${question}

                Rules:
                1. Use the post as your primary source.
                2. If the question asks about something mentioned in the post, explain it in detail using your own knowledge.
                3. If the answer requires extra background knowledge, provide it.
                4. Only reject questions that are completely unrelated to the post.
                5. Keep the answer friendly and concise.
                `,
            },
            {
                headers: {
                    "x-goog-api-key": process.env.GEMINI_API_KEY,
                    "Content-Type": "application/json",
                },
                timeout: 15000,
            }
        );

        const output = response.data.steps?.find(step => step.type === "model_output");
        const answer = output?.content
            ?.filter(part => part.type === "text")
            .map(part => part.text)
            .join("\n");
        return answer || "Sorry, I could not generate a response.";
    } catch (err) {
        console.error("Gemini API error:", err.response?.data?.error?.message || err.message);
        return "The AI service is temporarily unavailable. Please try again shortly.";
    }
}

module.exports = askAI;