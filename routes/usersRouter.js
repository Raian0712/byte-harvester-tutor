const express = require('express');
const router = express.Router();
const User = require('../models/user')

// Getting all
router.get('/', async (req, res) => {
    try {
        const users = await User.find()
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
    const user = new User({
        name: req.body.name,
        accountType: req.body.accountType
    })

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
        await User.findOne({ username: req.body.username }, function (err, user) {
            if (!user.validPassword(req.body.password)) {
                //password didn't match
                res.json({
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
        user = await User.findById(req.params.id)
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