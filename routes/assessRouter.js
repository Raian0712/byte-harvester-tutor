const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.post('/getSubmission', async (req, res) => {
    try {
        await User.student.findOne({_id: req.body._id}, (err, user) => {
            if (err) {
                console.log(err);
                return res.status(404).send({message: 'User not found'});
            } else {
                if (user) {
                    //find solution for a specific levelID in user and returns the whole user object
                    user.solutions.forEach(solution => {
                        if (solution.levelID === req.body.levelID) {
                            return res.status(200).send(user);
                        }
                    });
                    
                } else {
                    res.send('No submission found');
                }
            }
        });
    } catch (error) {
        res.status(400).send(error);
    }
})

//TODO: submit assessment marks
router.post('/submit', async (req, res) => {
    try {
        await User.student.findOne({ email: req.body.studentEmail }, async (err, user) => {
            if (err) {
                return res.status(404).send(err.message)
            }

            //append req.body.marks into user.solutions.marks
            user.solutions.forEach(async (solution) => {
                if (solution.levelID == req.body.levelID) {
                    await User.student.updateOne({ email: req.body.studentEmail, "solutions.levelID": req.body.levelID }, {
                        '$set': {
                            'solutions.$.marks.amountOfTime': req.body.marks.amountOfTime,
                            'solutions.$.marks.efficiency': req.body.marks.efficiency,
                            'solutions.$.marks.correctness': req.body.marks.correctness,
                            'solutions.$.marks.attemptsTaken': req.body.marks.attemptsTaken
                        }
                    }, {upsert: true});

                    res.status(200).json({
                        message: "Successfully marked solution."
                    })

                    //mark tutor as tutor email
                    const tutor = await User.user.find({ email: req.body.tutorEmail });
                    if (tutor) {
                        user.tutorName = tutor.name;
                    }
                }
            });
        })
    } catch (error) {
        res.status(400).json({message: error})
    }
})

//TODO: get all assessment marks
/* body {
    tutorEmail
}*/
router.post('/getAll', async (req, res) => {
    try {
        //return all marks
        let list = await User.student.find({ tutorEmail: req.body.email });
        if (!list) {
            console.log('No student found with tutor name');
            return res.status(200).json({message: 'No student found with tutor name'})
        } 

        console.log(list);

        res.status(200).json({message: 'Successfully retrived all submissions.', students: list})
        
    } catch (error) {
        res.status(400).json({message: error})
    }
})

router.post('/getAllSubmissionsStudent', async (req, res) => {
    try {
        //return all marks
        let list = await User.student.findOne({ email: req.body.email });
        if (!list) {
            console.log('No student found with tutor name');
            return res.status(200).json({message: 'No student found with email'})
        } 

        console.log(list);

        res.status(200).json({message: 'Successfully retrived all submissions.', students: list})
        
    } catch (error) {
        res.status(400).json({message: error})
    }
})

module.exports = router;