angular.module("aircasting").factory('dialog', ['openDialog',
                                     function(openDialog) {

  var Dialog = function() {
    this.openDialog = openDialog;
    //for now we support only on dialog, in future we need to implement id functionality
    this.id = "id";
    this.onCloseCallbacks = [];
    this.props = {opts: {}};
  };

  Dialog.prototype = {
    title: function(title) {
      this.props.title = title;
      return this;
    },

    name: function(name) {
      this.props.name = name;
      return this;
    },

    template: function(url) {
      this.props.url = url;
      return this;
    },

    opts: function(opts) {
      this.props.opts = opts;
      return this;
    },

    open: function() {
      openDialog(this);
      return this;
    },

    close: function() {
      this.dialogElement.dialog('close');
      this.onClose();
    },

    onClose: function(callback) {
      if(_(callback).isUndefined()) {
        _(this.onCloseCallbacks).each(function(callback) { callback(); });
      } else {
        this.onCloseCallbacks.push(callback);
      }
      return this;
    }
  };

  return function(){
    return new Dialog();
  };
}]);

