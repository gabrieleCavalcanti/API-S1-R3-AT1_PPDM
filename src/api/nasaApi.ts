import axios from "axios";

const apiNasa = axios.create({
  baseURL: "https://api.nasa.gov",
  params: {
    api_key: process.env.EXPO_PUBLIC_API_KEY,
  },
});

export default apiNasa;