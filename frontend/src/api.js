import axios from 'axios';
// http requests 
const api = axios.create({
    baseURL: 'http://localhost:8080/api'
});

export default api;