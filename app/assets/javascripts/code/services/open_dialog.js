angular.module("aircasting").factory('openDialog', ['$rootScope', '$document', '$compile',
                                     function($rootScope, $document, $compile) {

  return function(dialog) {
    var body = $document.find('body');
    var varName = '$dialog' + dialog.id;
    $rootScope[varName] = {
      src: dialog.props.url
    };

    var include = angular.element('<ng:include/>');
    include.attr('src', varName + '.src');

    var dialogDiv = dialog.dialogElement = angular.element('<div/>');
    dialogDiv.append(include);
    dialogDiv.attr('title', dialog.props.title);
    body.append(dialogDiv);

    dialogDiv.dialog(dialog.props.opts);

    dialogDiv.bind('dialogclose', function() {
      dialogDiv.remove();
      dialog.onClose();
      $rootScope.$digest();
    });

    $compile(include)($rootScope);
  };
}]);

