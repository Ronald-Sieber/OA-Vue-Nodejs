import request from '@/utils/request'

export function createProcess(data) {
  return request({ url: '/api/processes', method: 'post', data })
}

export function listProcesses(params) {
  return request({ url: '/api/processes', method: 'get', params })
}

export function getProcess(id) {
  return request({ url: `/api/processes/${id}`, method: 'get' })
}

export function listTodo(params) {
  return request({ url: '/api/processes/todo', method: 'get', params })
}

export function approveProcess(id, data) {
  return request({ url: `/api/processes/${id}/approve`, method: 'post', data })
}

export function rejectProcess(id, data) {
  return request({ url: `/api/processes/${id}/reject`, method: 'post', data })
}