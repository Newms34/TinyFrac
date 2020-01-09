app.controller('log-cont', function ($scope, $http, $state, $q, userFact, $log) {
    $scope.goReg = () => {
        $state.go('appSimp.register');
    };
    $scope.goLog = () => {
        $state.go('appSimp.login');
    };
    $scope.googLog = () => {
        window.location.href = './user/google';
    };
    $scope.cmmNoSecure = false;

    $scope.forgot = () => {
        if (!$scope.user) {
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Forgot Password', 'To recieve a password reset email, please enter your username!');
            return;
        }
        userFact.forgot({ user: $scope.user }).then(function (r) {
            $log.debug('forgot route response', r);
            if (r.data == 'err') {
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Forgot Password Error', "It looks like that account either doesn't exist, or doesn't have an email registered with it! Contact a mod for further help.");
            } else {
                bulmabox.alert('Forgot Password', 'Check your email! If your username is registered, you should recieve an email from us with a password reset link.');
            }
        });
    };
    $scope.signin = (u,p) => {
        $log.debug('trying to login with', $scope.user, $scope.pwd);
        userFact.login({ user: u||$scope.user, pass: p||$scope.pwd })
            .then((r) => {
                $log.debug(r);
                if (r.data == 'authErr' || !r.data) {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Incorrect Login', 'Either your username or password (or both!) are incorrect.');
                } else if (r.data == 'banned') {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Banned', "You've been banned!");
                } else {
                    // delete r.data.msgs;
                    $log.debug('LOGIN RESPONSE', r.data);
                    socket.emit('chatMsg', { msg: `${$scope.user} logged in!` });
                    localStorage.geoUsr = JSON.stringify(r.data.usr);
                    if (r.data.news) {
                        bulmabox.alert('Updates/News', `Since you last logged in, the following updates have been implemented:<br><ul style='list-style:disc;'><li>${r.data.news.join('</li><li>')}</li></ul>`);
                    }
                    $state.go('app.dash');
                }
            })
            .catch(e => {
                if (e.data.status == 'banned') {
                    return bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Banned', `You've been banned by moderator ${e.data.usr}!`);
                } else if (e.data = 'unconf') {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Unconfirmed', `You'll need to talk to Healy Unit or a TINY officer to confirm you. We do this for spam-prevention reasons! We're taking you back to the login page now.`);
                    return $state.go('appSimp.login');
                }
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Error', "There's been some sort of error logging in. This is <i>probably</i> not an issue with your credentials. Blame the devs!");
                $log.debug(e);
            });
    };
    $scope.nameOkay = true;
    $scope.checkUser = () => {
        if ($scope.checkTimer) {
            clearTimeout($scope.checkTimer);
        }
        $scope.checkTimer = setTimeout(function () {
            userFact.nameCheck($scope.user)
                .then((r) => {
                    $scope.nameOkay = r.data;
                });
        }, 500);
    };
    $scope.emailBad = false;
    // const emailRegex = new RegExp("[A-Za-z0-9]{3}@",'g')
    $scope.checkEmail = () => {
        $scope.emailBad = $scope.regForm.email && $scope.regForm.email.$viewValue && !$scope.regForm.email.$valid;
    };
    $scope.pwdNoDup = false;
    $scope.checkPwdDup = () => {
        //check to make sure the two passwords are "duplicates" (i.e, that they match)
        $scope.pwdNoDup = (!$scope.pwd && $scope.pwdDup) || ($scope.pwd && !$scope.pwdDup) ||($scope.pwd && $scope.pwdDup && $scope.pwd != $scope.pwdDup); 
    }
    $scope.pwdStrStars = [0, 1, 2, 3, 4,];
    $scope.badPwds = ['password', 'pass', '1234', '123', 'admin', 'abc', 'abcd', 'pwd'];
    $scope.pwdStr = { recs: [], score: 0, maxScore: 5, show: false }
    $scope.checkPwdStr = () => {

        if (!$scope.pwd) {
            return false;
        }
        const reqs = [{
            desc: 'Using at least one uppercase letter',
            reg: '[A-Z]'
        }, {
            desc: 'Using at least one lowercase letter',
            reg: '[a-z]'
        }, {
            desc: 'Using at least one number',
            reg: '[0-9]'
        }, {
            desc: 'Using at least one "special" character (@, !, $, etc.)',
            reg: '[@!\$\^_\*&]'
        }, {
            desc: 'Using at least 12 characters',
            reg: '[\\w]{12}'
        }, {
            desc: 'Not using a bad password',
            negate: true,
            reg: ['password', 'pass', '1234', '123', 'admin', 'abc', 'abcd', 'pwd'].map(q => `(${q})`).join('|')
        }],
            badStuff = reqs.filter(re => { //stuff we're MISSINg
                const reg = new RegExp(re.reg);
                if (re.negate) {
                    return !!reg.test($scope.pwd);
                }
                return !reg.test($scope.pwd);
            });
        $scope.pwdStr = { recs: badStuff, score: reqs.length - badStuff.length, maxScore: 5, show: $scope.pwdStr.show }
    }
    $scope.sendReg = u => {
        userFact.newUser(u)
            .then((ts) => {
                $log.debug('USER WE JUST REGD WAS',u)
                //if we have an API key, we're gonna try to use that first to populate everything. Otherwise, just login!
                if(u.API){
                    $log.debug('HERE IS WHERE WE TRY TO USE THE API KEY');
                    $http.put(`/user/confirmViaApi`,{k:u.API,u:u.user}).then(pp=>{
                        $log.debug('USER CONFIRMED AS BELONGING TO: ',pp.data)
                        userFact.preFillFromAPI(u.API,u.user,u.pass).then(rd=>{
                            $log.debug('RESULT FROM PREFILL',rd)
                            $scope.signin(u.user,u.pass)
                        })
                    }).catch(e=>{
                        bulmabox.alert('Invalid API Key',`While we were able to register you, we can't seem to use your API key. You'll need to ask a TINY officer to confirm you, and then enter your information manually.<br>Sorry!`);
                        $state.go('appSimp.login');
                    })
                }
                else{
                    $scope.signin($scope.user,$scope.pwd);
                }
            }).catch(e => {
                if (e.data == 'duplicate') {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                }
            });
    }
    $scope.register = () => {
        if (!$scope.pwd || !$scope.pwdDup || !$scope.user) {
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Missing Information', 'Please enter a username, and a password (twice).');
        } else if ($scope.pwd != $scope.pwdDup) {
            $log.debug('derp');
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Password Mismatch', 'Your passwords don\'t match, or are missing!');
        } else if (!$scope.email || $scope.emailBad) {
            bulmabox.confirm('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Send Without Email?', `You've either not included an email, or the format you're using doesn't seem to match any we know. <br>While you <i>can</i> register without a valid email, it'll be much more difficult to recover your account if you forget your password!<br>Register anyway?`, function (resp) {
                if (!resp || resp == null) {
                    return false;
                }
                const theUsr = {
                    user: $scope.user,
                    pass: $scope.pwd,
                    email: $scope.email || null,
                    API: $scope.apiKey || null
                };
                $scope.sendReg(theUsr);
            });
        } else {
            // $log.debug('running register with user', $scope.user, 'and pwd', $scope.pwd);
            const theUsr = {
                user: $scope.user,
                pass: $scope.pwd,
                email: $scope.email || null,
                API: $scope.apiKey || null
            };
            $scope.sendReg(theUsr);
        }
    };
});