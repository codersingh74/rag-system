import API from './api'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const chatService = {
  async listConversations() {
    const { data } = await API.get('/chat/')
    return data
  },

  async createConversation(title = 'New Chat') {
    const { data } = await API.post('/chat/', { title })
    return data
  },

  async getConversation(id) {
    const { data } = await API.get(`/chat/${id}/`)
    return data
  },

  async deleteConversation(id) {
    await API.delete(`/chat/${id}/`)
  },

  async sendMessageStream(convId, query, onToken, onDone) {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${BASE_URL}/chat/${convId}/message/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) throw new Error(`Server error: ${response.status}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.type === 'token') onToken(parsed.token)
            if (parsed.type === 'done') onDone(parsed)
          } catch { }
        }
      }
    }
  },

  async sendMessage(convId, query) {
    const { data } = await API.post(`/chat/${convId}/message/sync/`, { query })
    return data
  }
}
