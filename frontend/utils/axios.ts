// // import { BACKEND_API_URL } from "@/constants/env"
// // import { useTokenStore } from "@/hooks"
// import axios from "axios"

// const axiosInstance = axios.create({
//     // baseURL: BACKEND_API_URL,
//     withCredentials: true, // CRITICAL: Send cookies (refreshToken) with every request
//     headers: { "Content-Type": "application/json" }
// })

// const refreshInstance = axios.create({
//     // baseURL: BACKEND_API_URL,
//     withCredentials: true // CRITICAL: Must send refreshToken cookie
// })

// // axiosInstance.interceptors.request.use(
// //     (config) => {
// //         const accessToken = useTokenStore.getState().accessToken

// //         if (accessToken && config.headers) {
// //             config.headers.Authorization = `Bearer ${accessToken}`
// //         }

// //         return config
// //     },
// //     (error) => Promise.reject(error)
// // )

// axiosInstance.interceptors.response.use(
//     (res) => res,
//     async (error) => {
//         const originalRequest = error.config
//         const hasToken = !!useTokenStore.getState().accessToken
//         const requestUrl = String(originalRequest?.url || "")
//         const isPublicAuthFlow =
//             requestUrl.includes("/users/forgot-password") ||
//             requestUrl.includes("/users/verify-forgot-password-token") ||
//             requestUrl.includes("/users/login")

//         if (
//             error.response?.status === 401 &&
//             hasToken &&
//             !isPublicAuthFlow &&
//             !originalRequest.sent
//         ) {
//             originalRequest.sent = true
//             try {
//                 const res = await refreshInstance.post("/users/resign-tokens")
//                 // useTokenStore.getState().setAccessToken(res.data.accessToken)
//                 const newToken = res.data.result?.access_token ?? res.data.accessToken
//                 useTokenStore.getState().setAccessToken(newToken)

//                 originalRequest.headers = originalRequest.headers || {}
//                 // originalRequest.headers["Authorization"] = `Bearer ${res.data.accessToken}`
//                 originalRequest.headers["Authorization"] = `Bearer ${newToken}`

//                 return axiosInstance(originalRequest)
//             } catch (refreshError) {
//                 useTokenStore.getState().removeAccessToken()
//                 return Promise.reject(refreshError)
//             }
//         }
//         return Promise.reject(error)
//     }
// )
// export default axiosInstance
import axios from 'axios';

// Tạo instance
const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api', // Địa chỉ Backend
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Giải nén response envelope { statusCode, message, data } từ NestJS
axiosClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      response.data.hasOwnProperty('statusCode') &&
      response.data.hasOwnProperty('data')
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default axiosClient;
