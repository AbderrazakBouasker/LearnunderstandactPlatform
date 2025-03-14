import dotenv from "dotenv";
dotenv.config({path: '.env'});

export default {
  headers: { 'Content-Type': 'application/json' },
  Authorization: process.env.ACCESS_TOKEN,
};