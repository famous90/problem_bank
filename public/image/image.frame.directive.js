(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('imageFrame', imageFrame);
    
    function imageFrame(){
        return {
            restrict: 'EA',
            templateUrl: 'image/image.frame.html',
            scope: {
                imageFile: '=',
                width: '='
            }
        };
    }
    
})();