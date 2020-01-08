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
        addChar(c){
            return $http.put('/user/char',c).then(function(s){
                console.log('RESPONSE FROM addchar',s)
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