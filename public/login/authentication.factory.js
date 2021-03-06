(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .factory('authenticationFactory', authenticationFactory);
    
    authenticationFactory.$inject = ['encryptFactory', '$cookieStore', '$rootScope', 'dataFactory'];
    
    function authenticationFactory(encryptFactory, $cookieStore, $rootScope, dataFactory){
        return {
            login: login,
            logout: logout,
            setCredentials: setCredentials,
            clearCredentials: clearCredentials
        };
        
        function login(username, password, onSuccess, onError) {
            // Use this for real authentication
            encryptFactory.encodeWithBCrypt(password, encryptResult);
                                            
            function encryptResult(result){
                dataFactory.authenticate({ 
                    username: username, 
                    password: result 
                }).success(function(response){
                    setCredentials(response);
                    onSuccess(response);
                }).error(function(response){
                    onError(response);
                });
            };
        }
        
        function logout(uid, callback){
            dataFactory.deleteAuthorization(uid).then(function(){
                callback();
            });
        }
        
        function setCredentials(data) {
            $rootScope.globals = {
                currentUser: {
                    username: data.user.name,
                    uid: data.user.uid,
                    role: data.user.role,
                    createProblemCount: data.user.createProblemCount,
                    balance: data.user.balance,
                    authkey: data.user.authkey
                }
            };

            dataFactory.setHeaderAuthorization('');
            $cookieStore.put('globals', $rootScope.globals);   
        }
        
        function clearCredentials() {
            $rootScope.globals = {};
            $cookieStore.remove('globals');
            dataFactory.setHeaderAuthorization('');
        }
    }
    
    
})();