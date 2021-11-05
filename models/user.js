const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String
    },
    accountType: {
        type: String,
        required: true
    },
    registrationDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    v: {
        type: String
    },
    hash: {
        type: String
    }
})

//Method to hash password
userSchema.methods.generateHash = function (password, salt) {
    return bcrypt.hashSync(password, salt/*bcrypt.genSaltSync(8)*/, null);
}

//Method to check if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
}

const user = mongoose.model('User', userSchema);

const student = user.discriminator('Student', new mongoose.Schema({
    programme: {
        type: String,
        default: '-'
    },
    group: {
        type: Number,
        default: 1
    },
    progress: {
        type: String,
        required: false,
        default: '0-0'
    },
    solutions: [{
        levelID: {
            type: String,
            default: '0-0'
        },
        code: {
            type: String,
            default: ''
        },
        attempts: {
            type: Number,
            default: 0
        },
        stepsTaken: {
            type: Number,
            default: 0
        },
        timeTaken: {
            type: Number,
            default: 0
        },
        codeErrors: [{
            id: {
                type: Number,
                default: 0
            },
            type: {
                type: String,
                default: ''
            },
            message: {
                type: String,
                default: ''
            },
            lineOfError: {
                type: Number,
                default: 0
            }
        }],
        marks: {
            amountOfTime: {
                type: Number,
                default: 0
            },
            efficiency: {
                type: Number,
                default: 0
            },
            correctness: {
                type: Number,
                default: 0
            },
            attemptsTaken: {
                type: Number,
                default: 0
            }
        },
    }],
    tutorName: {
        type: String,
        default: ''
    },
}))

module.exports = {
    user: user,
    student: student
}