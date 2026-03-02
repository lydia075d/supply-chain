import axios from "axios";
import API_BASE_URL from "./config";

// Create Batch
export const createBatch = async (data, token) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/batch/create`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to create batch");
  }
};

// Get My Batches
export const getMyBatches = async (token) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/batch/producer/batches`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to get batches");
  }
};

// Get Single Batch ✅ FIXED URL
export const getBatch = async (id) => {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/batch/batchId/${id}`, // ✅ Fixed from /batch/batch/ to /batch/batchId/
    );
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to get batch");
  }
};
