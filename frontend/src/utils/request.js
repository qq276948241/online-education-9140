import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.response.use(
  response => {
    if (response.data.code === 200) {
      return response.data
    }
    return Promise.reject(new Error(response.data.message || '请求失败'))
  },
  error => {
    return Promise.reject(error)
  }
)

export default request
