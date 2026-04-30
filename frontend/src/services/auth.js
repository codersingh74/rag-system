import API from './api'

export const authService = {
  async register(username, email, password, password2) {
    const { data } = await API.post('/auth/register/', { username, email, password, password2 })
    localStorage.setItem('access_token', data.tokens.access)
    localStorage.setItem('refresh_token', data.tokens.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  async login(email, password) {
    const { data } = await API.post('/auth/login/', { email, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  },

  logout() {
    localStorage.clear()
    window.location.href = '/login'
  },

  getUser() {
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token')
  }
}
