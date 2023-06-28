import axios from "axios";
import { storage } from "../utils/storage";

export default axios.create({
  baseURL: "https://api.petfinder.com/v2/",
});

export async function retrieveToken() {
  axios.create()
    .request({
      baseURL: "https://api.petfinder.com/v2/",
      url: "oauth2/token",
      method: "post",
      data: {
        grant_type: "client_credentials",
        client_id: process.env.PETFINDER_KEY,
        client_secret: process.env.PETFINDER_SECRET,
      },
    })
    .then(async (response) => {
      if (response?.data?.access_token) {
        storage.set(
          "token",
          response.data.access_token
        );
      } else {
        console.error('could not retrieve access token from petfinder API', response);
      }
    })
    .catch((error) => {
      console.error('error', error);
    });

  return;
}

export async function searchApi({ location, type, age, distance, breed, pageParam = 1}) {
  await retrieveToken();
  const token = storage.getString('token');
  
  const this_search = {
    type,
    limit: 20,
    sort: 'distance',
    location: `${location.latitude},${location.longitude}`,
    age,
    distance,
    breed,
    page: pageParam
  };

  let filtered = Object.fromEntries(Object.entries(this_search).filter(([_, v]) => v != null && v != [] && v != ''));

  return axios
    .get(`animals?${new URLSearchParams(filtered).toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      baseURL: "https://api.petfinder.com/v2/"
    })
};

export async function getShelterAnimals({ id, pageParam = 1}) {
  await retrieveToken();
  const token = storage.getString('token');
  
  const this_search = {
    limit: 20,
    organization: id,
    page: pageParam
  };

  let filtered = Object.fromEntries(Object.entries(this_search).filter(([_, v]) => v != null && v != [] && v != ''));

  return axios
    .get(`animals?${new URLSearchParams(filtered).toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      baseURL: "https://api.petfinder.com/v2/"
    })
};