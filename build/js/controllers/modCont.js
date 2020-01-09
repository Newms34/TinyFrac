app.controller('mod-cont', ($scope, $state, $http, $q, userFact, $log) => {
    // $log.debug("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    $scope.refUsr();
    socket.on('refreshGrpById', u => {
        $scope.refGrps();
    });
    $scope.refAllUsrs = ()=>{
        const thisUser = ($scope.user && $scope.user.user)||($scope.$parent.user && $scope.$parent.user.user);
        $http.get('/user/users').then(r=>{
            console.log('thisUser',thisUser,r.data.map(q=>q.user))
            $scope.users = r.data.filter(q=>q && q.user!=thisUser && !q.superMod);
        })
    }
    $scope.refAllUsrs();
    // setInterval(function(){
    //     // console.log($scope.user||'NO USER!')
    //     if(!($scope.user && $scope.user.superMod)&&!($scope.$parent.user && !$scope.$parent.user.superMod)){
    //         $state.go('app.dash')
    //         // console.log('NOT MOD')
    //     }
    // },30);
    $scope.toggleBan = u =>{
        const title = u.isBanned?`Unban User`:`Ban User`,
        msg = u.isBanned?`Are you sure you wish to unban the user ${u.user}? This will restore their access to TinyFracs.`:`Are you sure you wish to ban the user ${u.user}? This will revoke their access to TinyFracs!`;
        bulmabox.confirm(title,msg,function(r){
            if(!!r){
                $http.put('/user/toggleBan',{user:u.user}).then(r=>{
                    $scope.refAllUsrs();
                })
            }
        })

    }
    $scope.confirmUser = u =>{
        bulmabox.confirm('Confirm User',`Are you sure you wish to confirm the user ${u.user}? This action will give them normal (non-mod) access rights to TinyFrac, and is generally <i>not</i> reversable!`,function(r){
            if(!!r){
                $http.put('/user/confirm',{user:u.user}).then(r=>{
                    $scope.refAllUsrs();
                })
            }
        })
    }
});
