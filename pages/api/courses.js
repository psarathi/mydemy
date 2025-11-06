import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            const coursesPath = path.join(process.cwd(), 'courses.json');
            const coursesData = await fs.readFile(coursesPath, 'utf-8');
            const courses = JSON.parse(coursesData);
            res.status(200).json(courses);
        } catch (error) {
            console.error('Error reading courses:', error);
            res.status(500).json({error: 'Failed to load courses'});
        }
    } else {
        res.status(405).json({error: 'Method not allowed'});
    }
}
