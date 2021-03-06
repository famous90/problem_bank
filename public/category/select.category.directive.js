(function() {
    'use strict';
    
    angular
        .module('problemBank')
        .directive('selectCategory', selectCategory);
    
    function selectCategory(){
        return {
            restrict: 'E',
            templateUrl: 'category/select.category.html',
            bindToController: {
                type: '=',
                selections: '=',
                alters: '=',
                maxSel: '='
            },
            controller: selectCategoryController,
            controllerAs: 'selCateVm'
        };
    }
    
    selectCategoryController.$inject = ['categoryFactory', '$modal', 'arrayFactory'];
    
    function selectCategoryController(categoryFactory, $modal, arrayFactory){
        var vm = this;
        vm.categories = [];

        categoryFactory.getCategories.then(function(data){
            vm.categories = data.masterCategory.categories;
        }, function(data){
            alert('카테고리를 불러오지 못했습니다. 다시 시도해 주세요.');
        });

        vm.addBroCategory = addBroCategory;
        vm.addChildCategory = addChildCategory;
        vm.deleteCategory = deleteCategory;
        vm.selectCategory = selectCategory;
        vm.isSelected = isSelected;
        vm.clickedAddChildCategory = clickedAddChildCategory;
        vm.clickedAddBroCategory = clickedAddBroCategory;
        vm.unfoldAllCategory = unfoldAllCategory;
        vm.foldAllCategory = foldAllCategory;
        
        function addBroCategory(item){
            var name = item.newBroCategoryName;

            categoryFactory.addCategory(name, item.path, function(response){
                item.newBroCategoryName = '';
                item.isCollapsed = !item.isCollapsed;
                alert('카테고리를 성공적으로 추가하였습니다.');
            }, function(error){
                alert('오류가 발생하였습니다. 다시 입력해 주세요.');
                throw error;
            });
        }
        
        function addChildCategory(item){
            var name = item.newChildCategoryName;
            var newPath = new Array();
            var pathSet = {
                cid: item.cid
            };
            angular.copy(item.path, newPath);
            newPath.push(pathSet);
            
            categoryFactory.addCategory(name, newPath, function(response){
                item.newChildCategoryName = '';
                item.isChildCollapsed = !item.isChildCollapsed;
                alert('카테고리를 성공적으로 추가하였습니다.');
            }, function(error){
                alert('오류가 발생하였습니다. 다시 입력해 주세요.');
                throw error;
            });
        }
        
        function deleteCategory(item){

            var checkModal = $modal.open({
                animation: true,
                templateUrl: 'category/modal.category.html',
                controller: 'CheckModalController',
                size: 'sm',
                resolve: {
                    item: function () {
                        return item;
                    }
                }
            });

            checkModal.result.then(function (selectedItem) {
                console.log('Check Modal Success');
            }, function () {
                console.log('Modal dismissed at: ' + new Date());
            });
        }
        
        function selectCategory(theCategory){
            var cid = theCategory.cid;
            if(!vm.selections){
                return;
            }
            var theIndex = vm.selections.indexOf(cid);

            if(isSelected(cid)>=0){
                removeCategoryFromSelections(theCategory);
            }else{
                if(!checkSelectionLimit()){
                    alert('더 이상 선택할 수 없습니다.');
                    return;
                }
                // not selected category
                addCategoryToSelections(theCategory);
            }
        }
        
        function addCategoryToSelections(theCategory){
            var cid = theCategory.cid;
            if(isSelected(cid)<0){
                vm.selections.push(cid);
                if(vm.alters){
                    arrayFactory.removeCidOf(vm.alters.delete, cid);
                    vm.alters.new.push(cid);
                }
            }
            
            if(checkSelectionLimit()){
                for(var i=0; i<theCategory.categories.length; i++){
                    addCategoryToSelections(theCategory.categories[i]);   
                }                
            }
        }
        
        function checkSelectionLimit(){
            if((typeof vm.maxSel == 'undefined') || (vm.maxSel == 0)){
                return true;
            }
            if(vm.selections.length >= vm.maxSel){
                return false;
            }else return true;
        }
        
        function removeCategoryFromSelections(theCategory){
            var cid = theCategory.cid;
            var theIndex = vm.selections.indexOf(cid);
            if(theIndex>=0){
                vm.selections.splice(theIndex, 1);
                if(vm.alters){
                    arrayFactory.removeCidOf(vm.alters.new, cid);
                    arrayFactory.removeCidOf(vm.alters.delete, cid);
                    vm.alters.delete.push(cid);    
                }                
            }
            for(var i=0; i<theCategory.categories.length; i++){
                removeCategoryFromSelections(theCategory.categories[i]);
            }
        }
        
        function isSelected(cid){
            if(!vm.selections){
                return;
            }
            return vm.selections.indexOf(cid);
        }
        
        function clickedAddChildCategory(item){
            if(!item.nodeCollapsed){
                item.nodeCollapsed = !item.nodeCollapsed;
            }
            if(item.isCollapsed){
                item.isCollapsed = !item.isCollapsed;
            }
            item.isChildCollapsed = !item.isChildCollapsed; 
        }
        
        function clickedAddBroCategory(item){
            item.isCollapsed = !item.isCollapsed;
            if(item.isChildCollapsed){
                item.isChildCollapsed = !item.isChildCollapsed; 
            }
        } 
        
        function unfoldAllCategory(){
            categoryFactory.setCategoryFoldingCondition('unfolding');
        }
        
        function foldAllCategory(){
            categoryFactory.setCategoryFoldingCondition('folding');
        }
    }
    
})();