import bcrypt from 'bcryptjs';
import dbConnect from '@/utils/dbConnect';
import Student from '@/models/Student';
import ExistedIds from '@/models/ExistedIds';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            message: 'Method not allowed',
            code: 'METHOD_NOT_ALLOWED'
        });
    }

    try {
        await dbConnect();

        // Validate content type
        if (!req.headers['content-type']?.includes('application/json')) {
            return res.status(415).json({ 
                success: false,
                message: 'Unsupported Media Type',
                code: 'INVALID_CONTENT_TYPE'
            });
        }

        const { body } = req;
        
        // Validate required fields
        const requiredFields = [
            'fullName', 'fatherName', 'motherName', 'dateOfBirth',
            'gender', 'category', 'nationality', 'phone', 'email',
            'course', 'session', 'batch', 'address', 'state', 'pinCode',
            'instituteId', 'password'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                code: 'MISSING_FIELDS',
                missingFields
            });
        }

        // Convert and validate instituteId
        const instituteIdNum = Number(body.instituteId);
        if (isNaN(instituteIdNum)) {
            return res.status(400).json({
                success: false,
                message: 'Institute ID must be a number',
                code: 'INVALID_INSTITUTE_ID_TYPE'
            });
        }

        // Check ID validity (read-only check)
        const idRecord = await ExistedIds.findById(instituteIdNum);
        if (!idRecord) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid Institute ID',
                code: 'INVALID_INSTITUTE_ID'
            });
        }

        // Check if ID is already used in Students
        const studentUsingId = await Student.findOne({ instituteId: instituteIdNum });
        if (studentUsingId) {
            return res.status(409).json({ 
                success: false,
                message: 'Institute ID already registered to a student',
                code: 'INSTITUTE_ID_IN_USE'
            });
        }

        // Normalize and check duplicates
        const emailNormalized = body.email.toLowerCase().trim();
        const phoneNormalized = body.phone.toString().trim();

        const existingStudent = await Student.findOne({
            $or: [
                { email: emailNormalized },
                { phone: phoneNormalized }
            ]
        });

        if (existingStudent) {
            const conflictField = existingStudent.email === emailNormalized ? 'email' : 'phone';
            return res.status(409).json({ 
                success: false,
                message: `${conflictField} already registered`,
                code: 'DUPLICATE_STUDENT',
                conflictField
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(body.password, 12);

        // Create and save student
        const newStudent = new Student({
            fullName: body.fullName.trim(),
            fatherName: body.fatherName.trim(),
            motherName: body.motherName.trim(),
            dateOfBirth: new Date(body.dateOfBirth),
            gender: body.gender,
            category: body.category,
            bloodGroup: body.bloodGroup || null,
            nationality: body.nationality.trim(),
            phone: phoneNormalized,
            email: emailNormalized,
            emergencyContact: body.emergencyContact?.toString().trim() || null,
            course: body.course,
            session: body.session.trim(),
            batch: parseInt(body.batch),
            address: body.address.trim(),
            state: body.state,
            pinCode: body.pinCode.toString(),
            instituteId: instituteIdNum,
            password: hashedPassword,
            role: body.role || 'student',
            isActive: true
        });

        // Save student (no need to update ExistedIds since it's read-only)
        const savedStudent = await newStudent.save();

        // Return response without sensitive data
        const { password, __v, ...studentData } = savedStudent.toObject();
        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: studentData
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `${field} already exists`,
                code: 'DUPLICATE_KEY',
                field
            });
        }

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors
            });
        }

        return res.status(500).json({ 
            success: false,
            message: 'Internal server error',
            code: 'SERVER_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}