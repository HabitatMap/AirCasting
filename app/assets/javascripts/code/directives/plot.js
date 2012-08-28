angular.module("aircasting").directive('plot', function (){
  return {
    link: function(scope, element, attrs, controller) {
      var id = "#" + attrs.id;
      var options = {
        xaxis: {
          show: false,
          mode: "time"
        },
        yaxis: {
          show: false,
          panRange: false,
          zoomRange: false
        },
        grid: {
          show: false,
          hoverable: true,
          mouseActiveRadius: Infinity,
          autoHighlight: false
        },
        zoom:{
          interactive: true
        },
        pan: {
          interactive: true
        },
        crosshair: {
          mode: "x",
          color: "white"
        },
        colors: ["white"],
        series: {
          shadowSize: 0
        }
      };
      var plot = $.plot(id, [], options);

      //not sure how to best handle that
      if(scope.plotStorage){
        scope.plotStorage.set(plot);
      }

      $(id).unbind("plothover").unbind("plotzoom").unbind("plotpan");

      if(attrs.plotOnhover){
        $(id).bind("plothover", scope[attrs.plotOnhover]);
      }
      if(attrs.plotOnzoom){
        $(id).bind("plotzoom", scope[attrs.plotOnzoom]);
      }
      if(attrs.plotOnpan){
        $(id).bind("plotpan", scope[attrs.plotOnpan]);
      }
    }
  };
});




