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