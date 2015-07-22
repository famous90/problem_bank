(function(){
    
    var app = angular.module('problemBank', ['ui.tree', 'ui.bootstrap', 'ngFileUpload', 'math']);
    
    app.factory('categoryFactory', ['$http', '$q', function($http, $q){
        
        var masterCategory = new Category(0, '', '', '');
        var rowCategory = [];
        var deferred = $q.defer();
                
        $http.get('/categories').then(function(response){
            rowCategory = response.data;
            masterCategory.makeCategory(response.data);
            deferred.resolve({
                rowData: rowCategory,
                masterCategory: masterCategory
            });
        });
        
        function getCategory(cid) {
            for(var i=0; i<rowCategory.length; i++){
                if(rowCategory[i].cid == cid){
                    return rowCategory[i];
                }
            }
            return null;
        }
        
        function getCategoryName(cid) {
            for(var i=0; i<rowCategory.length; i++){
                if(rowCategory[i].cid == cid){
                    return rowCategory[i].name;
                }
            }
            return '';
        }
        
        function getCidIndexOf(items, cid) {
            return items.indexOf(cid);
        }
        
        function removeCidOf(items, cid) {
            var theIndex = items.indexOf(cid);
            if(theIndex != -1){
                items.splice(theIndex, 1);
            }
        }
        
        function removeCidsOf(items, cids) {
            for(var i=0; i<cids.length; i++){
                var theIndex = items.indexOf(cids[i]);
                if(theIndex != -1){
                    items.splice(theIndex, 1);
                }
            }
        }
        
        function extractCidsOf(items, cids) {
            var newItems = new Array();
            for(var i=0; i<cids.length; i++){
                if(items.indexOf(cids[i]) != -1){
                    newItems.push(cids[i]);
                }
            }
            return newItems;
        }
        
        return {
            getCategories: deferred.promise,
            getCategory: getCategory,
            getCategoryName: getCategoryName,
            getCidIndexOf: getCidIndexOf,
            removeCidOf: removeCidOf,
            removeCidsOf: removeCidsOf,
            extractCidsOf: extractCidsOf
        };
    }]);
    
    function Category(cid, name, path, relPath) {
        this.cid = cid;
        this.name = name;
        this.path = path;
        this.relativePath = relPath;
        this.selectedCategorySet = [];
        this.categories = [];
    }
    
    Category.prototype.makeCategory = function(data){
        for(var k=0; k<data.length; k++){
            var item = data[k];
            var category = new Category(item.cid, item.name, item.path, item.relativePath);
            
            var absPath = item.path;
            var parentIdsArray = new Array();
            
            
            // separate parents ids
            var tempId = '';
            for(i=0 ;i<absPath.length; i++){
                if(absPath.charAt(i)=='/'){
                    parentIdsArray.push(tempId);
                    tempId = '';
                }else{
                    tempId = tempId.concat(absPath.charAt(i));
                }
            }
            
            var parentCategory = this;
            
            for(var j=0; j<=parentIdsArray.length; j++){
                
                var parentId = parentIdsArray[j];

                // last leaf
                if(j == parentIdsArray.length){
                    parentCategory.categories.push(category);
                }else{
                    // parentCategory change
                    for(var l=0; l<parentCategory.categories.length; l++){
                        if(parentCategory.categories[l].cid == parentId){
                            parentCategory = parentCategory.categories[l];
                        }
                    }        
                }   
            }            
        }
    };
    Category.prototype.getParentId = function(){
        
        if(this.path.length && this.path){

            var parentId = {};
            var pathStringLength = this.path.length;
            var lastSlashIndex = pathStringLength - 1;
            var beforeLastSlashIndex = lastSlashIndex - 1;
            
            var parentIdFirstIndex = 0;
            var parentIdLength = 0;
        
            for(i=0; i<lastSlashIndex; i++){
                if(beforeLastSlashIndex == 0){

                    parentIdLength = lastSlashIndex;
                    parentIdFirstIndex = 0;
                    break;

                }else if(this.path.charAt(beforeLastSlashIndex) == '/'){

                    parentIdFirstIndex = beforeLastSlashIndex + 1;
                    parentIdLength = lastSlashIndex - parentIdFirstIndex;
                    break;

                }else {
                    beforeLastSlashIndex--;
                }
            }
            
            parentId = this.path.substr(parentIdFirstIndex, parentIdLength);
            
            return parentId;
            
        }else return 0;
    };
    
    function Problem (){
        
        this.pid = '', this.question = '', this.answer = '', this.explanation = '', this.answerType = 'single', this.answerPlaceholder = '정답을 입력해 주세요', this.examples = [];
        this.selections = new Array();
        this.alterSelections = {
            new: [],
            delete: [],
            exist: []
        };
        
        if(arguments.length){
            var data = arguments[0];
            this.pid = data.pid;
            this.question = data.question;
            this.answer = data.answer;
            this.explanation = data.explanation;
            this.answerType = data.answerType;
            this.setExamples(data.examples);
            if(data.selections){
                this.selections = data.selections;
                for(var i=0; i<data.selections.length; i++){
                    this.alterSelections.exist.push(data.selections[i].cid);
                }
            }
        }else {
            this.setExamples('');
        }
    }
    
    Problem.prototype.setExamples = function (jsonExamples) {
        if(this.answerType == 'multiple'){
            this.answerPlaceholder = '정답인 보기를 입력해 주세요';
            this.examples = angular.fromJson(jsonExamples);
        }else{
            this.examples = [{content:''}, {content:''}, {content:''}, {content:''}];
        }
    };
    
    Problem.prototype.changeAnswerType = function(){
        if(this.answerType == 'single'){
            this.answerType == 'multiple';
            this.answerPlaceholder = '정답인 보기를 입력해 주세요';        
        }else {
            this.answerType == 'single';
            this.answerPlaceholder = '정답을 입력해 주세요';        
        }  
    };
    
    Problem.prototype.getExamplesToJson = function() {
        if(this.answerType == 'single'){
            return '';
        }else {
            return angular.toJson(this.examples);
        }
    };
    
    Problem.prototype.getValuesToJson = function(){
        var jsonArray = {
            question: this.question,
            answer: this.answer,
            explanation: this.explanation,
            categories : this.selections,
            examples : this.getExamplesToJson(),
            answerType : this.answerType,
            alterCategories: this.alterSelections
        };
        
        return angular.toJson(jsonArray);
    };
    
    Problem.prototype.getSelectionCidOf = function(cid){
        if(this.selections.length){
            for(i=0; i<this.selections.length; i++){
                if(this.selections[i].cid == cid){
                    return i;
                }
            }
        } 
        return -1;
    };
    
    Problem.prototype.selectedCidOf = function (item){
        var theIndex = this.getSelectionCidOf(item.cid);
        if(theIndex != -1){
            this.selections.push(item);
            this.insertSelection(item);
        }else{
            this.selections.splice(theIndex, 1);
            this.removeSelection(item);
        }
    }
    
    Problem.prototype.insertSelection = function (item){
        if(this.alterSelections.delete.length){
            for(var i=0; i<this.alterSelections.delete.length; i++){
                if(this.alterSelections.delete[i].cid == item.cid){
                    this.alterSelections.delete.splice(i, 1);
                }
            }   
        }
        this.alterSelections.new.push(item);
    }
    
    Problem.prototype.removeSelection = function (item){
        if(this.alterSelections.new.length){
            for(var i=0; i<this.alterSelections.new.length; i++){
                if(this.alterSelections.new[i].cid == item.cid){
                    this.alterSelections.new.splice(i, 1);
                }
            }   
        }
        this.alterSelections.delete.push(item);
    }
    
    
        
    function ProblemMaster () {
        this.masterData = new Array();
    }
    
    ProblemMaster.prototype.getLastObject = function(){
        return this.masterData[this.masterData.length - 1];
    };
    
    ProblemMaster.prototype.getObjectPidOf = function(pid){
        if(this.masterData.length == 0){
            return null;
        }else{
            for(var i=0; i<this.masterData.length; i++){
                if(this.masterData[i].pid == item.pid){
                    return this.masterData[i];
                }
            }
            return null;
        }
    }
    
    ProblemMaster.prototype.push = function (item){
        this.masterData.push(item);
    };
    
    ProblemMaster.prototype.changeProblem = function (item) {
        if(this.masterData.length == 0){
            return;
        }
        
        for(var i=0; i<this.masterData.length; i++){
            if(this.masterData[i].pid == item.pid){
                this.masterData[i] = item;
            }
        }  
    };
    
    ProblemMaster.prototype.getLength = function (){
        return this.masterData.length;  
    };
    
    ProblemMaster.prototype.getMasterData = function (){
        return this.masterData;  
    };
        
    app.controller('BankController', ['$scope', '$http', function($scope, $http){
        var bank = this;
    }]);
    
    app.directive('insertProblem', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/insert-problem.html',
            controller: ['$scope', '$http', 'Upload', '$window', function($scope, $http, Upload, $window){
                
                if($scope.problem){
                }else {
                    $scope.problem = new Problem();
                }
                                
                $scope.answerTypeButtonTapped = function(type){
                    if(type != $scope.problem.answerType){
                        $scope.problem.changeAnswerType();
                    }
                };
                
                $scope.submitForm = function(questionImages, explanationImages){
                    
                    if(!$scope.problem.selections.length){
                        alert('카테고리를 선택해주세요');    
                        return;
                    }
                    
                    var formDataNames = [];
                    var imageFiles = [];
                    if(questionImages){
                        for(var i=0; i<questionImages.length; i++){
                            formDataNames.push('questionAttached');    
                            imageFiles.push(questionImages[i]);
                        }                        
                    }
                    if(explanationImages){
                        for(var i=0; i<explanationImages.length; i++){
                            formDataNames.push('explanationAttached');
                            imageFiles.push(explanationImages[i]);
                        }                        
                    }
                    
                    $scope.upload = Upload.upload({
                        url: '/problem',
                        method: 'POST',
                        headers: {
                            'Content-Type': undefined
                        },
                        fields: {
                            data: $scope.problem.getValuesToJson()
                        },
                        file: imageFiles,
                        fileFormDataName: formDataNames
                    }).success(function(response){
                        
                        if(imageFiles.length){
                            $window.alert(imageFiles.length + '개 이미지와 문제 업로드 성공');
                        }else $window.alert('이미지 없는 문제 업로드 성공');
                        
                        $scope.problem = new Problem();
                    });   
                };
                
            }],
            controllerAs: 'problemCtrl'
        };
    });

    app.directive('editCategory', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/edit-category.html',
            controller: ['$scope', '$http', function($scope, $http){
                                
                this.submitCategory = function(){
                    
                    var cname = this.cateObject.name;
                    var cpath = this.cateObject.path;
                
                    $http.post('/category', {'path':cpath, 'name':cname}).then(function(){
                        alert('request complete');
                        this.cateObject = {};
                    });
                };            
            }],
            controllerAs: 'cateCtrl'
        };
    });
        
    app.directive('loadProblems', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/load-problems.html',
            controller: ['$scope', '$http', '$modal', '$log', 'categoryFactory', function($scope, $http, $modal, $log, categoryFactory){                
                
                $scope.category = {};
                $scope.category.selections = new Array();
                    
                $scope.loadProblems = function(){
                    
                    $http.post('/load_problems', {'categories': angular.toJson($scope.category.selections)})
                    .then(function(response){

                        var data = response.data;        
                        
                        $scope.masterProblem = new ProblemMaster();

                        for(var i=0; i<data.length; i++){
                            
                            var theData = data[i];
                            
                            if(i != 0){
                                var lastProblem = $scope.masterProblem.getLastObject();
                                if(lastProblem.pid != theData.pid){
                                    var theProblem = new Problem(theData);
                                    theProblem.selections.push(categoryFactory.getCategory(theData.cid));
                                    $scope.masterProblem.push(theProblem);   
                                }else{
                                    lastProblem.selections.push(categoryFactory.getCategory(theData.cid));
                                }
                            }else{
                                var theProblem = new Problem(theData);
                                theProblem.selections.push(categoryFactory.getCategory(theData.cid));
                                $scope.masterProblem.push(theProblem);   
                            }
                        }

                    });
                };
                
                $scope.deleteProblem = function(item){
                    
                    $http.delete('/problem/'+item.pid)
                    .success(function(response){
                        alert('문제를 성공적으로 제거했습니다.');
                    }).error(function(response){
                        alert('문제 삭제에 실패했습니다. 다시 시도해 주세요.');
                    });
                };
                
                $scope.updateProblem = function (item) {
                    
                    var newProblem = new Problem(item);
                    
                    var modalInstance = $modal.open({
                        animation: true,
                        templateUrl: 'view/edit-problem-modal.html',
                        controller: 'ModalInstanceCtrl',
                        size: 'lg',
                        resolve: {
                            item: function () {
                                return newProblem;
                            }
                        }
                    });

                    modalInstance.result.then(function (selectedItem) {
                        $scope.masterProblem.changeProblem(selectedItem);
                    }, function () {
                        $log.info('Modal dismissed at: ' + new Date());
                    });
                };

            }],
            controllerAs: 'masterProblemsCtrl'
        };
    });
    
    app.controller('ModalInstanceCtrl', ['$scope', '$http', '$modalInstance', 'item', 'categoryFactory', function ($scope, $http, $modalInstance, item, categoryFactory) {
        $scope.problem = item;
        $scope.update = function (item) {
            
            categoryFactory.removeCidsOf(item.alterSelections.new, item.alterSelections.exist);
            item.alterSelections.delete = categoryFactory.extractCidsOf(item.alterSelections.delete, item.alterSelections.exist);
            
            $http.put('/problem/'+item.pid, {data: item.getValuesToJson()})
            .success(function(response){
                $modalInstance.close(item); 
                alert('문제를 성공적으로 수정하였습니다.');
            }).error(function(response){
                alert('문제를 수정하지 못했습니다. 다시 시도해주세요.' + response.error);
            });
        };

        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    }]);
    
    app.directive('showProblem', function(){
        return {
            restrict: 'EA',
            templateUrl: 'view/show-problem.html',
            scope: {
                problem: '=item',
            }
        };
    });
    
    app.directive('selectCategory', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/select-category.html',
            scope: {
                type: '=',
                selections: '=',
                alters: '='
            },
            controller: ['$scope', '$http', 'categoryFactory', function($scope, $http, categoryFactory){
                
                categoryFactory.getCategories.then(function(data){
                    console.log(data);
                    $scope.categories = data.masterCategory.categories;
                }, function(data){
                    alert('카테고리를 불러오지 못했습니다. 다시 시도해 주세요.');
                });
                
                this.addCategory = function(name, item){
                    var theCategory = new Category(item.cid, item.name, item.path, item.relativePath);
                    var parentId = theCategory.getParentId();
                    var parentRelativePath = '';
                    if(parentId != 0){
                        parentRelativePath = rowData[parentId -1].relativePath;   
                    }
                      
                    httpPostCategory(parentId, name, theCategory.path, parentRelativePath);
                };
                
                this.addChildCategory = function(name, item){
                    
                    var newPath = item.path + item.cid.toString() + '/';
                    httpPostCategory(item.cid, name, newPath, item.relativePath);
                };
                
                this.deleteCategory = function(item){
                    $http.delete('/category/'+item.cid)
                    .success(function(response){
                        alert('카테고리를 삭제했습니다.');
                    }).error(function(response){
                        alert('카테고리를 삭제하지 못했습니다. 다시 시도해 주세요.');
                    });
                };
                
                this.selectCategory = function(item){
                    
                    var theIndex = getIndexOfSelectedCategory(item.cid);
                     
                    if(theIndex != -1){
                        // already has category
                        $scope.selections.splice(theIndex, 1);
                        categoryFactory.removeCidOf($scope.alters.new, item.cid);
                        categoryFactory.removeCidOf($scope.alters.delete, item.cid);
                        $scope.alters.delete.push(item.cid);
                        
                    }else{
                        // not have category
                        $scope.selections.push(item);
                        categoryFactory.removeCidOf($scope.alters.delete, item.cid);
                        $scope.alters.new.push(item.cid);
                    }
                };
                
                this.isSelected = function(item){
                    
                    var cid = item.cid;
                    
                    for(i=0; i<$scope.selections.length; i++){
                        if($scope.selections[i].cid == cid){
                            return true;   
                        }
                    }
                    return false;
                }
                
                function getIndexOfSelectedCategory (cid){
                    if($scope.selections.length == 0 || !$scope.selections){
                        return -1;
                    }
                    for(i=0; i<$scope.selections.length; i++){
                        if($scope.selections[i].cid == cid){
                            return i;   
                        }
                    }
                    return -1;   
                };
                
                function httpPostCategory (parentId, name, absPath, relPath){
                    $http.post('/category', {'parentId':parentId, 'name':name, 'path':absPath, 'parentRelativePath': relPath})
                    .success(function(response){
                        alert('insert category SUCCESS');
                    }).error(function(response){
                        alert('insert category error');
                    });
                };

            }],
            controllerAs: 'selectCategoryCtrl'
        };
    });
    
    app.directive('nodesRenderer', function(){
        return {
            restrict: 'E',
            templateUrl: 'view/nodes-renderer.html'
        };
    });
    
})();