import axios from 'axios';
import  API_BASE_URL  from './config';


// Create Batch
export const createBatch = async (data, token) => {
  const res = await axios.post(
    `${API_BASE_URL}/batch/create`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
};


// Get My Batches
export const getMyBatches = async (token) => {

  const res = await axios.get(
    `${API_BASE_URL}/batch/producer/batches`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return res.data;
};


// Get Single Batch
export const getBatch = async (id) => {

  const res = await axios.get(
    `${API_BASE_URL}/batch/batch/${id}`
  );

  return res.data;
};