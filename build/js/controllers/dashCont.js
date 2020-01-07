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