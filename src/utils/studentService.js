// utils/studentService.js
import dbConnect from '@/utils/dbConnect';
import Student from '@/models/Student';

export async function getStudentData(instituteId) {
    try {
        await dbConnect();
        
        const student = await Student.findOne({ instituteId: parseInt(instituteId, 10) });
        
        if (!student) {
            throw new Error('Student not found');
        }

        // Convert MongoDB document to plain object
        return JSON.parse(JSON.stringify(student));
    } catch (error) {
        console.error('Error fetching student data:', error);
        throw error;
    }
}