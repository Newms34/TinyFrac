app.controller('group-cont', ($scope, $http, $q, userFact, $log) => {
    // $log.debug("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    $scope.refUsr();
    $scope.refGrps = () => {
        $http.get('/groups/group').then(r => {
            console.log('REFD GRPS',r.data)
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
                // $scope.$digest();
                $scope.refGrps();
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
                // console.log(r);
                $scope.refGrps();
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
