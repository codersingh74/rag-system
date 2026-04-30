import API from './api'

export const documentService = {
  async list() {
    const { data } = await API.get('/documents/')
    return data
  },

  async upload(file, title, onProgress) {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    const { data } = await API.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
      },
    })
    return data
  },

  async delete(id) {
    await API.delete(`/documents/${id}/`)
  },

  async get(id) {
    const { data } = await API.get(`/documents/${id}/`)
    return data
  }
}
