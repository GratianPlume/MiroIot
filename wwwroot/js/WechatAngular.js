(function () {
    var app = angular.module("srAngular", ["ngRoute"]);
    app.run(function ($rootScope) {
        $rootScope.ejiajia = $.connection.SignalrService;
        $rootScope.ejiajia.client.showAlert = function (msg) {
            alert(msg);
        };
        $.connection.hub.start()
            .done(function () {
                ejiajia.server.test();
            })
            .fail(function () {
                alert("Connection failed!");
            });
    });
    var config = function ($routeProvider, $locationProvider) {
        $routeProvider
            .when("/list", { templateUrl: "/client/views/list.html" })
            .when("/events", { templateUrl: "/client/views/eventLog.html" })
            .otherwise({ redirectTo: "/" });
        //$locationProvider.html5Mode(true);
    };
    app.config(config);
}());