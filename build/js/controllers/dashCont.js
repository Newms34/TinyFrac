app.controller('dash-cont', ($scope, $http, $q, userFact, $log) => {
    // $log.debug("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    
    $scope.refUsr();
    $scope.getCharsFromAPI = () => {
        console.log('trying to use key', $scope.apiKey)
        userFact.getCharsFromAPI($scope.apiKey).then(r => {
            console.log('getUsers Response', r)
            if (!r.status || r.status == 400) {
                throw new Error('badApi')
            }
            $scope.refUsr();
        }).catch(e => {
            console.log('getUsers Err', e)
            bulmabox.alert('API Error', 'There was an error with your API key. Make sure you have a valid key with correct permissions, then retry.')
        })
    }
    $scope.addChar = () => {
        if(!$scope.newChar.profRaw || !$scope.newChar.race || !$scope.newChar.name || !$scope.newChar.level){
            return bulmabox.alert('Missing Info', `You're missing some essential info! Make sure your character has a name, profession, race, and level!`)
        }
        $scope.newChar.prof = $scope.newChar.profRaw.prof;
        $scope.newChar.subProf = $scope.newChar.profRaw.subProf||null;
        bulmabox.confirm('Add Character',`Are you sure you wish to add the character ${$scope.newChar.name}, a/an ${$scope.newChar.race} ${$scope.newChar.subProf||$scope.newChar.prof}?`,function(r){
            if(!!r){
                console.log('user wishes to add char',$scope.newChar);
                userFact.addChar($scope.newChar).then(r=>{
                    if(r.status==400){
                        throw new Error('charCreateProblem')
                    }
                    $scope.clearNewChar();
                }).catch(e=>{
                    console.log('Err',e)
                    if(e.data && e.data=='duplicate'){
                        return bulmabox.alert('Duplicate Character',`Hey! You've already added that character!`)
                    }else if(e.data && e.data=='otherAcct'){
                        return bulmabox.alert('Name Taken',`That character name isn't valid; it looks like it already belongs to someone else!`)
                    }
                    bulmabox.alert('Error Creating Character','There was an error creating a new character! Sorry!')
                })
                // $scope.$digest();
            }
        })
    }
    $scope.chrSort = {
        col:'name',
        rev:false
    }
    $scope.sortEmBy = t =>{
        console.log(t,$scope.chrSort)
       if(t.toString()==$scope.chrSort.col.toString()){
           $scope.chrSort.rev = !$scope.chrSort.rev
       }else{
           $scope.chrSort.rev = false;
           $scope.chrSort.col= t;
       }
    }
    $scope.removeChar = c => {
        const descStr = `${c.race == 'Asura' ? 'an' : 'a'} ${c.race} ${c.subProf || c.prof}`
        bulmabox.confirm('<i class="fa fa-question-circle"></i>&nbsp;Remove Character', `Are you sure you wish to remove ${c.name} (${descStr})?`, r => {
            if (!!r) {
                userFact.removeChar(c).then(r => {
                    bulmabox.alert('Removed!', `You've removed ${c.name}!`);
                })
            }
        })
    }
    $scope.explAPI = () => {
        bulmabox.alert('API Keys', `<strong>Huh?:</strong> An API (Application Programming Interface &#129299) is a special way for different computer programs/sites to talk to each other. Guild Wars 2/ArenaNet provides these as a way for 3rd-party applications to communicate with the game engine. <br><br>
        <strong>So... What's it do?:</strong> Basically, the API key allows me (Healy Unit) to automatically get certain information about your characters (such as their level/profession/race) and automatically fill in the correct "spots" without you having to type it all in!<br><br>
        <strong>But is it safe?:</strong> Above all, the GW2 API is <i>read-only</i>. In other words, while I could potentially <i>see</i> that you have an Eternity, I can't <i>do</i> anything with that info. Almost all major GW2 fansites (gw2efficiency, for example) use API keys in some format.<br><br>
        <strong><i class="fa fa-hand-o-right wiggle" title="if you're sure!"></i>&nbsp;Okay, I'm convinced!:</strong> Great!
        <ol class="contents">
            <li>Head on over to <a href="https://account.arena.net/">https://account.arena.net/</a> and sign in (this is an official site, so don't worry).</li>
            <li>Click the Applications tab.</li>
            <li>Click the "New Key" button if you don't already have an API key listed.</li>
            <li>You'll need the <code>progression</code>, <code>account</code>, <code>builds</code>, and <code>characters</code> "permissions"</li>
            <li>Click "Create API Key</li>
            <li>Copy and paste that in the box here</li>
            <li>Click the "Use API Key" button</li>
        </ol><br>
        <strong>I still don't feel safe:</strong> Fair enough. Security is a pretty big concern these days. Feel free to click the "Manage Characters (Manual)" button above and enter your characters manually.`, { okay: { txt: 'Got it!' } })
    }
    //fracLvl manual adjust stuff
    $scope.fracTimer = null;
    $scope.chFracTimer = () => {
        if (!!$scope.fracTimer) {
            clearTimeout($scope.fracTimer);
        }
        $scope.fracTimer = setTimeout(function () {
            userFact.chFracLvl($scope.user.fracLvl).then(r => {
                //do nuffin
            })
        }, 500)
    }
    $scope.races = ['Asura','Charr','Human','Norn','Sylvari']
    $scope.rawProfs = [{
        prof: 'Warrior',
        subProf: 'Berserker',
        label: 'Warrior - Berserker'
    },
    {
        prof: 'Mesmer',
        subProf: 'Chronomancer',
        label: 'Mesmer - Chronomancer'
    },
    {
        prof: 'Thief',
        subProf: 'Daredevil',
        label: 'Thief - Daredevil'
    },
    {
        prof: 'Thief',
        subProf: 'Deadeye',
        label: 'Thief - Deadeye'
    },
    {
        prof: 'Guardian',
        subProf: 'Dragonhunter',
        label: 'Guardian - Dragonhunter'
    },
    {
        prof: 'Ranger',
        subProf: 'Druid',
        label: 'Ranger - Druid'
    },
    {
        prof: 'Elementalist',
        subProf: null,
        label: 'Elementalist'
    },
    {
        prof: 'Engineer',
        subProf: null,
        label: 'Engineer'
    },
    {
        prof: 'Guardian',
        subProf: 'Firebrand',
        label: 'Guardian - Firebrand'
    },
    {
        prof: 'Guardian',
        subProf: null,
        label: 'Guardian'
    },
    {
        prof: 'Revenant',
        subProf: 'Herald',
        label: 'Revenant - Herald'
    },
    {
        prof: 'Engineer',
        subProf: 'Holosmith',
        label: 'Engineer - Holosmith'
    },
    {
        prof: 'Mesmer',
        subProf: null,
        label: 'Mesmer'
    },
    {
        prof: 'Mesmer',
        subProf: 'Mirage',
        label: 'Mesmer - Mirage'
    },
    {
        prof: 'Necromancer',
        subProf: null,
        label: 'Necromancer'
    },
    {
        prof: 'Ranger',
        subProf: null,
        label: 'Ranger'
    },
    {
        prof: 'Necromancer',
        subProf: 'Reaper',
        label: 'Necromancer - Reaper'
    },
    {
        prof: 'Revenant',
        subProf: 'Renegade',
        label: 'Revenant - Renegade'
    },
    {
        prof: 'Revenant',
        subProf: null,
        label: 'Revenant'
    },
    {
        prof: 'Necromancer',
        subProf: 'Scourge',
        label: 'Necromancer - Scourge'
    },
    {
        prof: 'Engineer',
        subProf: 'Scrapper',
        label: 'Engineer - Scrapper'
    },
    {
        prof: 'Ranger',
        subProf: 'Soulbeast',
        label: 'Ranger - Soulbeast'
    },
    {
        prof: 'Warrior',
        subProf: 'Spellbreaker',
        label: 'Warrior - Spellbreaker'
    },
    {
        prof: 'Elementalist',
        subProf: 'Tempest',
        label: 'Elementalist - Tempest'
    },
    {
        prof: 'Thief',
        subProf: null,
        label: 'Thief'
    },
    {
        prof: 'Warrior',
        subProf: null,
        label: 'Warrior'
    },
    {
        prof: 'Elementalist',
        subProf: 'Weaver',
        label: 'Elementalist - Weaver'
    }].sort((a,b)=>{
        // console.log(a,b)
        if(a.prof!=b.prof){
            // console.log('profs are NOT the same!')
            return a.prof.localeCompare(b.prof)
        }else if(!a.subProf){
            return -1
        }else if(!b.subProf){
            return 1;
        }else{
            // console.log('profs ARE the same!')
            return a.subProf.localeCompare(b.subProf)
        }
    })
    // console.log('RAW PROFS', $scope.rawProfs)
    $scope.clearNewChar = ()=>{
        $scope.newChar = {};
        $scope.addingChar = false;
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