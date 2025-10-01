import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in the environment variables");
}

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { meetingText } = await request.json();

    if (!meetingText) {
      return NextResponse.json(
        { error: "Meeting text is required in the request body." },
        { status: 400 }
      );
    }

    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content:
          "You are a professional meeting summarization assistant. Your primary role is to read, analyze, and create a clear, concise, and comprehensive summary of the meeting transcript. Ensure that the summary covers the following four key sections: 1) Key Points, 2) Decisions Made, 3) Action Items, and 4) Follow-Up Tasks. Avoid redundancy and repetition across these sections, ensuring each point is listed only once in the most relevant section. Focus on clarity, brevity, and precision, ensuring no critical information is omitted. Always list action items with specific deadlines and the names of responsible persons if mentioned. ONLY USE THE DATA PROVIDED IN THE MEETING TEXT. DO NOT ADD NEW INFORMATION, INTERPRET, OR MAKE ASSUMPTIONS. The summary should be written in professional language that is clear, direct, and easy for all stakeholders to understand.",
      },

      {
        role: "user",
        content: `Here is the meeting text for you to summarize: ${meetingText}. Please provide a summary following the structure outlined above.`,
      },
    ];

    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages,
      temperature: 0.6,
    });

    const content =
      response.choices[0]?.message?.content || "No summary generated.";

    return NextResponse.json({ summary: content });
  } catch (error: unknown) {
    console.error("API Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unknown error occurred while generating the meeting summary.",
      },
      { status: 500 }
    );
  }
}
