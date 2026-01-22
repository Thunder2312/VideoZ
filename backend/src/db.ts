import { Pool } from "pg";

export const pool = new Pool({
  user: "postgres",      
  host: "localhost",    
  database: "videoz",    
  password: "sarang",
  port: 5432,            
});
