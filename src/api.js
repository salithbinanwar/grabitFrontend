import axios from 'axios'

const API = axios.create({
  baseURL: 'https://grabitserver.onrender.com/api',
  withCredentials: true,
})

export default API
