import API from "./axios";

export const addMemory = (personalityId, content, tags) =>
  API.post("/api/memory", {
    personality_id: personalityId,
    content,
    tags, // string like "coffee,food"
  });

export const listMemories = (personalityId) =>
  API.get(`/api/memory/${personalityId}`);

export const deleteMemory = (id) => API.delete(`/api/memory/${id}`);
