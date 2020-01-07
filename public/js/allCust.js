;(function() {
"use strict";

const socket = io(),
    app = angular.module('tf-app', ['ui.router', 'ngAnimate', 'ngSanitize', 'ngMaterial', 'ngMessages']),
    resetApp = angular.module('reset-app', []);

const defaultPic = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAACNCAIAAAAPTALlAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAANsSURBVHhe7dVRduIwEETR7GkWmK1HhMch9giw1dWyZNf9mZwM2F3vJ1//TM1N9dxUz0313FTPTfVGb/r9Fh8azIhNCbYTXx7AWE3JE8CDDjVEU3pI8egjHN+UBgl4QXdHNmV6Ml7W0WFNWdwFr+zlgKYM7Y7X5+vdlH0H4YhkXZuy7FCckqlfUzYNgIPSdGrKmmFwVo6LNi24LEGPpowYDMclSG/KgiFxotqlmxZcKZXblMMHxqFSiU25enicq+OmN1wsktWUYyfB0SJuesPRIilNuXQqnK7gpuB0BX1TbpwQA8Lc9IkBYW66wIYYcVNOmxYzYtx0gRkxbrrAjBhlU+6aHGMC3HSNMQFuusaYADddY0yAm64xJsBNK9jTStaUc06BSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrWRNCy6aH3tauekaYwLcdI0xAW66xpgAN11jTICbrjEmQNm04K5pMSPGTReYEeOmC8yIcdMFZsSImxZcNyEGhLnpEwPC9E0LbpwKpyu4KThdIaVpwaWT4GgRN73haBE3veFokaymBfcOj3N1EpsWXD0wDpVyU73cpgW3D4kT1dKbFiwYDMcl6NG0YMdIuCzBRZtyVo5OTQvWDICD0vRrWrDpUJySqWvTgmUH4YhkvZsW7OuO1+e7SlPe3cXl/kZxTaZOTRk0Bm5Kk96UHePhvgS5TTl/YBwqldWUk2fAxTopTTl2HtwtIm7KjXNiQ5iyKafNjCUxsqYcNT/2BGiacs5ZsKqVoCmHnAvbmkSbcsIZsXC/UFNefl7s3Km9Ka89O9bu0diUF14DmzdracqrroTl27jpJizfZndTXnI97N9gX1Mef1VU+GRHUx58bbR4y033ocVbW5vySNuQdVNTHmYPdHnBTVvQ5YXPTXmMLVGnxk0bUafmQ1MeYDU0+s+7pnzVXqPUkpuGUGrpZVO+ZJ/Q6w83jaLXH24qQLKHelM+a9tQ7cFNBaj2UGnKB20P2v1yUw3a/Vo35SO2HwXdVIiCbipEwVVT/tNa3TO6qdI9o5sq3TO6qVjJ+GzK7yymlHRTsVLSTcVKSZryC1NwUz031XNTPTfVuzXlRxNxUz031XNTPTfVc1M9N9VzU70v/jWV7+8ffZYE08zo+Y8AAAAASUVORK5CYII=';

Array.prototype.findUser = function (u) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].user == u) {
            return i;
        }
    }
    return -1;
};
let hadDirect = false;
const dcRedirect = ['$location', '$q', '$injector', function ($location, $q, $injector, $http) {
    //if we get a 401 response, redirect to login
    let currLoc = '';
    return {
        request: function (config) {
            // $log.debug('STATE', $injector.get('$state'));
            currLoc = $location.path();
            return config;
        },
        requestError: function (rejection) {
            return $q.reject(rejection);
        },
        response: function (result) {
            return result;
        },
        responseError: function (response) {
            $log.debug('Something bad happened!', response, currLoc, $location.path());
            hadDirect = true;
            bulmabox.alert(`App Restarting`, `Hi! I've made some sort of change just now to make this app more awesome! Unfortunately, this also means I've needed to restart it. I'm gonna log you out now.`, function (r) {
                fetch('/user/logout')
                    .then(r => {
                        hadDirect = false;
                        $state.go('appSimp.login', {}, {
                            reload: true
                        });
                        return $q.reject(response);
                    });
            });
        }
    };
}];
app
    .constant('IsDevelopment', window.location.hostname === 'localhost')
    .config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', '$compileProvider', '$logProvider','IsDevelopment','$mdGestureProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $compileProvider, $logProvider, IsDevelopment,$mdGestureProvider) {
        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise('/404');
        $mdGestureProvider.skipClickHijack();
        $compileProvider.debugInfoEnabled(IsDevelopment);
        $logProvider.debugEnabled(IsDevelopment);
        if(IsDevelopment) console.log('-------------------------\nDebug mode enabled \n-------------------------');
        $stateProvider
            //the states
            //NORMAL states (auth'd)
            .state('app', {
                abstract: true,
                templateUrl: 'layouts/full.html'
            })
            .state('app.dash', {
                url: '/', //default route, if not 404
                templateUrl: 'components/dash.html'
            })
            .state('app.group', {
                url: '/group',
                templateUrl: 'components/group.html'
            })
            //SIMPLE (unauth'd: login, register, forgot, 404, 500,reset)
            .state('appSimp', {
                abstract: true,
                templateUrl: 'components/layout/simp.html'
            })
            .state('appSimp.login', {
                url: '/login',
                templateUrl: 'components/login.html'
            })
            .state('appSimp.register', {
                url: '/register',
                templateUrl: 'components/register.html'
            })
            //and finally, the error-handling routes!
            .state('appSimp.notfound', {
                url: '/404',
                templateUrl: 'components/alt/404.html'
            })
            .state('appSimp.err', {
                url: '/500',
                templateUrl: 'components/alt/500.html'
            });

        //provider stuff

        $httpProvider.interceptors.push(function ($q) {
            return {
                // optional method
                'request': function (config) {
                    // do something on success
                    return config;
                },

                // optional method
                'requestError': function (rejection) {
                    return $q.reject(rejection);
                },

                // optional method
                'response': function (response, $http) {
                    // do something on success
                    // $log.debug('RESPONSE INTERCEPTOR', response && response.data)
                    if (response && response.data && response.data == 'refresh') {
                        // console.log('need to refresh',socket,socket.to)
                        socket.emit('requestRefresh',{id:socket.id})
                    }else if (response && response.data && response.data == 'refGrp') {
                        // console.log('need to refresh',socket,socket.to)
                        socket.emit('requestRefGrp',{id:socket.id})
                    }
                    return response;
                },

                // optional method
                'responseError': function (rejection) {
                    // do something on error
                    return $q.reject(rejection);
                }
            };
        });
    }])
    //the following are for file uploading and markdown conversion. I don't THINK we'll need em, but... eh
    .directive("fileread", ['$log',function ($log) {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    const reader = new FileReader(),
                        theFile = changeEvent.target.files[0],
                        tempName = theFile.name;
                    $log.debug('UPLOADING FILE', theFile);
                    reader.onload = function (loadEvent) {
                        let theURI = loadEvent.target.result;
                        $log.debug('URI before optional resize', theURI, theURI.length);
                        if (scope.$parent.needsResize) {
                            //needs to resize img (usually for avatar)
                            resizeDataUrl(scope, theURI, scope.$parent.needsResize, scope.$parent.needsResize, tempName);
                        } else {
                            $log.debug('APPLYING file to $parent', scope.$parent);
                            scope.$apply(function () {
                                if (scope.$parent && scope.$parent.$parent && scope.$parent.$parent.avas) {

                                    scope.$parent.$parent.loadingFile = false;
                                    scope.$parent.$parent.fileName = 'Loaded:' + tempName;
                                    scope.$parent.$parent.fileread = theURI;
                                } else {
                                    scope.$parent.loadingFile = false;
                                    scope.$parent.fileName = 'Loaded:' + tempName;
                                    scope.$parent.fileread = theURI;
                                }
                                if (scope.$parent.saveDataURI && typeof scope.$parent.saveDataURI == 'function') {
                                    scope.$parent.saveDataURI(dataURI);
                                }
                            });
                        }
                    };
                    if (!theFile) {
                        scope.$apply(function () {
                            scope.fileread = '';
                            scope.$parent.fileName = false;
                            scope.$parent.loadingFile = false;
                        });
                        return false;
                    }
                    if (theFile.size > 2500000) {
                        bulmabox.alert('File too Large', `Your file ${theFile.name} is larger than 2.5MB. Please upload a smaller file!`);
                        return false;
                    }
                    reader.readAsDataURL(theFile);
                });
            }
        };
    }]);
    

