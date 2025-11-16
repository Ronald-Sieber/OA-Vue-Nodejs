import request from '@/utils/request'

export function listDocs(params) {
  return request({ url: '/api/docs', method: 'get', params })
}

export function addDoc(data) {
  return request({ url: '/api/docs', method: 'post', data })
}

export function updateDoc(id, data) {
  return request({ url: `/api/docs/${id}`, method: 'put', data })
}

export function delDoc(id) {
  return request({ url: `/api/docs/${id}`, method: 'delete' })
}

export function uploadFile(file) {
  const form = new FormData()
  form.append('file', file)
  return request({ url: '/api/uploads', method: 'post', data: form, headers: { 'Content-Type': 'multipart/form-data' } })
}