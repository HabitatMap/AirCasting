angular.module("aircasting").directive('autocomplete', function (){
  return {
    link: function(scope, element, attrs, controller) {
      function split( val ) {
        return val.split( /,\s*/ );
      }
      function extractLast( term ) {
        return split( term ).pop();
      }
      // don't navigate away from the field on tab when selecting an item
      $(element).bind( "keydown", function( event ) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "autocomplete" ).menu.active ) {
          event.preventDefault();
        }
      }).autocomplete({
        source: function( request, response ) {
          var data = {q: extractLast( request.term ), limit: 10};
          if(attrs.autocompleteParams){
            _(data).extend(scope.$eval(attrs.autocompleteParams));
          }
          $.getJSON( attrs.autocomplete, data, response );
        },
        search: function() {
          // custom minLength
          var term = extractLast( this.value );
          if ( term.length < 1 ) {
            return false;
          }
        },
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
          var terms = split( this.value );
          // remove the current input
          terms.pop();
          // add the selected item
          terms.push( ui.item.value );
          // add placeholder to get the comma-and-space at the end
          terms.push( "" );
          this.value = terms.join( ", " );
          scope.$eval(attrs.ngModel + "=" + angular.toJson(this.value));
          scope.$digest();
          return false;
        }
      });
    }
  };
});




