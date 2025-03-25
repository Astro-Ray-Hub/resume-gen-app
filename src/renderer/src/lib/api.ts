import axios from 'axios'

const api = (url) =>
  axios.create({
    baseURL: url + '/api',
    headers: {
      'Content-Type': 'application/json'
    }
  })

export default api
