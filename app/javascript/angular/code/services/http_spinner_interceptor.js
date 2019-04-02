const httpSpinnerInterceptor = ($q, $rootScope, $log) => {
  let counter = 0;

  const update = by => {
    counter += by;
    window.__elmApp.ports.updateIsHttping.send(counter !== 0)
    //$rootScope.$isHttpInProgress = (counter > 0);
  };

  return {
    request: config => {
      update(+1);
      return config;
    },
    requestError: rejection => {
      update(-1);
      $log.error('Request error:', rejection);
      return $q.reject(rejection);
    },
    response: response => {
      update(-1);
      return response;
    },
    responseError: rejection => {
      update(-1);
      $log.error('Response error:', rejection);
      return $q.reject(rejection);
    }
  };
};

angular.module('aircasting').service('http_spinner_interceptor', ['$q', '$rootScope', '$log', httpSpinnerInterceptor ]);
