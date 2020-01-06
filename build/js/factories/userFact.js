app.factory('userFact', function ($http, $log) {
    return {
        getUser() {
            return $http.get('/user/usrData').then(function (s) {
                $log.debug('getUser in fac says:', s);
                return s;
            });
        },
        getCharsFromAPI(k) {
            return $http.put('/user/addByAPI?k='+k).then(function(s){
                return s;
            }).catch(function(e){
                return e;
            })
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
        }
    };
});