import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
    // Personal Information
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters'],
        match: [/^[a-zA-Z ]+$/, 'Name can only contain letters and spaces']
    },
    fatherName: {
        type: String,
        required: [true, 'Father name is required'],
        trim: true,
        maxlength: [100, 'Father name cannot exceed 100 characters']
    },
    motherName: {
        type: String,
        required: [true, 'Mother name is required'],
        trim: true,
        maxlength: [100, 'Mother name cannot exceed 100 characters']
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of birth is required'],
        validate: {
            validator: function (dob) {
                const minAgeDate = new Date();
                minAgeDate.setFullYear(minAgeDate.getFullYear() - 16);
                return dob <= minAgeDate;
            },
            message: 'Student must be at least 16 years old'
        }
    },
    gender: {
        type: String,
        required: true,
        enum: {
            values: ['male', 'female', 'other'],
            message: 'Gender must be male, female, or other'
        }
    },
    category: {
        type: String,
        required: true,
        enum: ['general', 'obc', 'sc', 'st', 'ews']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        default: null
    },
    nationality: {
        type: String,
        required: true,
        default: 'Indian'
    },

    // Contact Information
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    emergencyContact: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true;
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        default: null
    },

    // Academic Information
    course: {
        type: String,
        required: true,
        enum: ['DCA', 'DMCA', 'PGDMCA', 'Stenography']
    },
    session: {
        type: String,
        required: true,
        trim: true,
        enum: ['Jan - Dec', 'Jul - Jun']
    },
    batch: {
        type: Number,
        required: true,
        min: [2020, 'Batch year must be at least 2020'],
        max: [2030, 'Batch year cannot exceed 2030']
    },

    // Address
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
        maxlength: [500, 'Address cannot exceed 500 characters']
    },
    state: {
        type: String,
        required: true,
        enum: ['Himachal Pradesh', 'Punjab', 'Haryana', 'Uttarakhand', 'Jammu and Kashmir']
    },
    pinCode: {
        type: Number,
        required: true,
        match: [/^[0-9]{6}$/, 'Pin code must be 6 digits']
    },

    // Login Credentials
    instituteId: {
        type: Number,
        required: [true, 'Institute ID is required'],
        unique: true, // Single source of uniqueness
        min: [10000, 'Institute ID must be at least 5 digits'],
        max: [999999, 'Institute ID cannot exceed 6 digits']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'staff'],
        default: 'student'
    },

    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    },
    toObject: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.__v;
            return ret;
        }
    },
    tokenVersion: { type: Number, default: 0 }
});

// Compound indexes only (no duplicate single-field indexes)
StudentSchema.index({ course: 1, batch: 1 }); // For course/batch queries
StudentSchema.index({ state: 1, isActive: 1 }); // For regional filtering

// Virtual for age calculation
StudentSchema.virtual('age').get(function () {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// Static method to find by instituteId
StudentSchema.statics.findByInstituteId = function (id) {
    return this.findOne({ instituteId: id });
};

// Improved pre-save hook
StudentSchema.pre('save', function (next) {
    // Skip if not modified (for performance)
    if (!this.isModified()) return next();

    // Trim all string fields
    for (const [key, value] of Object.entries(this._doc)) {
        if (typeof value === 'string') {
            this[key] = value.trim();
        }
    }

    // Ensure email is lowercase
    if (this.isModified('email') && this.email) {
        this.email = this.email.toLowerCase();
    }

    next();
});

// Query middleware to always exclude password
StudentSchema.pre(/^find/, function (next) {
    this.select('-password');
    next();
});

// Export the model
export default mongoose.models.Student || mongoose.model('Student', StudentSchema);