String.prototype.titleCase = function () {
    return this.split(/\s/).map(t => t.slice(0, 1).toUpperCase() + t.slice(1).toLowerCase()).join(' ');
};

const resizeDataUrl = (scope, datas, wantedWidth, wantedHeight, tempName) => {
    // We create an image to receive the Data URI
    const img = document.createElement('img');

    // When the event "onload" is triggered we can resize the image.
    img.onload = function () {
        // We create a canvas and get its context.
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // We set the dimensions at the wanted size.
        canvas.width = wantedWidth;
        canvas.height = wantedHeight;

        // We resize the image with the canvas method drawImage();
        ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);

        const dataURI = canvas.toDataURL();
        scope.$apply(function () {
            scope.$parent.loadingFile = false;
            scope.$parent.fileName = 'Loaded:' + tempName;
            scope.fileread = dataURI;
            if (scope.$parent.saveDataURI && typeof scope.$parent.saveDataURI == 'function') {
                //only for avatar
                scope.$parent.saveDataURI(dataURI);
            }
        });
    };

    // We put the Data URI in the image's src attribute
    img.src = datas;
};

app.directive('postrenderAction', postrenderAction);

/* @ngInject */
function postrenderAction($timeout) {
    // ### Directive Interface
    // Defines base properties for the directive.
    const directive = {
        restrict: 'A',
        priority: 101,
        link: link
    };
    return directive;

    // ### Link Function
    // Provides functionality for the directive during the DOM building/data binding stage.
    function link(scope, element, attrs) {
        $timeout(function () {
            scope.$evalAsync(attrs.postrenderAction);
        }, 0);
    }
}
app.controller('dash-cont', ($scope, $http, $q, userFact, $log) => {
    // $log.debug("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    $scope.refUsr();
    $scope.getCharsFromAPI = () =>{
        console.log('trying to use key',$scope.apiKey)
        userFact.getCharsFromAPI($scope.apiKey).then(r=>{
            console.log('getUsers Response',r)
            if(!status|| status==400){
                throw new Error('badApi')
            }
            $scope.refUsr();
        }).catch(e=>{
            console.log('getUsers Err',e)
            bulmabox.alert('API Error','There was an error with your API key. Make sure you have a valid key with correct permissions, then retry.')
        })
    }
    $scope.addChar = ()=>{
        
    }
    $scope.removeChar = c =>{
        const descStr = `${c.race=='Asura'?'an':'a'} ${c.race} ${c.subProf||c.prof}`
        bulmabox.confirm('<i class="fa fa-question-circle"></i>&nbsp;Remove Character',`Are you sure you wish to remove ${c.name} (${descStr})?`,r=>{
            if(!!r){
                userFact.removeChar(c).then(r=>{
                    bulmabox.alert('Removed!',`You've removed ${c.name}!`);
                })
            }
        })
    }
    $scope.explAPI = ()=>{
        bulmabox.alert('API Keys',`<strong>Huh?:</strong> An API (Application Programming Interface &#129299) is a special way for different computer programs/sites to talk to each other. Guild Wars 2/ArenaNet provides these as a way for 3rd-party applications to communicate with the game engine. <br><br>
        <strong>So... What's it do?:</strong> Basically, the API key allows me (Healy Unit) to automatically get certain information about your characters (such as their level/profession/race) and automatically fill in the correct "spots" without you having to type it all in!<br><br>
        <strong>But is it safe?:</strong> Above all, the GW2 API is <i>read-only</i>. In other words, while I could potentially <i>see</i> that you have an Eternity, I can't <i>do</i> anything with that info. Almost all major GW2 fansites (gw2efficiency, for example) use API keys in some format.<br><br>
        <strong><i class="fa fa-hand-o-right wiggle" title="if you're sure!"></i>&nbsp;Okay, I'm convinced!:</strong> Great! Just head on over to <a href="https://account.arena.net/">https://account.arena.net/</a> and sign in (this is an official site, so don't worry). Then click the Applications tab, and click the "New Key" button if you don't already have an API key. Then click the copy button (<i class="fa fa-files-o"></i>) button to copy your key to the clipboard. Finally, paste that here and click the "Use API Key" button.<br><br>
        <strong>I still don't feel safe:</strong> Fair enough. Security is a pretty big concern these days. Feel free to click the "Manage Characters (Manual)" button above and enter your characters manually.`,{okay:{txt:'Got it!'}})
    }
    //fracLvl manual adjust stuff
    $scope.fracTimer = null;
    $scope.chFracTimer = ()=>{
        if(!!$scope.fracTimer){
            clearTimeout($scope.fracTimer);
        }
        $scope.fracTimer = setTimeout(function(){
            userFact.chFracLvl($scope.user.fracLvl).then(r=>{
                //do nuffin
            })
        },500)
    }
});
const countDups = (arr, p) => {
    if (!arr || !arr.length) {
        return false;
    }
    const nameCount = {};
    for (let i = 0; i < arr.length; i++) {
        if (!nameCount[arr[i][p]]) {
            nameCount[arr[i][p]] = 1;
        } else {
            return nameCount[arr[i][p]];
        }
    }
    return false;
};
app.controller('group-cont', ($scope, $http, $q, userFact, $log) => {
    // $log.debug("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    $scope.refUsr();
    $scope.refGrps = () => {
        $http.get('/groups/group').then(r => {
            console.log(r.data)
            $scope.groups = r.data;
        })
    }
    $scope.newGrp = {};
    socket.on('refreshGrpById', u => {
        $scope.refGrps();
    });
    $scope.submitNewGrp = () => {
        if (!$scope.newGrp.times || !$scope.newGrp.levels || !$scope.newGrp.char) {
            return bulmabox.alert('Missing Info', `Hey! You need to at least tell us when your group's gonna meet and what levels you're gonna do.<br> In addition, you need to pick the character you wanna participate with.`);
        } else {
            $http.post('/groups/group', $scope.newGrp).then(r => {
                console.log(r);
                $scope.makinGroup = false;
                $scope.$digest();
            })
        }
    }
    $scope.addGrp = d => {
        console.log(d);
        const char = $scope.isGrpMember[0];
        const otherOpts = $scope.$parent.$parent.user.chars.map(q=>{
            return `<option value='${q.name}'>${q.name} (${q.race} ${q.subProf||q.prof})</option>`;
        }).join('');
        bulmabox.custom('Join Group',`
        What character do you wanna join this group with?:
        <p class="select">
        <select id='join-grp-select'>
            <option selected disabled class='has-text-grey' value=''>Which character do you wanna join with?</option>
            ${otherOpts}
        </select>
        </p>
        `,function(r){
            const choiceName = document.querySelector('#join-grp-select').value,
            choice = $scope.$parent.$parent.user.chars.find(a=>a.name==choiceName);
            console.log('USER PICKED',choice,'FOR GROUP',d,'BUT IM NOT GONNA DO ANYTHING WITH IT SO THERE')
            $http.put('/groups/member', { grpId: d,char:choice}).then(r => {
                console.log(r);
            })
        },`<button class='button is-info' onclick='bulmabox.runCb(bulmabox.params.cb,true)'>Got it!</button>`)
    }
    $scope.removeGrp = d => {
        bulmabox.confirm('Leave Group','Are you sure you wish to leave this group?',function(r){
            if(!!r){
                const char = $scope.isGrpMember(d)[0];
                console.log('wanna remove member',char);
                // return false;
                $http.delete('/groups/member', { grpId: d, char:char}).then(r => {
                    console.log(r);
                })
            }
        })
    }
    $scope.clearNewGrp = ()=>{
        $scope.newGrp =  {};
        $scope.makinGroup=false;
    }
    $scope.isGrpMember = (grp) => {
        const user = $scope.user || $scope.$parent.user || $scope.$parent.$parent.user;
        const simpUserChars = user.chars.map(q => q.name.toLowerCase());
        // console.log('$SCOPE HERE',$scope.$parent.$parent.user,simpUserChars,grp.members.map(q=>q.name.toLowerCase()).filter(cig=>simpUserChars.includes(cig)))
        // return grp.members.map(q => q.name.toLowerCase()).filter(a => simpUserChars.includes(a)).length;
        return grp.members.map(q=>q.name.toLowerCase()).filter(cig=>simpUserChars.includes(cig));
    }
    $scope.refGrps();
});

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
    $scope.signin = () => {
        $log.debug('trying to login with', $scope.user, $scope.pwd);
        userFact.login({ user: $scope.user, pass: $scope.pwd })
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
                }
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Error', "There's been some sort of error logging in. This is <i>probably</i> not an issue with your credentials. Blame the devs!");
                $log.debug(e);
            });
    };
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
        // console.log('document active el',document.activeElement)
        // console.log('comparing',$scope.regForm.email.$viewValue,'onlyIfInv',onlyIfInv,'emailBad curr val',$scope.emailBad)
        // if(!$scope.emailBad){
        $scope.emailBad = $scope.regForm.email && $scope.regForm.email.$viewValue.length && !$scope.regForm.email.$valid;
        // }
        // else if(!$scope.regForm.email.$viewValue || $scope.regForm.email.$viewValue.length){
        //     $scope.emailBad=false;
        // }
        // $scope.emailBad = $scope.email && $scope.email.length && !$scope.email.search(/([^][()<>@,;:\\". \x00-\x1F\x7F]+|"(\n|(\\\r)*([^"\\\r\n]|\\[^\r]))*(\\\r)*")(\.([^][()<>@,;:\\". \x00-\x1F\x7F]+|"(\n|(\\\r)*([^"\\\r\n]|\\[^\r]))*(\\\r)*"))*@([^][()<>@,;:\\". \x00-\x1F\x7F]+|\[(\n|(\\\r)*([^][\\\r\n]|\\[^\r]))*(\\\r)*])(\.([^][()<>@,;:\\". \x00-\x1F\x7F]+|\[(\n|(\\\r)*([^][\\\r\n]|\\[^\r]))*(\\\r)*]))*/g);
    };
    $scope.pwdNoDup = false;
    $scope.checkPwdDup = () => {
        $scope.pwdNoDup = !$scope.pwd || !$scope.pwdDup || $scope.pwdDup !== $scope.pwd;
    }
    $scope.pwdStrStars = [0,1,2,3,4,];
    $scope.badPwds = ['password','pass','1234','123','admin','abc','abcd','pwd'];
    $scope.pwdStr = {recs:[],score:0,maxScore:5,show:false}
    $scope.checkPwdStr = () => {
        
        if(!$scope.pwd){
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
        },{
            desc:'Using at least 12 characters',
            reg:'[\\w]{12}'
        },{
            desc:'Not using a bad password',
            negate:true,
            reg:['password','pass','1234','123','admin','abc','abcd','pwd'].map(q=>`(${q})`).join('|')
        }],
            badStuff = reqs.filter(re => { //stuff we're MISSINg
                const reg = new RegExp(re.reg);
                if(re.negate){
                    return !!reg.test($scope.pwd);
                }
                return !reg.test($scope.pwd);
            });
        $scope.pwdStr = {recs:badStuff,score:reqs.length-badStuff.length,maxScore:5,show:$scope.pwdStr.show}
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
                userFact.newUser({
                    user: $scope.user,
                    pass: $scope.pwd,
                    email: $scope.email
                })
                    .then((r) => {
                        userFact.login({ user: $scope.user, pass: $scope.pwd })
                            .then(() => {
                                $state.go('app.dash');
                            }).catch(e => {
                                if (e.data == 'duplicate') {
                                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                                }
                            });
                    }).catch(e => {
                        if (e.data == 'duplicate') {
                            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                        }
                    });
            });
        } else {
            $log.debug('running register with user', $scope.user, 'and pwd', $scope.pwd);
            userFact.newUser({
                user: $scope.user,
                pass: $scope.pwd,
                email: $scope.email
            })
                .then((r) => {
                    userFact.login({ user: $scope.user, pass: $scope.pwd })
                        .then(() => {
                            $state.go('app.dash');
                        });
                }).catch(e => {
                    if (e.data == 'duplicate') {
                        bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?");
                    }
                });
        }
    };
});
String.prototype.capMe = function () {
    return this.slice(0, 1).toUpperCase() + this.slice(1);
}; 
app.controller('main-cont', function ($scope, $http, $state, userFact, $log) {
    $scope.user = null;
    $scope.refUsr = ()=>{
        userFact.getUser().then(r => {
            $scope.user = r.data;            
            // $scope.$apply();
        }); 
    };
    socket.on('refreshById',u=>{
        userFact.getUser().then(r => {
            $scope.user = r.data;            
            // $scope.$apply();
        }); 
    });
}).filter('numToDate', function () {
    return function (num) {
        if (isNaN(num)) {
            return 'Invalid date!';
        }
        const theDate = new Date(num);
        // $log.debug(theDate.getMinutes())
        return `${theDate.toLocaleDateString()} ${theDate.getHours() % 12}:${theDate.getMinutes().toString().length < 2 ? '0' + theDate.getMinutes() : theDate.getMinutes()} ${theDate.getHours() < 13 ? 'AM' : 'PM'}`;
    };
});
app.controller('nav-cont',function($scope,$http,$state, $log, userFact){
    $scope.currState = 'dash';
	$scope.logout = function() {
        bulmabox.confirm('Logout','Are you sure you wish to logout?', function(resp) {
            if (!resp || resp == null) {
                return true;
            } else {
               userFact.logout().then(function(r) {
                    $log.debug('b4 logout usr removl, parent scope is',$scope.$parent.user);
                    $scope.$parent.user=null;
                    $log.debug('and now its',$scope.$parent.user);
                    $state.go('appSimp.login');
                });
            }
        });
    };
    $log.debug('USER ON NAVBAR',$scope.$parent && $scope.$parent.user);
    $scope.navEls = [{
        st:'dash',
        icon:'user-circle',
        text:'Home'
    },{
        st:'group',
        icon:'users',
        text:'Group'
    }];
    $scope.goState = s =>{
        $scope.currState = s;
        $state.go('app.'+s);
    };
    $scope.mobActive=false;
});
app.factory('socketFac', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () { 
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      });
    }
  };
});
app.run(['$rootScope', '$state', '$stateParams', '$transitions', '$q', 'userFact', '$log', function ($rootScope, $state, $stateParams, $transitions, $q, userFact, $log) {
    $transitions.onBefore({ to: 'app.**' }, function (trans) {
        let def = $q.defer();
        $log.debug('TRANS', trans);
        const usrCheck = trans.injector().get('userFact');
        usrCheck.getUser().then(function (r) {
            $log.debug('response from login chck', r);
            if (r.data) {
                def.resolve(true);
            } else {
                // User isn't authenticated. Redirect to a new Target State
                def.resolve($state.target('appSimp.login', undefined, { location: true }));
            }
        }).catch(e => {
            $log.debug('TRANSITION BLOCKED! Error was',e);
            def.resolve($state.target('appSimp.login', undefined, { location: true }));
        });
        return def.promise;
    });
    $transitions.onFinish({ to: 'app.**' }, function () {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
    });
}]);
app.factory('userFact', function ($http, $log) {
    return {
        getUser() {
            return $http.get('/user/usrData').then(function (s) {
                $log.debug('getUser in fac says:', s);
                return s;
            });
        },
        newUser(o) {
            return $http.post('/user/new', o).then(function (r) {
                return r;
            })
        },
        login(o) {
            return $http.put('/user/login', o).then(function (r) {
                return r;
            })
        },
        logout() {
            return $http.get('/user/logout').then(function (r) {
                return r;
            })
        },
        forgot(o) {
            return $http.put('/user/forgot', o).then(function (r) {
                return r;
            })
        },
        resetKey(k) {
            return $http.get('/user/resetUsr?key=' + o).then(function (r) {
                return r;
            })
        },
        resetPwd(k) {
            return $http.put('/user/resetPwd', o).then(function (r) {
                return r;
            })
        },
        nameCheck(n) {
            return $http.get('/user/nameOkay?name=' + n).then(function (r) {
                return r;
            })
        },
        getCharsFromAPI(k) {
            console.log('GETTING CHARS USING API KEY',k)
            return $http.put('/user/addByAPI?k='+k).then(function(s){
                return s;
            }).catch(function(e){
                return e;
            })
        },
        removeChar(c){
            return $http.delete('/user/char?c='+c._id).then(function(s){
                return s;
            })
        },
        chFracLvl(l){
            return $http.put('/user/fracManual?l='+l).then(function(r){
                return r;
            })
        }
    };
});
}());
