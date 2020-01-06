app.controller('group-cont', ($scope, $http, $q, userFact, $log) => {
    // $log.debug("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    $scope.refUsr();
    $scope.refGrps = ()=>{
        $http.get('/groups/group').then(r=>{
            console.log(r.data)
            $scope.groups = r.data;
        })
    }
    $scope.newGrp = {};
    socket.on('refreshGrpById',u=>{
        $scope.refGrps();
    });
    $scope.submitNewGrp = ()=>{
        if(!$scope.newGrp.times || !$scope.newGrp.levels ||!$scope.newGrp.char ){
            return bulmabox.alert('Missing Info',`Hey! You need to at least tell us when your group's gonna meet and what levels you're gonna do.<br> In addition, you need to pick the character you wanna participate with.`);
        }else{
            $http.post('/groups/group',$scope.newGrp).then(r=>{
                console.log(r);
                $scope.makinGroup=false;
                $scope.$digest();
            })
        }
    }
    $scope.toggleGrpMember = d =>{
        const char  = $scope.isGrpMember[0];
        $http.put('/groups/member',{grpId:d}).then(r=>{
            console.log(r);
        })
    }
    $scope.isGrpMember = (grp)=>{
        const simpUserChars = $scope.user.chars.map(q=>q.name.toLowerCase());
        return grp.members.map(q=>q.name.toLowerCase()).filter(a=>simpUserChars.includes(a)).length;
    }
    $scope.refGrps();
});
