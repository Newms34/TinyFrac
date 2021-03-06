const express = require('express');
const router = express.Router(),
    _ = require('lodash'),
    path = require('path'),
    maxAttempts = 10,
    // mongoose = require('mongoose'),
    uuid = require('uuid'),
    fs = require('fs');
//load config info either from local file OR from environment vars
const routeExp = function (io, mongoose) {
    this.isMod = (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!err && usr.mod) {
                next();
            } else {
                res.status(403).send('err');
            }
        });
    };
    this.isSuperMod = (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!err && usr.superMod) {
                next();
            } else {
                res.status(403).send('err');
            }
        });
    };
    this.authbit = (req, res, next) => {
        if (!req.session || !req.session.passport || !req.session.passport.user) {
            //no passport userid
            res.status(401).send('err');
        } else {
            mongoose.model('User').findOne({
                _id: req.session.passport.user
            }, function (err, usr) {
                // console.log(err, usr)
                if (!err && usr && !usr.isBanned && !usr.locked) {
                    usr.lastAction = Date.now();
                    usr.save((errsv, usv) => {
                        // truncus('after auth and LA update, usr is',usv)
                        // console.log('USER UPDATED AT', usr.lastAction,usv)
                        const cleanUsr = JSON.parse(JSON.stringify(usv));
                        delete cleanUsr.salt;
                        delete cleanUsr.pass;
                        // cleanUsr.inMsgs = [];
                        // cleanUsr.outMsgs = [];
                        // delete cleanUsr.id;
                        req.user = usv;
                        req.cleanUsr = cleanUsr;
                        next();
                    });
                } else {
                    res.status(403).send('err');
                }
            });
        }
    };
    this.needsChar = (req, res, next) => {
        console.log('IN NEEDSCHAR, WE HAVE',req.body)
        const thisChar = (req.body.char && req.body.char.name);
        if (req.user && req.user.chars && req.user.chars.length && req.body.char && !!req.user.chars.find(q => q.name.toLowerCase() == thisChar.toLowerCase())) {
            return next();
        }
        res.status(400).send('noChar');
    }
    //get & create group(s)
    router.get('/group', this.authbit, (req, res, next) => {
        mongoose.model('group').find({}, (err, grps) => {
            if (err || !grps || !grps.length) {
                return res.send(null);
            }
            res.send(grps)
        })
    });
    router.post('/group', this.authbit, this.needsChar, (req, res, next) => {
        if (!req.body.times || !req.body.levels || !req.body.char) {
            return res.status(400).send('missingData');
        }
        console.log(req.body)
        //NEED TO CHECK IF req.body.creator IS IN THIS USER'S CHAR LIST
        req.body.char.prof = req.body.char.subProf || req.body.char.prof;
        req.body.creator = req.body.char;
        req.body.members = [req.body.char];
        // return res.send('done');
        mongoose.model('group').create(req.body, function (err, grp) {
            if (err) {
                return res.status(400).send('err');
            }
            res.send('done');
        })
    });
    router.put('/group', this.authbit, (req, res, next) => {
        if (!req.body.grpId) {
            return res.status(400).send('noGrp');
        }
        mongoose.model.findOne({ grpId: req.body.grpId }, (err, grp) => {
            grp.times = (!!req.body.times && req.body.times) || grp.times;
            grp.notes = (!!req.body.notes && req.body.notes) || grp.notes;
            grp.levels = (!!req.body.levels && req.body.levels) || grp.levels;
            grp.save((err,sv)=>{
                res.send('refGrp');
            })
        });
    })
    router.delete('/group', this.authbit, this.needsChar, (req, res, next) => {
        if (!req.body.grpId) {
            return res.status(400).send('noGrp');
        }
        mongoose.model('group').findOneAndRemove({ grpId: req.body.grpId, creator: req.body.char }, (err, grp) => {
            if (err || !grp) {
                return res.status(400).send('err');
            }
            res.send('refGrp');
        })
    })
    /* These two routes add and remove members from a frac group. 
    Note that we need two separate routes, as the process of adding involves slotting an item into an array, but
    the process of removing involves first comparing two arrays (group members and current user characters) to see if there's overlap.*/
    router.put('/memberYes', this.authbit, this.needsChar, (req, res, next) => {
        //for ADDING member to group; we use a separate one for DELETING
        console.log('TRYING TO ADD USER TO GRP. INFO:',req.body)
        if (!req.body.grpId||!req.body.char) {
            return res.status(400).send('noData');
        }
        mongoose.model('group').findOne({ grpId: req.body.grpId }, (err, grp) => {
            if (err || !grp) {
                return res.status(400).send('err');
            }
            const hasChar = !!req.user.chars.find(q=>q.name==req.body.char.name),
            grpHasChar = !!grp.members.find(q=>q.name==req.body.char.name);
            if(!hasChar || grpHasChar){
                //cannot find this char! most likely trying to add someone ELSE's char
                //OR this char is already a member of this group
                return res.status(400).send('charErr')
            }
            grp.members.push(req.body.char);
            grp.save((err, gsv) => {
                res.send('refGrp')
            })
        })
    })
    router.put('/memberNo', this.authbit, this.needsChar, (req, res, next) => {
        //for REMOVING member to group; we use a separate one for ADDING
        if (!req.body.grpId||!req.body.char) {
            return res.status(400).send('noData');
        }
        mongoose.model('group').findOne({ grpId: req.body.grpId }, (err, grp) => {
            if (err || !grp) {
                return res.status(400).send('err');
            }
            const hasChar = !!req.user.chars.find(q=>q.name.toLowerCase()==req.body.char.name.toLowerCase()),
            grpHasChar = !!grp.members.find(q=>q.name.toLowerCase()==req.body.char.name.toLowerCase());
            console.log(hasChar,grpHasChar)
            if(!hasChar || !grpHasChar){
                //cannot find this char! most likely trying to add someone ELSE's char
                //OR this char is already a member of this group
                return res.status(400).send('charErr')
            }
            grp.members = grp.members.filter(q=>q.name.toLowerCase()!==req.body.char.name.toLowerCase());
            if(!grp.members.length){
                mongoose.model('group').deleteOne({_id:grp._id},(e,s)=>{
                    console.log('deleted groop!',grp._id)
                    res.send('refGrp');
                })
            }else{   
                grp.save((err, gsv) => {
                    res.send('refGrp');
                });
            }
        })
    })
    return router;
};

module.exports = routeExp;