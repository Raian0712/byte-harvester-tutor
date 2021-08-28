const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Token = require("../models/token");
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

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

//Getting One
router.get('/:id', getUser, (req, res) => {
    res.send(res.user)
})

//Creating One & register
router.post('/register', async (req, res) => {
    let user;
    if (req.body.accountType == 'Tutor') {
        user = new User.user({
            name: req.body.name,
            email: req.body.email,
            accountType: req.body.accountType,
        })
    } else {
        user = new User.student({
            name: req.body.name,
            email: req.body.email,
            accountType: req.body.accountType,
            solutions: {
                levelID: "0-0"
            }
        })
    }

    try {
        user.password = user.generateHash(req.body.password);
        const newUser = await user.save()
        res.status(201).json(newUser)
    } catch (err) {
        //400 = bad data
        res.status(400).json({
            message: err.message
        })
    }
})

//Login
router.post('/login', async (req, res) => {
    try {
        console.log(req.body)
        await User.user.findOne({ email: req.body.email }, function (err, user) {
            if (!user) {
                return res.status(200).json({
                    message: "User not found"
                });
            } 
            if (!user.validPassword(req.body.password)) {
                //password didn't match
                res.status(200).json({
                    message: "Invalid password."
                });

            } else {
                //password match, proceeds to login
                res.json({
                    message: "You're now logged in!"
                });
            }
                
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
})

//TODO: send reset password email https://dev.to/jahangeer/how-to-implement-password-reset-via-email-in-node-js-132m
/*router.post('/passwordReset', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email })
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
        }

        const token = `${process.env.BASE_URL}/passwordReset/${user._id}/${token.token}`
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
        const user = await User.findById(req.params.userId);
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


    } catch (error) {
        res.status(500).json({
            message: "An error occured."
        })
        console.log(error);
    }
})*/

//Updating One
router.patch('/:id', getUser, async (req, res) => {
    if (req.body.name != null) {
        res.user.name = req.body.name
    }
    if (req.body.accountType != null) {
        res.user.accountType = req.body.accountType
    }

    try {
        const updatedUser = await res.user.save()
        res.json(updatedUser)
    } catch (err) {
        res.status(400).json({
            message: err.message
        })
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
                    'solutions.$.code': req.body.solutions.code,
                    'solutions.$.attempts': req.body.solutions.attempts,
                    'solutions.$.stepsTaken': req.body.solutions.stepsTaken,
                    'solutions.$.timeTaken': req.body.solutions.timeTaken,
                    'solutions.$.codeErrors': req.body.solutions.codeErrors
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

//Deleting One
router.delete('/:id', getUser, async (req, res) => {
    try {
        await res.user.remove()
        res.json({
            message: "Deleted user"
        })
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