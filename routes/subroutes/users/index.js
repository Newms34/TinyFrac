const express = require('express');
const router = express.Router(),
    _ = require('lodash'),
    path = require('path'),
    maxAttempts = 10,
    // mongoose = require('mongoose'),
    uuid = require('uuid'),
    passport = require('passport'),
    axe = require('axios'),
    specializations = require('./profData.json'),
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
    this.findUserNames = (param) => {
        return function (req, res, next) {
            // console.log('incoming data to findUserNames', req.body, param);
            if (!req.body || !req.body[param] || !req.body[param].length) {
                return next();//cannot find param, so just run Next
            }
            const usrProms = req.body[param].map(q => {
                // console.log('Trying to find user to match:', q)
                return mongoose.model('User').findOne({
                    $or: [{ user: q }, { displayName: q }]
                });
            });
            Promise.all(usrProms).then(r => {
                // console.log(r)
                req.body.users = r.map(a => ({ user: a.user, displayName: a.displayName }));
                next();
            });
        };
    };
    //login/acct creation
    router.post('/new', function (req, res, next) {
        passport.authenticate('local-signup', function (err, user, info) {
            // truncus('err', err, 'usr', user, 'inf', info)
            if (err) {
                return res.status(400).send(err);
            }
            res.send('done');
        })(req, res, next);
    });
    router.put('/login', function (req, res, next) {
        // console.log('body', req.body);
        const logStart = Date.now();
        if (!req.body || !req.body.pass || !req.body.user) {
            // console.log('Missing info!');
            return res.status(400).send(false);
        }
        passport.authenticate('local-login', function (err, uObj, info) {
            let usr = uObj.u;
            // console.log('USER',usr,'ERR',err,'INFO',info);
            if (!info) {
                //wrong un/pwd combo
                mongoose.model('User').findOne({
                    'user': req.body.user
                }, (_err, usrwc) => {
                    if (!usrwc || usrwc.wrongAttempts < maxAttempts) {
                        return res.send(false);
                    }
                    usrwc.wrongAttempts = 0;
                    usrwc.locked = true; //too many incorrect attempts; lock account & wait for teacher;
                    refStu();
                    usrwc.save((_erru, _svu) => {
                        return res.status(403).send({ status: 'locked' });
                    });
                });
            } else {
                if (usr && !usr.isBanned && !usr.locked) {
                    if(!usr.confirmed){
                        return res.status(400).send('unconf')
                    }
                    req.session.passport = {
                        user: usr._id
                    };
                    usr.pass = null;
                    usr.salt = null;
                    const clUsr = JSON.parse(JSON.stringify(usr));
                    delete clUsr.pass;
                    delete clUsr.salt;
                    // console.log('TIME FOR LOGIN ROUTE', Date.now() - logStart);
                    res.send({
                        usr: clUsr
                    });
                }
                if (!!usr.isBanned) {
                    mongoose.model('User').findOne({ user: usr.isBanned }, (errm, md) => {
                        return res.status(403).send({ status: 'banned', usr: md.displayName || md.user });
                    });
                } else if (usr.locked) {
                    return res.status(403).send({ status: 'locked' });
                }
            }
        })(req, res, next);
    });
    router.get('/logout', function (req, res, next) {
        /*this function logs out the user. It has no confirmation stuff because
        1) this is on the backend
        2) this assumes the user has ALREADY said "yes", and
        3) logging out doesn't actually really require any credentials (it's logging IN that needs em!)
        */
        console.log('usr sez bai');
        req.session.destroy();
        res.send('logged');
    });
    router.get('/google', passport.authenticate('google-signup', {
        scope: ['profile']
    }));
    router.get('/redir', passport.authenticate('google-signup', {
        failureRedirect: '../login?dup'
    }), (req, res) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (_err, usr) {
            res.redirect('../');
        });
    });
    //user duplicate and data stuff
    router.get('/getUsr', this.authbit, (req, res, next) => {
        res.send(req.user);
    });
    router.get('/usrData', this.authbit, function (req, res, next) {
        // console.log('asking for secure(ish) user',req.cleanUsr)
        res.send(req.cleanUsr);
    });

    router.get('/allUsrs', this.authbit, (req, res, next) => {
        let aus = Date.now();
        console.log('Start time for AllUsrs route', aus);
        mongoose.model('User').find({}, function (err, usrs) {
            const badStuff = ['msgs', 'salt', 'googleId', 'pass'],
                usrSend = _.cloneDeep(usrs).map(u => {
                    //we wanna remove all the sensitive info
                    badStuff.forEach(d => {
                        if (u[d]) {
                            u[d] = null;
                        }
                    });
                    return u;
                });
            let aue = Date.now();
            console.log('End time for AllUsrs route', aue + '. Elapsed time', aue - aus);
            res.send(usrSend);
        });
    });
    router.get('/nameOkay', function (req, res, next) {
        mongoose.model('User').find({ $or: [{ user: req.query.name }, { displayName: req.query.name }] }, function (err, user) {
            // console.log('USER CHECK', user);
            res.send(!user.length);
        });
    });
    router.put('/ava', this.authbit, (req, res, next) => {
        req.user.avatar = req.body.img;
        // console.log('USER NOW', req.body, usr);
        req.user.save((errsv, usrsv) => {
            res.send('refresh');
        });
    });
    router.get('/setEmail', authbit, (req, res, next) => {
        ///(\w+\.*)+@(\w*)(\.\w+)+/g
        if (!req.query.email || !req.query.email.match(/(\w+\.*)+@(\w+\.)+\w+/g) || (req.query.email.match(/(\w+\.*)+@(\w+\.)+\w+/g)[0].length !== req.query.email.length)) {
            res.send('err');
            return false;
        }
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.email = req.query.email;
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            });
        });
    });
    //automatic gw2 account stuff (create/edit chars, get account frac lvl)
    router.put('/addByAPI', this.authbit, (req, res, next) => {
        //using a gw2 api key, fetch the characters for this account. This overwrites current chars
        if (!req.query.k) {
            res.status(401).send('noKey');
        }
        axe.get('https://api.guildwars2.com/v2/characters?ids=all&access_token=' + req.query.k).then(r => {
            // ({
            //     name: c.name,
            //     prof: c.profession,
            //     race: c.race
            // })
            req.user.chars = r.data.map(c => {
                const subProfOpts = c.specializations.pve.map(sp=>specializations.elites.find(q=>q.id==sp.id)).filter(f=>!!f);
                // console.log(c.name,subProfOpts);
                const chr = {
                        name: c.name,
                        prof: c.profession,
                        race: c.race,
                        level:c.level,
                        icon:specializations.regular[c.profession]
                    }
                if(!!subProfOpts.length && subProfOpts[0]){
                    chr.subProf = subProfOpts[0].name,
                    chr.icon = subProfOpts[0].icon
                }
                return chr;
            });
            // res.send(r.data);
            //now, we need the user's fractal lvl
            axe.get('https://api.guildwars2.com/v2/account?access_token=' + req.query.k).then(r=>{
                req.user.fracLvl = r.data.fractal_level;
                req.user.save((e, s) => {
                    res.send('refresh');
                })
            }).catch(e=>{
                console.log('fl err',e)
                res.status(400).send('err')
            })
        }).catch(e=>{
            console.log('getChar err',e,'key was',req.query.k)
            res.status(400).send('err')
        })
    })
    // router.put('/fracLevel', this.authbit, (req, res, next) => {
    //     axe.get('https://api.guildwars2.com/v2/account?access_token=' + req.query.k).then(r => {
    //         req.user.fracLvl = r.data.fractal_level;
    //         req.user.save((e, s) => {
    //             res.send('refresh');
    //         })
    //     })
    // })
    //manual gw2 account stuff (if user wants!)
    router.delete('/char',this.authbit,(req,res,next)=>{
        req.user.chars = req.user.chars.filter(q=>q._id!=req.query.c);
        req.user.save((e,s)=>{
            res.send('refresh')
        })
    })
    router.put('/char',this.authbit,(req,res,next)=>{
        const missingInfo = ['name','prof','race','level'].filter(q=>!req.body[q]);
        if(missingInfo && missingInfo.length){
            return res.status(400).send('err')
        }
        if(req.user.chars.find(q=>q.name.toLowerCase()==req.body.name)){
            return res.status(400).send('duplicate');
        }
        req.user.chars.push(req.body);
        req.user.save((e,s)=>{
            console.log('ERR',e,'SAVE',s)
            res.send('refresh');
        })
        // res.send('noNewChars');
    })
    router.put('/fracManual',this.authbit,(req,res,next)=>{
        req.user.fracLvl = req.query.l|| req.user.fracLvl;
        req.user.save((e,s)=>{
            res.send('refresh')
        })
    })
    //mod stuff
    router.get('/users', this.authbit, this.isMod, (req, res, next) => {
        mongoose.model('User').find({}).lean().exec(function (err, usrs) {
            if (err || !usrs || !usrs.length) {
                return res.status(400).send('noUsrs');
            }
            // console.log('filtering out',req.user.user);
            const safeUsrs = usrs.filter(uf => {
                // return Math.random()>0.5
                return uf.user !== req.user.user;
            }).map(q => {
                return {
                    user: q.user,
                    displayName: q.displayName,
                    demo: q.isDemoUser,
                    interests: q.interests,
                    teaching: q.teaching,
                    mod: q.mod,
                    isBanned: q.isBanned
                };
            });
            res.send(safeUsrs);
        });
    });
    router.put('/toggleBan', this.authbit, this.isMod, (req, res, next) => {
        mongoose.model('User').findOne({
            user: req.body.user
        }, function (err, usr) {
            // console.log('CHANGING BAN STATUS OF', req.body.user, 'WHO IS', usr.user);
            if (!!usr.isBanned) {
                usr.isBanned = null;
            } else {
                usr.isBanned = req.user.user;
            }
            usr.save(function (err, resp) {
                mongoose.model('User').find({}, function (err, usrs) {
                    const badStuff = ['msgs', 'salt', 'googleId', 'pass'];
                    res.send(_.cloneDeep(usrs).map(u => {
                        //we wanna remove all the sensitive info
                        badStuff.forEach(d => {
                            if (u[d]) {
                                delete u[d];
                            }
                        });
                        return u;
                    }));
                });
            });
        });
    });
    //password stuff    
    router.post('/editPwd', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (usr && usr.correctPassword(req.body.old) && req.body.pwd == req.body.pwdDup) {
                // console.log('got correct pwd, changing!');
                usr.salt = mongoose.model('User').generateSalt();
                usr.pass = mongoose.model('User').encryptPassword(req.body.pwd, usr.salt);
                usr.save((err, usrsv) => {
                    res.send(usrsv);
                });
            } else {
                res.send('err');
            }
        });
    });
    router.put('/forgot', function (req, res, next) {
        //user enters username, requests reset email
        //this IS call-able without credentials, but
        //as all it does is send out a reset email, this
        //shouldn't be an issue
        mongoose.model('User').findOne({
            user: req.body.user
        }, function (err, usr) {
            // console.log(err, usr, req.body);
            if (!usr || err) {
                res.send('err');
                return;
            } else {
                let jrrToken = uuid.v1();
                for (let i = 0; i < 15; i++) {
                    jrrToken += uuid.v4();
                }
                if (!usr.email) {
                    res.send('err');
                    return false;
                }
                // console.log(jrrToken);
                //req.protocol,req.get('host')
                const resetUrl = req.protocol + '://' + req.get('host') + '/user/reset?key=' + jrrToken;
                usr.reset = jrrToken;
                usr.save(function () {
                    const msg = {
                        to: usr.email,
                        from: 'no-reply@codementormatch.herokuapp.com',
                        subject: 'Password Reset',
                        text: 'Someone (hopefully you!) requested a reset email for your CodeMentorMatch account. If you did not request this, just ignore this email. Otherwise, go to ' + resetUrl + '!',
                        html: 'Someone (hopefully you!) requested a reset email for your CodeMentorMatch account. <br>If you did not request this, just ignore this email.<br>Otherwise, click <a href="' + resetUrl + '">here</a>',
                    };
                    sgMail.send(msg);
                    res.end('done');
                });
            }
        });
    });
    router.get('/reset', function (req, res, next) {
        //trying to get reset page using req.query. incorrect token leads to resetFail
        const rst = req.query.key;
        if (!rst) {
            // console.log('NO KEY!');
            res.sendFile('resetFail.html', {
                root: './views'
            });
        } else {
            mongoose.model('User').findOne({
                reset: rst
            }, function (err, usr) {
                if (err || !usr) {
                    // console.log('NO USER!');
                    res.sendFile('resetFail.html', {
                        root: './views'
                    });
                }
                res.sendFile('reset.html', {
                    root: './views'
                });
            });
        }
    });
    router.get('/resetUsr', function (req, res, next) {
        // get user info by key for the reset.html page
        const rst = req.query.key;
        if (!rst) {
            res.send('err');
        } else {
            // console.log('lookin for key:', rst);
            mongoose.model('User').findOne({
                reset: rst
            }, function (err, usr) {
                if (err) {
                    res.status(400).send('err');
                } else if (!usr) {
                    res.status(400).send('noUsr');
                } else {
                    res.send(usr);
                }
            });
        }
    });
    router.put('/resetPwd/', function (req, res, next) {
        if (!req.body.acct || !req.body.pwd || !req.body.key || !req.body.pwdDup || (req.body.pwdDup != req.body.pwd)) {
            res.send('err');
        } else {
            mongoose.model('User').findOne({
                reset: req.body.key
            }, function (err, usr) {
                if (err || !usr || usr.user !== req.body.acct) {
                    res.send('err');
                } else {
                    // console.log('usr before set:', usr);
                    // usr.setPassword(req.body.pwd, function() {
                    usr.salt = mongoose.model('User').generateSalt();
                    usr.pass = mongoose.model('User').encryptPassword(req.body.pwd, usr.salt);
                    // console.log('usr after set:', usr);
                    // usr.reset = null;
                    usr.save();
                    res.send('done');
                    // });
                }
            });
        }
    });
    //supermod stuff
    router.get('/confirm',this.authbit,this.isSuperMod,(req,res,next)=>{
        mongoose.model('User').findOne({
            user:req.query.u
        },(err,u)=>{
            if(err||!u){
                return res.status(400).send('err');
            }
            u.confirmed = true;
            u.save((e,s)=>{
                res.send('Confirmed '+u.user);
            })
        });
    })
    return router;
};

module.exports = routeExp;