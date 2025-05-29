import axios from 'axios';

export interface GenerateRequest {
  name: string;
  jobTitle: string;
  skills: string[];
  experience: string;
  targetCompany: string;
}

export interface GenerateResponse {
  resume: string;
  coverLetter: string;
}

const API = axios.create({
  baseURL: 'http://localhost:3000',
});

export const generateDocuments = (data: GenerateRequest) =>
  API.post<GenerateResponse>('/generate', data);
