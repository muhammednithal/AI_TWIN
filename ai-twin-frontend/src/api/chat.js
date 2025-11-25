import API from "./axios";

export const sendChatMessage = (personalityId, message, sessionId = "") =>
  API.post("/api/chat", {
    personality_id: personalityId,
    message,
    session_id: sessionId || "",
  });
