// Use an environment variable for the backend URL, fallback to localhost for local dev
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

/**
 * Upload a file to the backend and receive a generated quiz.
 * @param {File} file - The PDF or PPTX file to upload.
 * @param {number} numQuestions - How many questions to generate (1–20).
 * @returns {Promise<{questions: Array}>} The quiz data.
 */
export async function generateQuiz(file, numQuestions = 10) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("num_questions", String(numQuestions));

  const response = await fetch(`${BASE_URL}/generate-quiz`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let message = `Server error (${response.status})`;
    try {
      const err = await response.json();
      message = err.detail || message;
    } catch {
      // ignore JSON parse errors on error responses
    }
    throw new Error(message);
  }

  return response.json();
}
