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
    $scope.descMobGrp = g=>{
        //describes a group via popup for phone (since we can't display the whole table)
        const grpMems = g.members.map(m=>{
            return `<li><img class='smol-img' src="./img/races/${m.race}.png" alt="">
            ${m.name}</li>`
        }).join('')
        bulmabox.alert(`Group ${g.grpId}`,`<div class="is-fullwidth">
        <div class="notification">
            <span class="has-text-weight-bold">
                ID:
            </span>
            <hr>${g.grpId}
        </div>
        <div class="notification">
            <span class="has-text-weight-bold">
                Levels:
            </span>
            <hr>${g.levels}
        </div>
        <div class="notification">
            <span class="has-text-weight-bold">
                Times:
            </span>
            <hr>${g.times}
        </div>
        <div class="notification">
            <span class="has-text-weight-bold">
                Members:
            </span>
            <hr><ul>${grpMems}</ul>
        </div>
        <div class="notification">
            <span class="has-text-weight-bold">
                Notes:
            </span>
            <hr>${g.notes}</div>
    </div>`)
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
            $http.put('/groups/memberYes', { grpId: d,char:choice}).then(r => {
                // console.log(r);
                $scope.refGrps();
            })
        },`<button class='button is-info' onclick='bulmabox.runCb(bulmabox.params.cb,true)'>Got it!</button>`)
    }
    $scope.removeGrp = d => {
        bulmabox.confirm('<i class="fa fa-question-circle"></i>&nbsp;Leave Group','Are you sure you wish to leave this group?',function(r){
            if(!!r){
                const char = $scope.isGrpMember(d)[0];
                $log.debug('tryin to leave group',d,'with char',char)
                if(!char){
                    return bulmabox.alert('<i class="fa fa-exclamation-triangle"></i>&nbsp;Error Leaving Group',`There was an error leaving this group. Either: 
                    <ol>
                        <li>You're not a member of this group. You can't leave a group you're not in!</li>
                        <li>There was some other error and Healy is bad at coding.</li>
                        <li>The group is the Hotel California, and while you can check out any time you like, you can never leave.</li>
                    </ol>`)
                }
                // return false;
                if(d.members.length<2){
                    return bulmabox.confirm('<i class="fa fa-question-circle"></i>&nbsp;Abandoning Group',`Hey! You're the last remaining member of this group. Leaving it will automatically delete the group. Are you sure you wish to do this?`,function(lg){
                        if(!!lg){
                            // return console.log('WOULD HAVE LEFT GROUP HERE!')
                            $http.put('/groups/memberNo', { grpId: d.grpId, char:{name:char}}).then(r => {
                                console.log(r);
                            })
                        }
                    })
                }else{
                    // return console.log('WOULD HAVE LEFT GROUP HERE!')
                    $http.put('/groups/memberNo', { grpId: d.grpId, char:{name:char}}).then(r => {
                        console.log(r);
                    })
                }
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
