require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/user');
const Token = require("../models/token");
const Secret = require('../models/secret');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
const csprng = require('csprng');
const mongoose = require('mongoose');

// Getting all
router.get('/', async (req, res) => {
    try {
        const users = await User.user.find()
        res.json(users)
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

router.post('/secretUpdate', async (req, res) => {
    try {
        let secret = new Secret({
            secret: csprng(128)
        })
        await secret.save();
        res.status(201).json({
            message: "Secret updated."
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

//Creating One & register
router.post('/register', async (req, res) => {
    try {
        await User.user.findOne({ email: req.body.email }, async function (err, user) {
            user.password = req.body.password;//user.generateHash(req.body.password, user.name + 'byteharvesterdev' + user.v);
            const hash = crypto.createHash('sha256');
            hash.update(user.password);  //SHA256 with base64 strings
            user.hash = hash.digest('base64');
            user.password = user.hash;
            user.programme = req.body.programme;
            user.group = req.body.group;
            user.tutorName = req.body.tutorName;
            user.tutorEmail = req.body.tutorEmail;

            await user.save();
            res.status(201).json({
                message: "User registered successfully."
            });
        })
    } catch (err) {
        //400 = bad data
        res.status(400).json({
            message: err.message
        })
    }
})

router.post('/registerLookup', async (req, res) => {
    try {
        await User.user.findOne({ email: req.body.email }, async function (err, user) {
            let salt = '';
            let v = csprng(128);
            if (!user) {
                let newUser;
                if (req.body.accountType == 'Tutor') {
                    newUser = new User.user({
                        name: req.body.name,
                        email: req.body.email,
                        accountType: req.body.accountType,
                        v: v //128 bits CSPRNG
                    })
                } else {
                    newUser = new User.student({
                        name: req.body.name,
                        email: req.body.email,
                        accountType: req.body.accountType,
                        solutions: {
                            levelID: "0-0"
                        },
                        v: v
                    })
                }

                await newUser.save();

                salt = req.body.name + 'byteharvesterdev' + newUser.v;
                const hash = crypto.createHash('sha256').update(salt).digest('base64');
                salt = hash.substr(0, 22);

                return res.status(200).json({
                    message: 'Register lookup complete',
                    salt: salt
                })
            } else {
                return res.status(200).json({
                    message: 'User already exists'
                })
            }
        })
    } catch (err) {
        return res.status(400).json({
            message: err
        })
    }
})

router.post('/userLookup', async (req, res) => {
    console.log(req.body)
    try {
        await User.user.findOne({ email: req.body.email }, function (err, user) {
            let salt = '';
            if (user) {
                salt = user.name + 'byteharvesterdev' + user.v;
            } else {
                salt = req.body.name + 'byteharvesterdev' + Secret.secret;
            }

            const hash = crypto.createHash('sha256').update(salt).digest('base64');
            salt = hash.substr(0, 22);

            return res.status(200).json({
                message: 'Lookup complete',
                salt: salt
            })
        })
    } catch (err) {
        return res.status(400).json({
            message: err
        })
    }
})

//Login
router.post('/login', async (req, res) => {
    try {
        console.log(req.body)
        await User.user.findOne({ email: req.body.email }, function (err, user) {
            let calculatedHash = crypto.createHash('sha256').update(req.body.password).digest('base64');
            
            if (!user) {
                return res.status(200).json({
                    message: "User not found"
                });
            }
            if (calculatedHash != user.hash) {
                //password didn't match
                res.status(200).json({
                    message: "Invalid password."
                });

            } else {
                //password match, proceeds to login
                let token = jwt.sign({ email: req.body.email }, "byteharvester", { expiresIn: 60 * 30 });  //expires in 30 minutes

                res.json({
                    message: "You're now logged in!",
                    token: token
                });
            }
                
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
})

router.post('/validatePasswordResetToken', async (req, res) => {
    try {
        let token = await Token.findOne({ token: req.body.token });
        if (token) {
            return res.status(200).json({
                message: "Your password reset token is valid."
            })
        }
        return res.status(200).json({
            message: "Your password reset token is not found or expired."
        })
    } catch (error) {
        return res.status(500).json({
            message: "An error occured."
        })
    }
})

//TODO: configure GET route for front-end https://dev.to/jahangeer/how-to-implement-password-reset-via-email-in-node-js-132m
router.post('/passwordReset', async (req, res) => {
    try {
        const user = await User.user.findOne({ email: req.body.email })
        if (!user) {
            return res.status(400).json({
                message: "User with given email address doesn't exist."
            })
        }

        let token = await Token.findOne({ userId: user._id });
        if (!token) {
            token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(20).toString('hex')
            })

            await token.save();
        }

        const link = `http://${process.env.WEBSITE_URL}/passwordReset/${user._id}/${token.token}`
        await sendEmail(user.email, "Password reset", link);

        res.status(200).json({
            message: "Password reset link sent successfully to your email address."
        })
    } catch (error) {
        res.status(500).json({
            message: "An error occured."
        })
        console.log(error);
    }
    
})

router.post('/passwordReset/:userId/:token', async (req, res) => {
    try {
        const user = await User.user.findById(mongoose.Types.ObjectId(req.params.userId));
        if (!user) {
            return res.status(400).send("invalid link or expired");
        }

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!token) {
            return res.status(400).send("Invalid link or expired");
        }

        //Password reset part
        console.log(token)
        let v = csprng(128);
        user.v = v;
        let salt = user.name + 'byteharvesterdev' + v;
        const hash = crypto.createHash('sha256').update(salt).digest('base64');
        salt = hash.substr(0, 22);
        await user.save();

        return res.status(200).json({
            salt: salt
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "An error occured."
        })
        
    }
})

router.post('/passwordReset/:userId/:token/2', async (req, res) => {
    try {
        const user = await User.user.findById(mongoose.Types.ObjectId(req.params.userId));
        if (!user) {
            return res.status(400).send("invalid link or expired");
        }

        console.log(user);

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token,
        });
        if (!token) {
            return res.status(400).send("Invalid link or expired");
        }

        user.password = req.body.password;//user.generateHash(req.body.password, user.name + 'byteharvesterdev' + user.v);
        const hash = crypto.createHash('sha256');
        hash.update(user.password);  //SHA256 with base64 strings
        user.hash = hash.digest('base64');
        user.password = user.hash;

        await user.save();
        return res.status(200).json({
            message: "Password changed successfully."
        });
        


    } catch (error) {
        res.status(500).json({
            message: "An error occured."
        })
        console.log(error);
    }
})

router.post('/getTutors', async (req, res) => {
    try {
        let list = await User.user.find({ accountType: "Tutor" });
        console.log(list);
        if (!list) {
            return res.status(200).json({
                message: 'No tutors found in the database.'
            });
        }

        res.status(200).json({
            tutors: list
        })
    } catch (error) {
        res.status(500).json({
            message: "An error occured."
        });
    }
})

router.get('/getStudents', async (req, res) => {
    try {
        let list = await User.user.find({ accountType: "Student", tutorName: req.tutorName });
        if (!list) {
            return res.status(200).json({
                message: 'No students found in the database.'
            });
        }

        res.status(200).json({
            tutors: list
        })
    } catch (error) {
        res.status(500).json({
            message: "An error occured."
        });
    }
})

router.post('/getUserType', async (req, res) => {
    try {
        let user = await User.user.findOne({ email: req.body.email });
        if (!user) {
            return res.status(200).json({
                message: 'User not found.'
            });
        }

        return res.status(200).json({
            userType: user.accountType
        })
    } catch (error) {
        return res.status(500).json({
            message: "An error occured."
        });
    }
})

// /getProfile gets the profile of the user
// body: { email: string} 
router.post('/getProfile', async (req, res) => {
    try {
        let user = await User.user.findOne({ email: req.body.email });
        if (!user) {
            res.status(200).json({
                message: 'User not found.'
            });
        }

        res.status(200).json({
            user: user
        })
    }
    catch (error) {
        res.status(500).json({
            message: "An error occured."
        });
    }
})

router.post('/submit', async (req, res) => {
    let insertIntoArray = true;
    try {
        if (req.body) {
            const user = await User.student.findOne({ email: req.body.email })
            user.solutions.forEach(solution => {
                if (solution.levelID == req.body.solutions.levelID) {
                    insertIntoArray = false;
                }
            });

            if (insertIntoArray) {
                user.solutions.push(req.body.solutions)
                user.save()
            } else {
                await User.student.updateOne({ email: req.body.email, "solutions.levelID": req.body.solutions.levelID }, {'$set': {
                    progress: req.body.progress,
                    'solutions.$.levelID': req.body.solutions.levelID,
                    'solutions.$.tagsList': req.body.solutions.tagsList,
                    'solutions.$.code': req.body.solutions.code,
                    'solutions.$.attempts': req.body.solutions.attempts,
                    'solutions.$.stepsTaken': req.body.solutions.stepsTaken,
                    'solutions.$.timeTaken': req.body.solutions.timeTaken,
                    'solutions.$.codeErrorsString': req.body.solutions.codeErrorsString
                }}, {upsert: true})
            }
            res.status(200).json({
                message: 'Successfully submitted your solution.'
            })
        }
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})

async function getUser(req, res, next) {
    let user
    try {
        user = await User.student.findById(req.params.id)
        if (user == null) {
            //404 - not found
            return res.status(404).json({
                message: "Cannot find user"
            })
        }
    } catch (err) {
        //500 - something is wrong with server
        return res.status(500).json({
            message: err.message
        })
    }

    res.user = user
    next()
}

module.exports = router;