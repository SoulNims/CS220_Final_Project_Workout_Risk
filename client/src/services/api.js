const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const body = await response.json()
      message = body.detail || message
    } catch {
      // Keep the status-based message when the response is not JSON.
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  getUser: (username) => request(`/users/${username}`),
  createWorkout: (username, payload) =>
    request(`/workouts/${username}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getWorkouts: (username) => request(`/workouts/${username}`),
  deleteWorkout: (username, workoutId) =>
    request(`/workouts/${username}/${workoutId}`, { method: 'DELETE' }),
  getRiskScores: (username) => request(`/risk/${username}`),
  getRiskHistory: (username) => request(`/risk/${username}/history`),
  getRecommendations: (username) => request(`/recommendations/${username}`),
  getAiCoach: (username, { force = false } = {}) =>
    request(`/ai/coach/${username}${force ? '?force=true' : ''}`),
  getAiAnalysis: (username) => request(`/ai/analyze/${username}`),
  getAiPlan: (username) => request(`/ai/plan/${username}`),
  getAiReport: (username) => request(`/ai/report/${username}`),
}

export { API_BASE_URL }
