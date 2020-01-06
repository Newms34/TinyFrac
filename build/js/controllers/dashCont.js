app.controller('dash-cont', ($scope, $http, $q, userFact, $log) => {
    // $log.debug("Dashboard ctrl registered")
    $scope.refUsr = $scope.$parent.refUsr;
    $scope.refUsr();
    $scope.getCharsFromAPI = a =>{
        userFact.getCharsFromAPI(a).then(r=>{
            $scope.refUsr();
        }).catch(e=>{
            bulmabox.alert('API Error','There was an error with your API key. Make sure you have correct permissions, then retry.')
        })
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