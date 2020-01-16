angular.module("google", []);
angular.module("aircasting", ["google"]);

angular.module("aircasting").config([
  "$httpProvider",
  function($httpProvider) {
    $httpProvider.defaults.headers.common["X-Requested-With"] =
      "XMLHttpRequest";
    $httpProvider.interceptors.push("http_spinner_interceptor");
  }
]);
