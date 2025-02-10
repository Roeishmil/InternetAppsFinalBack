import OpenAI from "openai";
import dotenv from "dotenv"
import { Request, Response } from "express";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});

const askGPT = async (req: Request, res: Response) => {
    try {
        const userId = req.body.userId; // Ensure userId is sent in the request body
        let query = req.body.query; // Query content from the request body

        if (!userId || !query) {
            return res.status(400).json({ error: "User ID and query are required." });
        }

        query = 'Generate a short 10 words post content about ' + query;
        
        //Exit if not allowed - testings
        if(process.env.OPENAI_ALLOWED == 'false'){
            return res.status(200).json({ message: "OPENAI API turned off" });
        }

        //Actual request    
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                {
                    role: "user",
                    content: query,
                },
            ],
        });

        const message = completion.choices[0].message?.content || "No response";
        return res.status(200).json({ message });

    } catch(err) {
        console.error(err);
        return res.status(500).json({ error: "Something went wrong. Please try again later." });
    }
};

export default askGPT;