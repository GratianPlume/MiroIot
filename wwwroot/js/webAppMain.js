/**
 * Created by 木北 on 2017/4/12.
 */
var srAngularApp = angular.module("srAngular", ["ngRoute"])
    //.constant("client", $.connection.SignalrService.client)
    //.constant("$srServer", $.connection.SignalrService.server)
    .config(function ($routeProvider) {
        $routeProvider.when("/entranceGuardSystem", {
            templateUrl: "views/entranceGuardSystem.html?" + new Date(),
            resolve: {
                auth: function ($q, $rootScope) {
                    var auth = $rootScope.isAuthorize;
                    if (auth) {
                        return $q.when(auth);
                    } else {
                        return $q.reject({
                            authenticated: false
                        });
                    }
                }
            }
        }).when("/querySystem", {
            templateUrl: "views/querySystem.html?" + new Date(),
            resolve: {
                auth: function ($q, $rootScope) {
                    var auth = $rootScope.isAuthorize;
                    if (auth) {
                        return $q.when(auth);
                    } else {
                        return $q.reject({
                            authenticated: false
                        });
                    }
                }
            }
        }).when("/advertisingSystem", {
            templateUrl: "views/advertisingSystem.html?" + new Date(),
            resolve: {
                auth: function ($q, $rootScope) {
                    var auth = $rootScope.isAuthorize;
                    if (auth) {
                        return $q.when(auth);
                    } else {
                        return $q.reject({
                            authenticated: false
                        });
                    }
                }
            }
        }).otherwise({
            templateUrl: "views/Login.html?" + new Date()
        });
    })
    .run(function ($rootScope, $location,titleStr,advtsMode) {
        $rootScope.isAuthorize = false;
        $rootScope.$on("$routeChangeStart", function () {
            if (!$rootScope.isAuthorize) {
                $location.path("/");
            }
        });
        //当前操作小区
        $rootScope.currentCommunity = false;
        //关闭广告功能 默认打开
        $rootScope.openAdsystem = advtsMode;
        $rootScope.g = {};
        if ("WebSocket" in window) {
            var url = "ws://" + location.host + "/ws/web";
            var ws = new WebSocket(url);
            var timeout = 40000;
            var keepAlive = function() {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({
                        command: "keepAlive"
                    }));
                    setTimeout(keepAlive, timeout);
                }
            }
            ws.onopen = function () {
                document.title = titleStr + " - 连接服务器成功";
                ws.send(JSON.stringify({
                    command: "getRsaKey"
                }));
                setTimeout(keepAlive, timeout);
            };
            ws.onclose = function () {
                document.title = titleStr + " - 与服务器断开连接";
                alert("连接已断开，请重新登录！");
                location.reload();
            };
            ws.onerror = function () {
                alert(titleStr + "通信发生错误");
            };
            ws.onmessage = function (msg) {
                var json = JSON.parse(msg.data);
                if (json.command === "echoRsaKey") {
                    var rsaKey = json.data;
                    setMaxDigits(131);
                    $rootScope.g.wsHash = json.wsHash;
                    $rootScope.g.rsaKey = new RsaKeyPair(rsaKey.RsaE, "", rsaKey.RsaM);
                    //                        console.log(g.rsaKey);
                } else {
                    switch (json.command) {
                        case "clearEvents":
                            $rootScope.$apply(function () {
                                $rootScope.events = [];
                                $rootScope.recordBarData = true;
                                $rootScope.listQuery = true;
                            });
                            break;
                        case "eventItem":
                            $rootScope.events.push(json);
                            break;
                        case "eventsComplete":
                            $rootScope.$apply(function () {
                                $rootScope.recordBarData = false;
                            });
                            break;
                        case "clearLogs":
                            $rootScope.$apply(function () {
                                $rootScope.Status = [];
                                $rootScope.logsbarData = true;
                                $rootScope.listStatus = true;
                            });
                            break;
                        case "logItem":
                            $rootScope.Status.push(json);
                            break;
                        case "logsComplete":
                            $rootScope.$apply(function () {
                                $rootScope.logsbarData = false;
                            });
                    }
                }
            };
        } else {
            document.getElementById("message_output").innerHTML = "浏览器不支持WebSocket";
        }
    })
    .filter("roomName", function () {
        return function (input, addressList) {
            for (var i = 0; i < addressList.buildings.length; i++) {
                for (var j = 0; j < addressList.buildings[i].units.length; j++) {
                    for (var z = 0; z < addressList.buildings[i].units[j].apartments.length; z++) {
                        if (addressList.buildings[i].units[j].apartments[z].guid == input) {
                            return addressList.buildings[i].name + addressList.buildings[i].units[j].name + addressList.buildings[i].units[j].apartments[z].id;
                        }
                    }
                }
            }
        };
    })
    .filter("roomsTobuildingObj", function () {
        return function (input, addressList) {
            for (var i = 0; i < addressList.buildings.length; i++) {
                for (var j = 0; j < addressList.buildings[i].units.length; j++) {
                    for (var z = 0; z < addressList.buildings[i].units[j].apartments.length; z++) {
                        if (addressList.buildings[i].units[j].apartments[z].guid == input) {
                            var result = {
                                building:addressList.buildings[i],
                                unit:addressList.buildings[i].units[j],
                                room:addressList.buildings[i].units[j].apartments[z]
                            };
                            return result;
                        }
                    }
                }
            }
        };
    })
    .filter("roomToAddressid", function () {
        return function (input, addressList) {
            for (var i = 0; i < addressList.buildings.length; i++) {
                for (var j = 0; j < addressList.buildings[i].units.length; j++) {
                    for (var z = 0; z < addressList.buildings[i].units[j].apartments.length; z++) {
                        if (addressList.buildings[i].units[j].apartments[z].guid == input) {
                            return addressList.buildings[i].id + addressList.buildings[i].units[j].id + addressList.buildings[i].units[j].apartments[z].id;
                        }
                    }
                }
            }
        };
    })
    .filter("nricFilter", function () {
        return function (nric) {
            return nric.length > 18 ? "" : nric;
        };
    })
    .filter("deviceAddress", function () {
        return function (doorNumber) {
            if (!doorNumber) {
                return doorNumber;
            }
            var doorStr = doorNumber.toString();
            switch (doorStr.length) {
                case 1:
                    return "000000" + doorStr;
                case 2:
                    return "00000" + doorStr;
                case 3:
                    return "0000" + doorStr;
                case 4:
                    return "000" + doorStr;
                case 5:
                    return "00" + doorStr;
                case 6:
                    return "0" + doorStr;
                default:
                    return doorStr;
            }
        }
    })
    .filter("nricToname", function () {
        return function (id, people) {
            if (!id) {
                return "";
            }
            for (var i = 0; i < people.length; i++) {
                if (people[i].nric == id) {
                    return people[i].name;
                }
            }
            return "";
        };
    })
    .filter("nricTorooms", function () {
        return function (id, people) {
            if (!id) {
                return [];
            }
            for (var i = 0; i < people.length; i++) {
                if (people[i].nric == id) {
                    return people[i].rooms;
                }
            }
            return [];
        };
    })
    .filter("roomsToaddress", function () {
        return function (rooms, addressList) {
            if (rooms.length == 0) {
                return "";
            }
            var addressName = "";
            rooms.forEach(function (item) {
                for (var i = 0; i < addressList.buildings.length; i++) {
                    for (var j = 0; j < addressList.buildings[i].units.length; j++) {
                        for (var z = 0; z < addressList.buildings[i].units[j].apartments.length; z++) {
                            if (addressList.buildings[i].units[j].apartments[z].guid == item) {
                                if (addressName.length == 0) {
                                    addressName = addressList.buildings[i].name + addressList.buildings[i].units[j].name + addressList.buildings[i].units[j].apartments[z].id;
                                    break;
                                } else {
                                    addressName = addressName + addressList.buildings[i].name + addressList.buildings[i].units[j].name + addressList.buildings[i].units[j].apartments[z].id;
                                    break;
                                }
                            }
                        }
                    }
                }
            });
            return addressName;
        };
    })
    .filter("deviceToAddress", function () {
        return function (device, deviceList) {
            for (var i = 0; i < deviceList.length; i++) {
                if (deviceList[i].id == device) {
                    return deviceList[i].address;
                }
            }
        }
    })
    .filter("cardidTonumber", function () {
        return function (id, number) {
            for (var i = 0; i < number.length; i++) {
                if (number[i].id === id) {
                    return number[i].serial;
                }
            }
        }
    })
    .filter("bindingroomToaddress", function () {
        return function (room, list) {
            var result = "";
            if (!room) {
                return result;
            }
            list.buildings.forEach(function (t) {
                if (t.id === room.slice(0, 4)) {
                    t.units.forEach(function(t2) {
                        if (t2.id === room.slice(4, 6)) {
                            result = t.name + t2.name + room.slice(6);
                        }
                    });
                }
            });
            return result;
        }
    })
    .filter("fingerFilter", function () {
        return function (finger) {
            var fingerObj = [{
                    id: 1,
                    name: "左手拇指"
                },
                {
                    id: 2,
                    name: "左手食指"
                },
                {
                    id: 3,
                    name: "左手中指"
                },
                {
                    id: 4,
                    name: "左手无名指"
                },
                {
                    id: 5,
                    name: "左手小指"
                },
                {
                    id: 6,
                    name: "右手拇指"
                },
                {
                    id: 7,
                    name: "右手食指"
                },
                {
                    id: 8,
                    name: "右手中指"
                },
                {
                    id: 9,
                    name: "右手无名指"
                },
                {
                    id: 10,
                    name: "右手小指"
                }
            ];
            if (!finger) {
                return "";
            }
            return fingerObj[finger - 1].name;
        }
    })
    .filter("Filter_level",function () {
        return function (level) {
            return level & 63 ;
        }
    })
    .filter("fingerprintToName", function ($filter) {
        return function (id, fingerprintList, personelList, finger) {
            for (var i = 0; i < fingerprintList.length; i++) {
                if (fingerprintList[i].id === id) {
                    var fingerName = finger.filter(function (t) {
                        return t.id === fingerprintList[i].finger;
                    });
                    return $filter("nricToname")(fingerprintList[i].nric, personelList) + "的" + fingerName[0].name;
                }
            }
        }
    })
    .filter("unAuthDevice_filter", function () {
        return function (deviceList, str) {
            var resultArr = [];
            if (isNaN(Number(str)) || !Number(str)) {
                return deviceList;
            }
            if (Number(str)) {
                resultArr = deviceList.filter(function (item) {
                    return item.address.toString().slice(0, [Number(str).toString().length]) === Number(str).toString();
                });
                return resultArr;
            }
        }
    })
    .filter("doorFilter", function () {
        return function (doorNumber) {
            var doorStr = doorNumber.toString();
            switch (doorStr.length) {
                case 1:
                    return "000000" + doorStr;
                case 2:
                    return "00000" + doorStr;
                case 3:
                    return "0000" + doorStr;
                case 4:
                    return "000" + doorStr;
                case 5:
                    return "00" + doorStr;
                case 6:
                    return "0" + doorStr;
                case 7:
                    return doorStr;
            }
        }
    })
    .filter("dateFilter", function () {
        return function (data) {
            var date = new Date(data * 1000);
            var year = date.getFullYear() + '/';
            var month = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '/';
            var day = date.getDate() + ' ' + ' ';
            var hour = (date.getHours() < 10 ? '0' + (date.getHours()) : date.getHours()) + ':';
            var minite = (date.getMinutes() < 10 ? '0' + (date.getMinutes()) : date.getMinutes()) + ':';
            var second = (date.getSeconds() < 10 ? '0' + (date.getSeconds()) : date.getSeconds());
            var result = year + month + day + hour + minite + second;
            return result;
        }
    })
    .factory("getTime", function () {
        return {
            getTimestamp: function (timeStr) {
                var newTimeStr = timeStr.replace(/:/g, "-").replace(/[/]/g, "-").replace(/ /g, "-").split("-");
                var result = new Date(Date.UTC(newTimeStr[0], newTimeStr[1] - 1, newTimeStr[2], newTimeStr[3] - 8, newTimeStr[4], newTimeStr[5]));
                return result.getTime() / 1000;
            }
        }
    })
    .controller("mainCtrl", function ($scope, $timeout, $rootScope, $location, $filter, getTime) {
        /*动态样式*/
        //主导航
        var urlChoose;
        $scope.chooseUrl = function (num) {
            if (num === 1){
                $rootScope.currentCommunity = true;
            }else {
                $rootScope.currentCommunity = false;
            }
            urlChoose = num;
        };
        $scope.Urlstyle = function (num) {
            return num === urlChoose ? "active" : "";
        };
        //侧边管理导航
        var sideUrlChoose;
        $scope.entrancesidebarStyle = function (num) {
            return num === sideUrlChoose ? "active" : "";
        };
        //侧边查询导航
        var sideUrlChooseQuery;
        $scope.querysidebarStyle = function (num) {
            return num === sideUrlChooseQuery ? "active" : "";
        };
        //侧边广告导航
        var sideUrlChooseAdvertising;
        $scope.advertisingsidebarStyle = function (num) {
            return num === sideUrlChooseAdvertising ? "active" : "";
        };
        //帐号管理路径导航
        $scope.accountUrl = function (num) {
            return $scope.viewSwitch.mode === num ? "active" : "";
        };
        /*动态样式*/
        $scope.hideGuardSystem = false;
        $scope.hideAdSystem = false && $rootScope.openAdsystem;
        $scope.hideAdFileManage = true;
        $scope.hideAdLaunch = true;
        $scope.userGradeList = [
            {id:1,name:"一级管理员"},
            {id:2,name:"二级管理员"},
            {id:3,name:"三级管理员"}
        ];
        //小区操作
        $scope.showOperateCom = true;
        //注册登录
        $scope.GradeValue = "";
        $scope.chooseAdPowerView= function (newVal) {
            if ($scope.adminData.level === 0){
                if (Number(newVal) === 1){
                    $scope.chooseAdPower_2 = false;
                    $scope.chooseAdPower_1 = true && $rootScope.openAdsystem;
                    return;
                }
                if (Number(newVal) === 2){
                    $scope.chooseAdPower_2 = true && $rootScope.openAdsystem;
                    $scope.chooseAdPower_1 = false;
                    return;
                }
                if (Number(newVal) === 3){
                    $scope.chooseAdPower_2 = true && $rootScope.openAdsystem;
                    $scope.chooseAdPower_1 = false;
                    return;
                }
            }
            if (($scope.adminData.level & 63) === 1){
                if (($scope.adminData.level & 256) !== 0){
                    $scope.chooseAdPower_2 = true && $rootScope.openAdsystem;
                    $scope.chooseAdPower_1 = false;
                    return;
                }else {
                    $scope.chooseAdPower_2 = false;
                    $scope.chooseAdPower_1 = false;
                    return;
                }
            }
            if (($scope.adminData.level & 63) === 2) {
                return;
            }
        };
        var orderBy = $filter('orderBy');
        $scope.Login_register = true;
        $scope.login = function (user, psw, rmm) {
            $scope.hideGuardSystem = false;
            $scope.hideAdSystem = false;
            $scope.hideAdFileManage = true;
            $scope.hideAdLaunch = true;
            var loginData = {
                userName: user,
                password: psw,
                rememberMe: rmm
            };
            var encryptedData = {
                wsHash: $rootScope.g.wsHash,
                ciphertext: encryptedString($rootScope.g.rsaKey, JSON.stringify(loginData))
            };
            $.ajax({
                type: 'POST',
                url: '/Account/Login',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(encryptedData)
            }).done(function (data) {
                $rootScope.isAuthorize = true;
                $timeout(function () {
                    $scope.chooseNumber = 5;
                    $scope.adminData.communities = data.communities;
                    $scope.adminData.name = data.name;
                    $scope.adminData.level = data.level;
                    //超级管理员
                    if (data.level === 0){
                        $location.path("/entranceGuardSystem");
                        urlChoose = 1;
                        $scope.hideAdSystem = true && $rootScope.openAdsystem;
                        $scope.hideAdLaunch = false;
                        $scope.hideAdFileManage = false;
                        $scope.showOperateCom = true;
                        $scope.userGradeList = [
                            {id:1,name:"一级管理员"},
                            {id:2,name:"二级管理员"},
                            {id:3,name:"三级管理员"}
                        ];
                        return;
                    }
                    //一级管理员
                    if ((data.level & 63) === 1){
                        $scope.showOperateCom = true;
                        $scope.userGradeList = [
                            {id:2,name:"二级管理员"},
                            {id:3,name:"三级管理员"}
                        ];
                        if ((data.level & 256) !== 0){
                            $location.path("/entranceGuardSystem");
                            urlChoose = 1;
                            $scope.hideAdSystem = true && $rootScope.openAdsystem;
                            $scope.hideAdLaunch = false;
                            $scope.hideAdFileManage = false;
                            return;
                        }else {
                            $location.path("/entranceGuardSystem");
                            urlChoose = 1;
                            $scope.hideAdSystem = false && $rootScope.openAdsystem;
                            $scope.hideAdLaunch = true;
                            $scope.hideAdFileManage = true;
                            return;
                        }
                    }
                    //二级管理员
                    if ((data.level & 63) === 2){
                        $scope.showOperateCom = false;
                        $scope.userGradeList = [
                            {id:3,name:"三级管理员"}
                        ];
                        if ((data.level & 64) !== 0 && (data.level & 128) !== 0){
                            $scope.hideAdSystem = true && $rootScope.openAdsystem;
                            $scope.hideAdLaunch = false;
                            $scope.hideAdFileManage = false;
                            $location.path("/entranceGuardSystem");
                            urlChoose = 1;
                            return;
                        }
                        if ((data.level & 64) !== 0){
                            $scope.hideAdSystem = true && $rootScope.openAdsystem;
                            $scope.hideAdFileManage = false;
                            $scope.hideAdLaunch = true;
                            $location.path("/entranceGuardSystem");
                            urlChoose = 1;
                            return;
                        }
                        if ((data.level & 128) !== 0){
                            $scope.hideAdSystem = true && $rootScope.openAdsystem;
                            $scope.hideAdFileManage = true;
                            $scope.hideAdLaunch = false;
                            $location.path("/entranceGuardSystem");
                            urlChoose = 1;
                            return;
                        }
                        $location.path("/entranceGuardSystem");
                        urlChoose = 1;
                    }
                    //三级管理员
                    if ((data.level & 63) === 3){
                        $scope.userGradeList = [];
                        $scope.hideGuardSystem = true;
                        if ((data.level & 64) !== 0 && (data.level & 128) !== 0){
                            $scope.hideAdSystem = true && $rootScope.openAdsystem;
                            $scope.hideAdLaunch = false;
                            $scope.hideAdFileManage = false;
                            $location.path("/querySystem");
                            urlChoose = 2;
                            return;
                        }
                        if ((data.level & 64) !== 0){
                            $scope.hideAdSystem = true && $rootScope.openAdsystem;
                            $scope.hideAdFileManage = false;
                            $scope.hideAdLaunch = true;
                            $location.path("/querySystem");
                            urlChoose = 2;
                            return;
                        }
                        if ((data.level & 128) !== 0){
                            $scope.hideAdSystem = true && $rootScope.openAdsystem;
                            $scope.hideAdFileManage = true;
                            $scope.hideAdLaunch = false;
                            $location.path("/querySystem");
                            urlChoose = 2;
                            return;
                        }
                        $location.path("/querySystem");
                        urlChoose = 2;
                    }
                });
            }).fail(function (err) {
                $("#errorText").removeClass("hidden");
                $timeout(function () {
                    $("#errorText").addClass("hidden");
                }, 3000);
            });
        };
        $scope.changeLogin = function () {
            $scope.Login_register = !$scope.Login_register;
            $("#errorText").text("");
        };
        $scope.registerActive = function (user, pwd, code) {
            if (!user || !pwd || !code) {
                alert("请填写完所有数据！");
                return;
            }
            var reqData = {
                "userName": user,
                "password": pwd,
                "inviteCode": code
            };
            $.ajax({
                type: 'POST',
                url: 'Account/Register',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(reqData)
            }).done(function (data) {
                if (data.result) {
                    alert("注册成功");
                    return;
                } else {
                    var errText;
                    data.errors.map(function (item) {});
                    $(".badge").text();
                }
            }).fail(function (err) {
                console.log(err);
            });

        };
        /*注册登录结束*/

        /*门禁模块视图切换开始*/
        $scope.chooseView = function (viewNumber) {
            switch (viewNumber) {
                case 1:
                    sideUrlChoose = 1;
                    $scope.chooseNumber = 1;
                    return;
                case 2:
                    sideUrlChoose = 2;
                    $scope.chooseNumber = 2;
                    return;
                case 3:
                    sideUrlChoose = 3;
                    $scope.chooseNumber = 3;
                    $scope.selectedFingerprint = [];
                    $scope.authCompleteinfo = [];
                    return;
                case 4:
                    sideUrlChoose = 4;
                    $scope.selectedCard = [];
                    $scope.chooseNumber = 4;
                    $scope.authCompleteinfo = [];
                    return;
                case 5:
                    sideUrlChoose = 5;
                    $scope.addTree = true;
                    $scope.chooseNumber = 5;
                    return;
                case 6:
                    sideUrlChoose = 6;
                    $scope.chooseNumber = 6;
                    return;
                default:
                    sideUrlChoose = 5;
            }
        };
        $scope.functionalView = function () {
            switch ($scope.chooseNumber) {
                case 1:
                    return "views/entranceGuardView/deviceManagement.html";
                case 2:
                    return "views/entranceGuardView/PersonnelManagement.html";
                case 3:
                    $('#addFinger').modal({
                        keyboard: false,
                        backdrop: false,
                        show: false
                    });
                    return "views/entranceGuardView/fingerprintManagement.html";
                case 4:
                    return "views/entranceGuardView/cardManagement.html";
                case 5:
                    sideUrlChoose = 5;
                    return "views/entranceGuardView/CommunityStructure.html";
                case 6:
                    return "views/entranceGuardView/accountManagement.html";
                default:
                    return "views/entranceGuardView/CommunityStructure.html";
            }
        };
        $scope.asideView = true;
        /*门禁模块视图切换结束*/

        /*账号管理数据*/
        $scope.adminData = {
            name: "",
            communities: [],
            manager: [],
            level: "",
            Advertising:[]
        };
        /*进入账号管理时获取当前管理员管理的人员数据*/
        $scope.getAdminList = function () {
            $.get("Account/subAdmins", function (data) {
                $timeout(function () {
                    $scope.adminData.manager = data;
                });
            });
        };
        /*管理界面视图切换开始*/
        $scope.adminViewList = [{
                name: "小区列表",
                control: "0"
            },
            {
                name: "管理员列表",
                control: "1"
            },
            {
                name: "生成邀请码",
                control: "2"
            },
            {
                name: "修改密码",
                control: "3"
            }
        ];
        $scope.viewSwitch = {};
        $scope.switchView = function (control) {
            $scope.viewSwitch.mode = control;
        };
        $scope.switchView("0");
        /*管理界面视图切换结束*/
        //修改小区
        var editCommunityData;
        $scope.openEditCommunity = function (community) {
            editCommunityData = community;
            $('#editCommunity').modal('show');
            $scope.newCommunityName = community.name;
            $scope.newCommunityRemark = community.remark;

        };
        $scope.editCommunity = function (name, remark) {
            if (!name) {
                alert("请填写名称");
                return;
            }
            var editData = {
                id: editCommunityData.id,
                name: name,
                remark: remark
            };
            $.ajax({
                type: 'POST',
                url: 'Communities/Edit',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(editData)
            }).done(function (data) {
                if (data) {
                    alert("修改成功！");
                    $timeout(function () {
                        editCommunityData.name = name;
                        editCommunityData.remark = remark;
                    });
                }
            }).fail(function (err) {
                console.log(err);
            });

        };
        /*删除小区开始*/
        $scope.deleteCommunity = function () {
            var deleteCommunityList = angular.element("input:checkbox[name='chooseDeleteCommunity']:checked");
            var sure = confirm("你确定删除这" + deleteCommunityList.length + "个小区吗？");
            if (!sure) {
                return;
            }
            var deleteCommunityIdList = [];
            angular.forEach(deleteCommunityList, function (item) {
                var itemValue = angular.fromJson(item.value);
                deleteCommunityIdList.push(itemValue.id);
            });
            $.ajax({
                type: 'POST',
                url: 'Communities/Delete',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(deleteCommunityIdList)
            }).done(function (data) {
                $timeout(function () {
                    $scope.adminData.communities = $scope.adminData.communities.filter(function (item) {
                        return deleteCommunityIdList.indexOf(item.id) === -1;
                    });
                });
                alert("删除成功！");
            }).fail(function (err) {
                console.log(err);
            });

        };
        /*删除小区结束*/

        /*新建小区开始*/
        $scope.createNewCommunity = function (area, newCommunityName, newCommunityRemark) {
            if (!area || !newCommunityName || !newCommunityRemark) {
                alert("请填写完所有信息");
                return;
            }
            var newCommunityData = {
                "area": area,
                "name": newCommunityName,
                "remark": newCommunityRemark
            };
            $.ajax({
                type: 'POST',
                url: 'Communities/Create',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(newCommunityData)
            }).done(function (data) {
                var newCommunityObj = {
                    id: data,
                    name: newCommunityName
                };
                $timeout(function () {
                    $scope.adminData.communities.unshift(newCommunityObj);
                });
                alert("添加成功！");
            }).fail(function (err) {
                console.log(err);
            });
        };
        /*新建小区结束*/

        /*删除管理员开始*/
        $scope.deleteAdmin = function () {
            var deletaAdminOpenidList = [];
            var deleteAdminList = angular.element("input:checkbox[name='managerChoose']:checked");
            var sure = confirm("你确定删除这" + deleteAdminList.length + "个管理员吗？");
            if (!sure) {
                return;
            }
            angular.forEach(deleteAdminList, function (item) {
                var itemValue = item.value;
                deletaAdminOpenidList.push(itemValue);
            });
            $.ajax({
                type: 'POST',
                url: 'Account/DeleteAdmins',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(deletaAdminOpenidList)
            }).done(function (data) {
                $timeout(function () {
                    $scope.adminData.manager = $scope.adminData.manager.filter(function (item) {
                        return deletaAdminOpenidList.indexOf(item.openid) === -1;
                    });
                });
                alert("删除成功！");
            }).fail(function (err) {
                console.log(err);
            });

        };
        /*删除管理员结束*/

        /*编辑管理员开始*/
        var editedManagerOpenid,editedManagerIndex;
        $scope.editAdmin = function (manager, index) {
            $('#editAdmin').modal('show');
            editedManagerOpenid = manager.openid;
            editedManagerIndex = index;
            $scope.editedAdmin = manager.name ? manager.name : manager.openid;
            //已授权小区列表
            $scope.editedAdminCommunities = manager.communities;
            $scope.editedAdminCommunitiesID = $scope.editedAdminCommunities.map(function (item) {
                return item.id;
            });
            //未授权小区列表
            if ($scope.editedAdminCommunities.length == 0) {
                $scope.uneditedAdminCommunities = $scope.adminData.communities;
            } else {
                $scope.uneditedAdminCommunities = $scope.adminData.communities.filter(function (item) {
                    return $scope.editedAdminCommunitiesID.indexOf(item.id) === -1;
                });
            }
        };
        //授权小区
        $scope.authCommunity = function () {
            var authCommunityIdList = [];
            var authCommunityList = angular.element("input:checkbox[name='unAuthorizedCommunity']:checked");
            if (authCommunityList.length == 0) {
                alert("请选择小区！");
                return;
            }
            var sure = confirm("你确定授权这" + authCommunityList.length + "个小区给该管理员吗？");
            if (!sure) {
                return;
            }
            angular.forEach(authCommunityList, function (item) {
                var itemValue = item.value;
                authCommunityIdList.push(itemValue);
            });
            $.ajax({
                type: 'POST',
                url: 'Account/AuthCommunity/' + editedManagerOpenid,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(authCommunityIdList)
            }).done(function (data) {
                $timeout(function () {
                    angular.forEach($scope.uneditedAdminCommunities, function (item) {
                        if (authCommunityIdList.indexOf(item.id) !== -1) {
                            $scope.editedAdminCommunities.push(item);
                        }
                    });
                    $scope.uneditedAdminCommunities = $scope.uneditedAdminCommunities.filter(function (item) {
                        return authCommunityIdList.indexOf(item.id) === -1;
                    });

                });
                alert("授权成功！");
            }).fail(function (err) {
                console.log(err);
            });

        };

        //删除授权
        $scope.unAuthCommunity = function () {
            var unauthCommunityIdList = [];
            var unauthCommunityList = angular.element("input:checkbox[name='AuthorizedCommunity']:checked");
            if (unauthCommunityList.length === 0) {
                alert("请选择小区！");
                return;
            }
            var sure = confirm("你确定删除该管理员这" + unauthCommunityList.length + "个小区的授权吗？");
            if (!sure) {
                return;
            }
            angular.forEach(unauthCommunityList, function (item) {
                var itemValue = item.value;
                unauthCommunityIdList.push(itemValue);
            });
            $.ajax({
                type: 'POST',
                url: 'Account/ReleaseCommunity/' + editedManagerOpenid,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(unauthCommunityIdList)
            }).done(function (data) {
                $timeout(function () {
                    angular.forEach($scope.editedAdminCommunities, function (item) {
                        if (unauthCommunityIdList.indexOf(item.id) !== -1) {
                            $scope.uneditedAdminCommunities.unshift(item);
                        }
                    });
                    $scope.editedAdminCommunities = $scope.editedAdminCommunities.filter(function (item) {
                        return unauthCommunityIdList.indexOf(item.id) === -1;
                    });
                    $scope.adminData.manager[editedManagerIndex].communities = $scope.editedAdminCommunities;
                });
                alert("删除成功！");
            }).fail(function (err) {
                console.log(err);
            });

        };

        /*编辑管理员结束*/

        /*生成邀请码开始*/
        //授权小区下拉
        $scope.authList = true;
        $scope.showList = function () {
            $scope.authList = !$scope.authList;
        };
        $scope.generateInviteCode = function (remark) {
            if (!remark) {
                alert("请填写备注，以识别你申请的邀请码!");
                return;
            }
            var level = Number($("#userGrade").val());
            var adPower = angular.element("input:checkbox[name='adPower']:checked");
            console.log(adPower);
            angular.forEach(adPower, function (item) {
                var itemValue = item.value;
                console.log(itemValue);
                level = level | itemValue;
            });
            console.log(level);
            var authCommunities = [];
            var inputEle = angular.element("input:checkbox[name='auth']:checked");
            angular.forEach(inputEle, function (item) {
                var itemValue = item.value;
                authCommunities.push({
                    id: itemValue
                });
            });
            var reqData = {
                communities: authCommunities,
                level: level,
                remark: remark
            };
            $.ajax({
                type: 'POST',
                url: 'Account/InviteCode',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(reqData)
            }).done(function (data) {
                $("#generate").val(data);
                $timeout(function () {
                    $scope.adminData.manager.unshift({
                        openid: data,
                        level: level,
                        remark: remark
                    });
                });

            }).fail(function (err) {
                console.log(err);
            });
        };

        /*生成邀请码结束*/

        /*修改密码开始*/
        $scope.changepwd = function (oldPwd, newPwd) {
            if (!oldPwd || !newPwd) {
                alert("请填写旧密码或者新密码！");
                return;
            }
            var reqData = {
                oldPassword: oldPwd,
                newPassword: newPwd
            };
            $.ajax({
                type: 'POST',
                url: 'Manage/ChangePassword',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(reqData)
            }).done(function (data) {
                alert("密码修改成功");
            }).fail(function (err) {
                console.log(err);
            });

        };
        /*修改密码结束*/

        //当前操作小区数据
        $scope.communityData = {
            chooseCommunity: {},
            personnel: [],
            address: {},
            device: [],
            card: [],
            Fingerprints: [],
            AdvertisingPlans:[],
            AdFiles:[],
            AdchooseCom:{}
        };
        /*小区结构开始*/
        var treeData = [];
        var treeComData; //小区数据
        var floorData; //楼数据
        var unitData; //单元数据
        var roomData; //房间数据
        $scope.addTree = true;
        $scope.closeaddTree = function () {
            $scope.addTree = true;
        };
        $scope.ComStrViewSwitch = {};
        $scope.drawTree = function () {
            if (sideUrlChoose !== 5) {
                return;
            }
            if (treeData.length !== 0) {
                $('#tree').treeview({
                    data: treeData, // 数据不是可选的
                    levels: 3, //水平
                    multiSelect: false //多
                });
                $('#tree').on('nodeSelected', function (event, data) {
                    switch (data.id) {
                        case "0":
                            treeComData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "0";
                                $scope.ComStrViewSwitch.buildingID = "";
                                $scope.ComStrViewSwitch.buildingName = "";
                            });
                            break;
                        case "1":
                            floorData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                                $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                                $scope.ComStrViewSwitch.unitID = "";
                                $scope.ComStrViewSwitch.unitName = "";
                                $scope.ComStrViewSwitch.mode = "1";
                            });
                            break;
                        case "2":
                            unitData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "2";
                                $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                                $scope.ComStrViewSwitch.editunitName = data.unitName;
                            });
                            break;
                        case "3":
                            roomData = data;
                            $timeout(function () {
                                $scope.ComStrViewSwitch.mode = "3";
                                $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                            });
                            break;
                    }
                    $scope.addTree = false;
                });
            }
        };
        $scope.SendArch = function (com) {
            if (!com.id) {
                return;
            }
            $rootScope.currentCommunity = true;
            //请求小区结构数据
            $scope.asideView = false;
            $.get('Communities/LoadArch/' + com.id, function (data) {
                console.log(data);
                $timeout(function () {
                    $scope.communityData.address = data;
                    $scope.addTree = true;
                });
                if (JSON.stringify(data) == "{}") {
                    treeData = [];
                    treeData = [{
                        text: com.name,
                        id: "0",
                        guid: com.id,
                        nodes: []
                    }];
                    $('#tree').treeview({
                        data: treeData, // 数据不是可选的
                        levels: 2, //水平
                        multiSelect: false //多
                    });
                    $('#tree').on('nodeSelected', function (event, data) {

                        switch (data.id) {
                            case "0":
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "0";
                                });
                                treeComData = data;
                                break;
                            case "1":
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "1";
                                });
                                floorData = data;
                                break;
                            case "2":
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "2";
                                });
                                unitData = data;
                                break;
                            case "3":
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "3";
                                });
                                roomData = data;
                                break;
                        }
                        $scope.addTree = false;
                    });
                } else {
                    treeData = [];
                    treeData[0] = {
                        text: data.name,
                        id: "0",
                        guid: data.guid,
                        nodes: []
                    };
                    data.buildings.forEach(function (flooritem, floorindex) {
                        treeData[0].nodes.push({
                            text: flooritem.id + "--" + flooritem.name,
                            id: "1",
                            blockNumber: flooritem.id,
                            blockName: flooritem.name,
                            nodes: []
                        });
                        flooritem.units.forEach(function (unititem, unitindex) {
                            treeData[0].nodes[floorindex].nodes.push({
                                text: unititem.id + "--" + unititem.name,
                                id: "2",
                                blockNumber: flooritem.id,
                                unitNumber: unititem.id,
                                unitName: unititem.name,
                                nodes: []
                            });
                            unititem.apartments.forEach(function (roomitem) {
                                treeData[0].nodes[floorindex].nodes[unitindex].nodes.push({
                                    text: roomitem.id,
                                    blockNumber: flooritem.id,
                                    unitNumber: unititem.id,
                                    roomNumber: roomitem.id,
                                    id: "3",
                                    guid: roomitem.guid
                                });
                            });
                        });
                    });
                    $('#tree').treeview({
                        data: treeData, // 数据不是可选的
                        levels: 3, //水平
                        multiSelect: false //多
                    });
                    $('#tree').on('nodeSelected', function (event, data) {
                        switch (data.id) {
                            case "0":
                                treeComData = data;
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "0";
                                    $scope.ComStrViewSwitch.buildingID = "";
                                    $scope.ComStrViewSwitch.buildingName = "";
                                });
                                break;
                            case "1":
                                floorData = data;
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                                    $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                                    $scope.ComStrViewSwitch.unitID = "";
                                    $scope.ComStrViewSwitch.unitName = "";
                                    $scope.ComStrViewSwitch.mode = "1";
                                });
                                break;
                            case "2":
                                unitData = data;
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "2";
                                    $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                                    $scope.ComStrViewSwitch.editunitName = data.unitName;
                                });
                                break;
                            case "3":
                                roomData = data;
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "3";
                                    $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                                });
                                break;
                        }
                        $scope.addTree = false;
                    });
                }
            });
            //请求人员数据
            $.get('Citizen/Folk/' + com.id, function (data) {
                $timeout(function () {
                    $scope.communityData.personnel = data.slice(0);
                    $scope.personnel_viewData = data.slice(0);
                });
            });
            //请求设备数据
            $.get('Devices/Folk/' + com.id, function (data) {
                $timeout(function () {
                    $scope.communityData.device = orderBy(data.slice(0),"address");
                    $scope.ChooseauthDevice = data.slice(0);
                    $scope.unalreadyAuthFingerprint = data.slice(0);
                });
            });
            //请求卡数据
            $.get('Cards/Folk/' + com.id, function (data) {
                console.log(data);
                $timeout(function () {
                    $scope.communityData.card = data.slice(0);
                    $scope.card_viewData = data.slice(0);
                });
            });
            //请求指纹数据
            $.get('Fingerprints/Folk/' + com.id, function (data) {
                $timeout(function () {
                    $scope.communityData.Fingerprints = data.slice(0);
                    $scope.fingerprint_viewData = data.slice(0);
                });
            });
        };
        var validate = (function () {
            function floorId(id) {
                if (id.length !== 4) {
                    alert("楼号必须是4位数字，例如：0001");
                    return false;
                }
                if (isNaN(Number(id))) {
                    alert("楼号必须是4位数字，例如：0001");
                    return false;
                }
                return true;
            }

            function unitORroomId(id) {
                if (id.length !== 2) {
                    alert("单元号必须是2位数字，例如：01");
                    return false;
                }
                if (isNaN(Number(id))) {
                    alert("单元号必须是2位数字，例如：01");
                    return false;
                }
                return true;
            }

            function room(start, end) {
                if (start.length !== 2 || end.length !== 2) {
                    alert("房间或者楼层号必须是两位数字，例如：01");
                    return false;
                }
                if (isNaN(Number(start)) || isNaN(Number(end))) {
                    alert("房间或者楼层号必须是两位数字，例如：01");
                    return false;
                }
                if (Number(start) > Number(end)) {
                    alert("开始房间或者楼号大于结束房间或者楼号！");
                    return false;
                }
                return true;
            }
            return {
                floorID: floorId,
                unitORroomID: unitORroomId,
                room: room
            };
        })();
        //添加楼
        $scope.addBuilding = function (id, name) {
            if (!id || !name) {
                alert("请填写完整信息！");
                return;
            }
            if (!validate.floorID(id)) {
                return;
            }
            if (treeData[0].nodes.some(function (item) {
                    return item.blockNumber == id;
                })) {
                alert("该楼号重复！！");
                return;
            }
            treeData[0].nodes.push({
                text: id + "--" + name,
                id: "1",
                blockNumber: id,
                blockName: name,
                nodes: []
            });
            treeData[0].nodes = orderBy(treeData[0].nodes, 'blockNumber');
            $('#tree').treeview({
                data: treeData, // 数据不是可选的
                levels: 2, //水平
                multiSelect: false //多
            });
            $('#tree').on('nodeSelected', function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        floorData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        //修改楼
        $scope.editBuilding = function (id, name) {
            if (!id || !name) {
                alert("请填写完整信息");
                return;
            }
            if (!validate.floorID(id)) {
                return;
            }
            for (var i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber == floorData.blockNumber) {
                    var otherFloor = treeData[0].nodes.filter(function (item, index) {
                        return index != i;
                    });
                    if (otherFloor.some(function (item) {
                            return item.blockNumber == id;
                        })) {
                        alert("该楼号重复！！");
                        return;
                    }
                    treeData[0].nodes[i].blockName = name;
                    treeData[0].nodes[i].blockNumber = id;
                    treeData[0].nodes[i].text = id + "--" + name;
                    break;
                }
            }
            treeData[0].nodes = orderBy(treeData[0].nodes, 'blockNumber');
            $('#tree').treeview({
                data: treeData, // 数据不是可选的
                levels: 2, //水平
                multiSelect: false //多
            });
            $('#tree').on('nodeSelected', function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        floorData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        //删除楼
        $scope.deleteBuilding = function () {
            for (var i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber == floorData.blockNumber) {
                    if ($scope.communityData.device.some(function (t) {
                        return deviceAddressToStr(t.address).slice(0, 4) === floorData.blockNumber;
                    })) {
                        alert("请先清除节点下的设备！");
                        return
                    }
                    treeData[0].nodes.splice(i, 1);
                    break;
                }
            }
            $('#tree').treeview({
                data: treeData, // 数据不是可选的
                levels: 2, //水平
                multiSelect: false //多
            });
            $timeout(function () {
                $scope.ComStrViewSwitch.mode = "0";
                $scope.ComStrViewSwitch.editbuildingID = "";
                $scope.ComStrViewSwitch.editbuildingName = "";
            });
            $('#tree').on('nodeSelected', function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        floorData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });

        };
        //添加单元
        $scope.addunit = function (unitid, unitname) {
            if (!unitid || !unitname) {
                alert("请填写完整信息！");
                return;
            }
            if (!validate.unitORroomID(unitid)) {
                return;
            }
            for (var i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber == floorData.blockNumber) {
                    if (treeData[0].nodes[i].nodes.some(function (item) {
                            return item.unitNumber == unitid;
                        })) {
                        alert("单元号重复！");
                        return;
                    }
                    treeData[0].nodes[i].nodes.push({
                        text: unitid + "--" + unitname,
                        id: "2",
                        blockNumber: floorData.blockNumber,
                        unitNumber: unitid,
                        unitName: unitname,
                        nodes: []
                    });
                    treeData[0].nodes[i].nodes = orderBy(treeData[0].nodes[i].nodes, 'unitNumber');
                }
            }
            $('#tree').treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $('#tree').on('nodeSelected', function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        floorData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        //修改单元
        $scope.editunit = function (editunitId, editunitName) {
            if (!editunitId || !editunitName) {
                alert("请填写完整信息！");
                return;
            }
            if (!validate.unitORroomID(editunitId)) {
                return;
            }
            for (var i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber == unitData.blockNumber) {
                    for (var j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                        if (treeData[0].nodes[i].nodes[j].unitNumber == unitData.unitNumber) {
                            var otherunit = treeData[0].nodes[i].nodes.filter(function (item, index) {
                                return index != j;
                            });
                            if (otherunit.some(function (item) {
                                    return item.unitNumber == editunitId;
                                })) {
                                alert("单元号重复！");
                                return;
                            }
                            treeData[0].nodes[i].nodes[j].text = editunitId + "--" + editunitName;
                            treeData[0].nodes[i].nodes[j].unitNumber = editunitId;
                            treeData[0].nodes[i].nodes[j].unitName = editunitName;
                            treeData[0].nodes[i].nodes = orderBy(treeData[0].nodes[i].nodes, 'unitNumber');
                            break;
                        }
                    }
                    break;
                }
            }
            $('#tree').treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $('#tree').on('nodeSelected', function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        floorData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        $scope.deleteunit = function () {
            if ($scope.communityData.device.filter(function (t) {
                return deviceAddressToStr(t.address).slice(0, 4) === unitData.blockNumber;
            }).some(function (t) {
                return deviceAddressToStr(t.address).slice(4, 6) === unitData.unitNumber;
            })) {
                alert("请先清除节点下的设备！");
                return;
            }
            for (var i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber == unitData.blockNumber) {
                    for (var j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                        if (treeData[0].nodes[i].nodes[j].unitNumber == unitData.unitNumber) {
                            treeData[0].nodes[i].nodes.splice(j, 1);
                            break;
                        }
                    }
                    break;
                }
            }
            $('#tree').treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $('#tree').on('nodeSelected', function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        floorData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        $scope.addroom = function (roomidstart, roomidend, storeyidstart, storeyidend) {
            if (!roomidstart || !roomidend || !storeyidstart || !storeyidend) {
                alert("请填写完整信息！");
                return;
            }
            if (!validate.room(roomidstart, roomidend)) {
                return;
            }
            if (!validate.room(storeyidstart, storeyidend)) {
                return;
            }
            var tofn, torn, resultroom = [];
            for (var fn = Number(storeyidstart); fn <= Number(storeyidend); fn++) {
                for (var rn = Number(roomidstart); rn <= Number(roomidend); rn++) {
                    if (fn < 10) {
                        tofn = "0" + fn;
                    } else {
                        tofn = fn + "";
                    }
                    if (rn < 10) {
                        torn = "0" + rn;
                    } else {
                        torn = rn + "";
                    }
                    resultroom.push(tofn + torn);
                }
            }
            for (var i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber == unitData.blockNumber) {
                    for (var j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                        if (treeData[0].nodes[i].nodes[j].unitNumber == unitData.unitNumber) {
                            for (var rnNum = 0; rnNum < resultroom.length; rnNum++) {
                                var removal = treeData[0].nodes[i].nodes[j].nodes.some(function (item) {
                                    return item.roomNumber == resultroom[rnNum];
                                });
                                if (!removal) {
                                    treeData[0].nodes[i].nodes[j].nodes.push({
                                        text: resultroom[rnNum],
                                        blockNumber: unitData.blockNumber,
                                        unitNumber: unitData.unitNumber,
                                        roomNumber: resultroom[rnNum],
                                        id: "3",
                                        guid: ""
                                    });
                                    treeData[0].nodes[i].nodes[j].nodes = orderBy(treeData[0].nodes[i].nodes[j].nodes, 'roomNumber');
                                }
                            }
                            break;
                        }

                    }
                    break;
                }
            }
            $('#tree').treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $('#tree').on('nodeSelected', function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        floorData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });

        };
        $scope.editroom = function (editroomId) {
            if (!editroomId) {
                alert("房间号不能为空！");
                return;
            }
            if (editroomId.length !== 4) {
                alert("房间号格式不对！");
                return;
            }
            if (isNaN(Number(editroomId))) {
                alert("房间号格式不对！");
                return;
            }
            if (Number(editroomId) < 0 || Number(editroomId) > 9999) {
                alert("房间号格式不对！");
                return;
            }
            for (var i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber == roomData.blockNumber) {
                    for (var j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                        if (treeData[0].nodes[i].nodes[j].unitNumber == roomData.unitNumber) {
                            for (var n = 0; n < treeData[0].nodes[i].nodes[j].nodes.length; n++) {
                                if (treeData[0].nodes[i].nodes[j].nodes[n].roomNumber == roomData.roomNumber) {
                                    treeData[0].nodes[i].nodes[j].nodes[n].text = editroomId;
                                    treeData[0].nodes[i].nodes[j].nodes[n].roomNumber = editroomId;
                                    treeData[0].nodes[i].nodes[j].nodes = orderBy(treeData[0].nodes[i].nodes[j].nodes, 'roomNumber');
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            $('#tree').treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $('#tree').on('nodeSelected', function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        floorData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        $scope.deleteroom = function () {
            for (var i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber == roomData.blockNumber) {
                    for (var j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                        if (treeData[0].nodes[i].nodes[j].unitNumber == roomData.unitNumber) {
                            for (var n = 0; n < treeData[0].nodes[i].nodes[j].nodes.length; n++) {
                                if (treeData[0].nodes[i].nodes[j].nodes[n].roomNumber == roomData.roomNumber) {
                                    treeData[0].nodes[i].nodes[j].nodes.splice(n, 1);
                                    $timeout(function () {
                                        $scope.ComStrViewSwitch.editroomID = "";
                                    });
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            $('#tree').treeview({
                data: treeData, // 数据不是可选的
                levels: 4, //水平
                multiSelect: false //多
            });
            $('#tree').on('nodeSelected', function (event, data) {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        floorData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(function () {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        $scope.SubmitComTree = function () {
            var submitData = {
                name: "",
                guid: "",
                buildings: [
                    /* {
                         id:"",
                         name:"",
                         units:[
                             {
                                 id:"",
                                 name:"",
                                 apartments:[
                                     {
                                         id:"",
                                         guid:""
                                     }
                                     ]
                             }
                         ]
                     }*/
                ]
            };
            submitData.name = treeData[0].text;
            submitData.guid = treeData[0].guid;
            treeData[0].nodes.forEach(function (flooritem, floorindex) {
                submitData.buildings.push({
                    id: flooritem.blockNumber,
                    name: flooritem.blockName,
                    units: []
                });
                flooritem.nodes.forEach(function (unititem, unitindex) {
                    submitData.buildings[floorindex].units.push({
                        id: unititem.unitNumber,
                        name: unititem.unitName,
                        apartments: []
                    });
                    unititem.nodes.forEach(function (roomitem) {
                        submitData.buildings[floorindex].units[unitindex].apartments.push({
                            id: roomitem.roomNumber,
                            guid: roomitem.guid
                        });
                    });
                });
            });
            $.ajax({
                type: 'POST',
                url: 'Communities/SendArch',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(submitData)
            }).done(function (data) {
                alert("提交成功");
                $.get('Communities/LoadArch/' + treeData[0].guid, function (data) {
                    $timeout(function () {
                        $scope.communityData.address = data;
                    });
                    treeData = [];
                    treeData[0] = {
                        text: data.name,
                        id: "0",
                        guid: data.guid,
                        nodes: []
                    };
                    data.buildings.forEach(function (flooritem, floorindex) {
                        treeData[0].nodes.push({
                            text: flooritem.id + "--" + flooritem.name,
                            id: "1",
                            blockNumber: flooritem.id,
                            blockName: flooritem.name,
                            nodes: []
                        });
                        flooritem.units.forEach(function (unititem, unitindex) {
                            treeData[0].nodes[floorindex].nodes.push({
                                text: unititem.id + "--" + unititem.name,
                                id: "2",
                                blockNumber: flooritem.id,
                                unitNumber: unititem.id,
                                unitName: unititem.name,
                                nodes: []
                            });
                            unititem.apartments.forEach(function (roomitem) {
                                treeData[0].nodes[floorindex].nodes[unitindex].nodes.push({
                                    text: roomitem.id,
                                    blockNumber: flooritem.id,
                                    unitNumber: unititem.id,
                                    roomNumber: roomitem.id,
                                    id: "3",
                                    guid: roomitem.guid
                                });
                            });
                        });
                    });
                    $('#tree').treeview({
                        data: treeData, // 数据不是可选的
                        levels: 3, //水平
                        multiSelect: false //多
                    });
                    $('#tree').on('nodeSelected', function (event, data) {
                        switch (data.id) {
                            case "0":
                                treeComData = data;
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "0";
                                    $scope.ComStrViewSwitch.buildingID = "";
                                    $scope.ComStrViewSwitch.buildingName = "";
                                });
                                break;
                            case "1":
                                floorData = data;
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                                    $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                                    $scope.ComStrViewSwitch.unitID = "";
                                    $scope.ComStrViewSwitch.unitName = "";
                                    $scope.ComStrViewSwitch.mode = "1";
                                });
                                break;
                            case "2":
                                unitData = data;
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "2";
                                    $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                                    $scope.ComStrViewSwitch.editunitName = data.unitName;
                                });
                                break;
                            case "3":
                                roomData = data;
                                $timeout(function () {
                                    $scope.ComStrViewSwitch.mode = "3";
                                    $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                                });
                                break;
                        }
                        $scope.addTree = false;
                    });
                });
            }).fail(function (err) {
                console.log(err);
            });

        };
        /*小区结构结束*/

        /*人员管理开始*/
        $scope.editing = true;
        $scope.addAddressview = true;
        $scope.addAddressListView = [];
        $scope.addAddressList = [];
        var refreshOrNo = true;
        $scope.addAddress = function (building, unit, room) {
            if (!building || !unit || !room) {
                alert("请选择完整地址");
                return;
            }
            if ($scope.addAddressList.some(function (item, index) {
                    return item == room.guid;
                })) {
                return;
            }
            $scope.addAddressview = false;
            $scope.addAddressListView.push({
                name: building.name + "-" + unit.name + "-" + room.id,
                guid: room.guid
            });
            $scope.addAddressList.push(room.guid);
        };
        $scope.deleteAddAddress = function (id) {
            var deleteIndex;
            $scope.addAddressListView.map(function (item, index) {
                if (item.guid == id) {
                    deleteIndex = index;
                }
            });
            $scope.addAddressListView.splice(deleteIndex, 1);
            $scope.addAddressList.splice(deleteIndex, 1);
        };
        //根据身份证查询人员
        $scope.queryPersonnerl = function (id) {
            if (id.length != 18) {
                return;
            }
            var validator = new IDValidator();
            if (!validator.isValid(id)) {
                alert("身份证号码格式不正确！");
                return;
            }
            if ($scope.communityData.personnel.some(function (item) {
                    return item.nric == id;
                })) {
                alert("身份证号码重复，请查看是否重复添加！");
                return;
            }
            $.get("Citizen/" + id,
                function(data) {
                    if (JSON.stringify(data) == "{}") {
                        return;
                    }
                    $timeout(function() {
                        if (data.name) {
                            $scope.addName = data.name;
                        }
                        if (data.phone) {
                            $scope.addNumber = data.phone;
                        }
                        if (data.QQ) {
                            $scope.addQQ = data.QQ;
                        }
                        if (data.wechat) {
                            $scope.addWeChat = data.wechat;
                        }
                        if (data.remark) {
                            $scope.addRemark = data.remark;
                        }
                        if (data.occupation) {
                            $scope.addWorkUnit = data.occupation;
                        }
                        if (data.phoneMac) {
                            $scope.addphoneMac = data.phoneMac;
                        }
                    });
                });
        };
        //刷新添加人员地址
        $scope.refreshAddAddressList = function () {
            if (refreshOrNo){
                $scope.addAddressList = [];
                $scope.addAddressListView = [];
                refreshOrNo = false;
            }
        };
        //添加人员
        $scope.addPersonnel = function (addName, addID, addNumber, addWorkUnit, addQQ, addWeChat, addphoneMac, addRemark) {
            if (!addName) {
                alert("请填写姓名!");
                return;
            }
            if ($scope.addAddressList.length == 0) {
                alert("请添加住址!");
                return;
            }
            var validator = new IDValidator();
            if (addID) {
                if (!validator.isValid(addID)) {
                    alert("身份证号码格式不正确！");
                    return;
                }
                if ($scope.communityData.personnel.some(function (item) {
                        return item.nric == addID;
                    })) {
                    alert("身份证号码重复，请查看是否重复添加！");
                    return;
                }

            }
            var addData = {
                name: addName,
                phone: addNumber,
                nric: addID,
                QQ: addQQ,
                wechat: addWeChat,
                remark: addRemark,
                occupation: addWorkUnit,
                phoneMac: addphoneMac,
                rooms: $scope.addAddressList
            };
            $.ajax({
                type: 'put',
                url: 'Citizen',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(addData)
            }).done(function (data) {
                addData.nric = data;
                var testaddData = angular.copy(addData);
                $timeout(function () {
                    refreshOrNo = true;
                    $scope.communityData.personnel.push(testaddData);
                    $scope.personnel_viewData.push(testaddData);
                    $scope.alertSuccess = true;
                    $timeout(function() {
                            $scope.alertSuccess = false;
                        },
                        2000);
                });

            }).fail(function (err) {
                $timeout(function() {
                    $scope.alertFail = true;
                    $timeout(function() {
                            $scope.alertFail = false;
                        },
                        2000);
                });

            });

        };
        //选定人员
        var deletechoosePersonId;
        $scope.choosePersonnel = function (person) {
            $scope.choosePersonEditRooms = [];
            $scope.chooseBackColor = person.nric;
            deletechoosePersonId = person.nric;
            $scope.choosePersonEdit = person;

            $scope.editName = person.name;
            $scope.editQQ = person.QQ;
            $scope.editPhone = person.phone;
            $scope.editOccupation = person.occupation;
            $scope.editWechat = person.wechat;
            $scope.editPhoneMac = person.phoneMac;
            $scope.editRemark = person.remark;
            $scope.choosePersonEditID = person.nric.length == 18 ? person.nric : "";

            $scope.editing = person.nric.length === 18 ? true : false;
            person.rooms.forEach(function(item) {
                $scope.choosePersonEditRooms.push(item);
            });
        };
        //添加选定人员背景
        $scope.chooseStyle = function (person) {
            return $scope.chooseBackColor == person.nric ? "success" : "";
        };
        //删除人员
        $scope.deletePersonnel = function () {
            if (!deletechoosePersonId) {
                alert("请选择你要删除的人员！");
                return;
            }
            var deleteData = {
                id: treeData[0].guid,
                nric: deletechoosePersonId
            };
            var sure = confirm("你确定删除这个人员信息吗？");
            if (!sure) {
                return;
            }
            $.ajax({
                type: 'DELETE',
                url: 'Citizen',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(deleteData)
            }).done(function (data) {
                $timeout(function () {
                    $scope.personnel_viewData.forEach(function (item, index) {
                        if (item.nric == deletechoosePersonId) {
                            $scope.personnel_viewData.splice(index, 1);
                        }
                    });
                    $scope.communityData.personnel.forEach(function(item, index) {
                        if (item.nric == deletechoosePersonId) {
                            $scope.communityData.personnel.splice(index, 1);
                        }
                    });
                });
                alert("删除成功！");
            }).fail(function (err) {
                console.log(err);
            });
        };
        //修改人员
        $scope.editAddAddress = function (building, unit, room) {
            if (!building || !unit || !room) {
                alert("请选择完整地址");
                return;
            }
            if ($scope.choosePersonEditRooms.some(function (item, index) {
                    return item == room.guid;
                })) {
                return;
            }
            $scope.choosePersonEditRooms.push(room.guid);
        };
        $scope.editDeleteAddAddress = function (id) {
            var deleteIndex;
            $scope.choosePersonEditRooms.map(function (item, index) {
                if (item == id) {
                    deleteIndex = index;
                }
            });
            $scope.choosePersonEditRooms.splice(deleteIndex, 1);
        };
        $scope.editPerson = function (choosePersonEditID, editName, editQQ, editPhone, editOccupation, editWechat, editPhoneMac, editRemark) {
            var editData = {
                name: editName,
                phone: editPhone,
                nric: $scope.choosePersonEdit.nric,
                QQ: editQQ,
                wechat: editWechat,
                remark: editRemark,
                occupation: editOccupation,
                phoneMac: editPhoneMac
            };
            if (!editName) {
                alert("请填写姓名!");
                return;
            }
            if ($scope.choosePersonEditRooms.length == 0) {
                alert("请添加住址!");
                return;
            }
            var validatoredit = new IDValidator();
            if (!$scope.editing) {
                if (choosePersonEditID) {
                    if (!validatoredit.isValid(choosePersonEditID)) {
                        alert("身份证号码格式不正确！");
                        return;
                    }
                    if ($scope.communityData.personnel.some(function (item) {
                            return item.nric == choosePersonEditID;
                        })) {
                        alert("身份证号码重复，请查看是否重复添加！");
                        return;
                    }
                    editData.newNric = choosePersonEditID;
                }
            }
            var deleteRooms = $scope.choosePersonEdit.rooms.filter(function (item) {
                return $scope.choosePersonEditRooms.indexOf(item) == -1;
            });
            var addRooms = $scope.choosePersonEditRooms.filter(function (item) {
                return $scope.choosePersonEdit.rooms.indexOf(item) === -1;
            });
            editData.deleteRooms = deleteRooms;
            editData.rooms = addRooms;
            $.ajax({
                type: 'put',
                url: 'Citizen',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(editData)
            }).done(function (data) {
                $timeout(function () {
                    $scope.communityData.personnel.forEach(function (item, index, array) {
                        if (item.nric == deletechoosePersonId) {
                            array[index].nric = data;
                            array[index].name = editData.name;
                            array[index].phone = editData.phone;
                            array[index].QQ = editData.QQ;
                            array[index].wechat = editData.wechat;
                            array[index].remark = editData.remark;
                            array[index].occupation = editData.occupation;
                            array[index].phoneMac = editData.phoneMac;
                            array[index].rooms = $scope.choosePersonEditRooms;
                        }
                    });
                    $scope.alertSuccess = true;
                    $timeout(function() {
                            $scope.alertSuccess = false;
                        },
                        2000);
                });

            }).fail(function (err) {
                $timeout(function() {
                    $scope.alertFail = true;
                    $timeout(function() {
                            $scope.alertFail = false;
                        },
                        2000);
                });
            });
        };
        //人员过滤器
        $scope.personnelFilter = function (str) {
            if (!str) {
                $scope.personnel_viewData = $scope.communityData.personnel.slice(0);
                return;
            }
            var filterData = [];
            $scope.communityData.personnel.forEach(function (item) {
                for (var prop in item) {
                    if (item.hasOwnProperty(prop) && prop !== "$$hashKey") {
                        if (prop === "rooms") {
                            item[prop].forEach(function (t) {
                                if ($filter("roomName")(t, $scope.communityData.address).indexOf(str) !== -1) {
                                    filterData.push(item);
                                }
                                if ($filter("roomToAddressid")(t, $scope.communityData.address).indexOf(str) !== -1) {
                                    filterData.push(item);
                                }
                            });
                        } else if (item[prop].toString().indexOf(str) !== -1) {
                            filterData.push(item);
                            break;
                        }
                    }
                }
            });
            $scope.personnel_viewData = filterData;
        };
        /*人员管理结束*/

        /*设备管理开始*/
        var choosedeviceId;
        //添加设备
        $scope.addDevice = function (addressBuilding, addressUnit, deviceNumber, devicePwd, deviceRemark) {
            if (!addressBuilding || !addressUnit || deviceNumber.length === 0 || !devicePwd) {
                alert("请填写设备ID或者设备密码！");
                return;
            }
            if (devicePwd.length < 6) {
                alert("密码需要大于6位数！");
                return;
            }
            if (isNaN(Number(devicePwd))) {
                alert("密码必须为数字");
                return;
            }
            var deviceId = addressBuilding.id + addressUnit.id + deviceNumber;
            if ($scope.communityData.device.some(function (item) {
                return Number(deviceId) == item.address;
            })) {
                alert("该设备地址已经添加！");
                return;
            }
            var addDeviceData = {
                communityId: $scope.communityData.address.guid,
                password: devicePwd,
                address: deviceId,
                remark: deviceRemark
            };
            $.ajax({
                type: 'put',
                url: 'Device',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(addDeviceData)
            }).done(function (data) {
                $timeout(function () {
                    $scope.communityData.device.push(data);
                    $scope.ChooseauthDevice.push(data);
                    $scope.unalreadyAuthFingerprint.push(data);
                });
                alert("提交成功");
            }).fail(function (err) {
                console.log(err);
            });
        };
        //选定设备
        $scope.chooseDevice = function (device) {
            choosedeviceId = device.address;
            $scope.choosedeviceGuid = device.id;
            $scope.newDevicepwd = device.password;
            $scope.newRemark = device.remark;
        };
        //选定设备高亮
        $scope.chooseDeviceStyle = function (device) {
            return device.address == choosedeviceId ? "success" : "";
        };
        //删除设备
        $scope.deleteDevice = function () {
            if (!choosedeviceId) {
                alert("请选择你要删除的设备！");
                return;
            }
            var sure = confirm("你确定删除这个设备吗？");
            if (!sure) {
                return;
            }
            $.ajax({
                type: 'DELETE',
                url: 'Device/' + $scope.choosedeviceGuid,
                contentType: 'application/json; charset=utf-8'
            }).done(function (data) {
                $timeout(function () {
                    $scope.communityData.device.forEach(function (item, index) {
                        if (item.id === $scope.choosedeviceGuid) {
                            $scope.communityData.device.splice(index, 1);
                        }
                    });
                    $scope.ChooseauthDevice.forEach(function (item, index) {
                        if (item.id === $scope.choosedeviceGuid) {
                            $scope.ChooseauthDevice.splice(index, 1);
                        }
                    });
                    $scope.unalreadyAuthFingerprint.forEach(function (item, index) {
                        if (item.id === $scope.choosedeviceGuid) {
                            $scope.unalreadyAuthFingerprint.splice(index, 1);
                        }
                    });
                });
                alert("删除成功！");
            }).fail(function (err) {
                console.log(err);
            });
        };
        //修改设备密码
        $scope.editDevicepwd = function (newDevicepwd, newRemark) {
            if (newDevicepwd.length < 6) {
                alert("密码需要大于6位数");
                return;
            }
            if (isNaN(Number(newDevicepwd))) {
                alert("密码必须为数字");
                return;
            }
            var changepwd = {
                id: $scope.choosedeviceGuid,
                password: newDevicepwd,
                remark: newRemark
            };
            $.ajax({
                type: 'put',
                url: 'Devices/Edit',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(changepwd)
            }).done(function (data) {
                if (data) {
                    $timeout(function () {
                        $scope.communityData.device.forEach(function (item, index, array) {
                            if (item.id == $scope.choosedeviceGuid) {
                                array[index].password = newDevicepwd;
                                array[index].remark = newRemark;
                            }
                        });
                    });
                    alert("修改成功");
                } else {
                    alert("修改失败");
                }
            }).fail(function (err) {
                console.log(err);
            });
        };
        /*设备管理结束*/

        /*门禁卡管理开始*/

        //选定凭据已授权设备过滤器
        function authDeviceFilterGenerator(credentialList) {
            if (!credentialList) {
                return [];
            }
            if (credentialList.length === 0) {
                return [];
            }
            if (credentialList.length === 1) {
                return credentialList[0].auth;
            }
            var result = [];
            var have;
            credentialList.forEach(function (t) {
                t.auth.forEach(function(t2) {
                    if (result.length === 0) {
                        result.push(t2);
                    } else {
                        have = true;
                        for (var i = 0; i < result.length; i++) {
                            if (result[i].deviceId === t2.deviceId) {
                                result[i].expire = "";
                                result[i].binding = "";
                                have = false;
                                break;
                            }
                        }
                        if (have) {
                            result.push(t2);
                        }
                    }
                });
            });
            return result;
        }
        //选定凭据未授权设备过滤器(未授权并集)
        function unAuthDeviceFilterGenerator(credentialList, deviceLst) {
            var deviceList = deviceLst.slice(0);
            var cacheArr = [];
            var cacheArr1 = [];
            if (!credentialList) {
                return deviceList;
            }
            if (credentialList.length === 0) {
                return deviceList;
            }
            for (var i = 0; i < credentialList.length; i++) {
                if (credentialList[i].auth.length === 0) {
                    return deviceList;
                }
            }
            if (credentialList.length === 1) {
                credentialList[0].auth.forEach(function (t) {
                    for (var i = 0; i < deviceList.length; i++) {
                        if (t.deviceId === deviceList[i].id) {
                            deviceList.splice(i, 1);
                            break;
                        }
                    }
                });
                return deviceList;
            }
            for (var i = 0; i < credentialList.length; i++) {
                cacheArr1 = credentialList[i].auth.map(function (t) {
                    return t.deviceId;
                });
                if (i === 0) {
                    cacheArr = cacheArr1;
                } else {
                    cacheArr = cacheArr.filter(function (t) {
                        return cacheArr1.indexOf(t) !== -1;
                    });
                    if (cacheArr.length === 0) {
                        return deviceList;
                    }
                }
            }
            return deviceList.filter(function (t) {
                return cacheArr.indexOf(t.id) === -1;
            })
        }
        //选定待授权设备判断是否可以绑定房间
        $scope.selectAuthDevice = function () {
            var buildingsAddress = true;
            var unitAddress = true;
            var authDeviceAddress = [];
            //获取选择的门口机
            var authDevice = angular.element("input:checkbox[name='chooseAuthDevice']:checked");
            //获取的门口机地址列表
            angular.forEach(authDevice, function (item) {
                var itemValue = angular.fromJson(item.value);
                authDeviceAddress.push(deviceAddressToStr(itemValue.address));
            });
            if (authDeviceAddress.length === 0) {
                $scope.chooseBinding = true; //禁用绑定房复选框
                $scope.alreadyBinding = false; //禁用选择绑定房号下拉框
                return;
            }
            //多个设备判断是否是同一栋同一个单元
            if (authDeviceAddress.length > 1) {
                for (var i = 0; i < authDeviceAddress.length - 1; i++) {
                    if (authDeviceAddress[i].slice(0, 4) !== authDeviceAddress[i + 1].slice(0, 4)) {
                        buildingsAddress = false;
                        break;
                    }
                }
                if (buildingsAddress) {
                    for (i = 0; i < authDeviceAddress.length - 1; i++) {
                        if (authDeviceAddress[i].slice(4, 6) !== authDeviceAddress[i + 1].slice(4, 6)) {
                            unitAddress = false;
                            break;
                        }
                    }
                }
            }
            //当同一栋同一单元时候显示这栋这单元的房间
            if (buildingsAddress && unitAddress) {
                $scope.chooseBinding = false; //启用绑定房复选框
                if ($("#alreadyBindingAuth").is(':checked')) {
                    $scope.alreadyBinding = true; //启用选择绑定房号下拉框
                }
                $scope.bindingRoom = $scope.communityData.address.buildings.filter(function (t) {
                    return t.id === authDeviceAddress[0].slice(0, 4);
                })[0].units.filter(function (t2) {
                    return t2.id === authDeviceAddress[0].slice(4, 6);
                })[0].apartments.map(function (t3) {
                    return t3.id
                }).map(function (t) {
                    return {
                        room: t,
                        id: authDeviceAddress[0].slice(0, 6) + t
                    }
                })
            } else {
                $scope.chooseBinding = true;
                $scope.alreadyBinding = false;
                $scope.bindingRoom = [];
                return;
            }
        };

        $scope.addCardNumberValidate = true; //添加卡号验证提醒文字显示
        $scope.addcardPersonnelsValidate = true; //添加卡号，用户验证提醒文字显示
        $scope.addCardcomplete = true; //添加卡完成提醒文字显示
        $scope.chooseBinding = true;
        $scope.authCompleteinfo = [];
        //卡号验证
        function validateCardNumber(cardNumber) {
            var characterArr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
            cardNumber = Array.prototype.slice.call(cardNumber.toLowerCase());
            var result = cardNumber.every(function (t) {
                return characterArr.indexOf(t) !== -1;
            });
            return result;
        }
        //门口机地址转化
        function deviceAddressToStr(doorNumber) {
            var doorStr = doorNumber.toString();
            switch (doorStr.length) {
                case 1:
                    return "000000" + doorStr;
                case 2:
                    return "00000" + doorStr;
                case 3:
                    return "0000" + doorStr;
                case 4:
                    return "000" + doorStr;
                case 5:
                    return "00" + doorStr;
                case 6:
                    return "0" + doorStr;
                default:
                    return doorStr;
            }
        }
        //添加卡选择房间的时候过滤人员
        $scope.cardPersonnels = [];
        $scope.cardPersonnel = {};
        $scope.roomPersonnel = function (roomId) {
            $scope.cardPersonnels = [];
            if (!roomId) {
                $scope.cardPersonnel = {};
                return;
            }
            $scope.communityData.personnel.forEach(function (item) {
                if (item.rooms.some(function (item) {
                        return item === roomId.guid;
                    })) {
                    $scope.cardPersonnels.push(item);
                }
            });
            if ($scope.cardPersonnels.length !== 0){
                $scope.cardPersonnel.x = $scope.cardPersonnels[0].nric
            }
        };
        //打开添加卡modal
        $scope.openAddCard = function () {
            $scope.speedyAddCardSuccessList = [];
            $("#speedyAddCard_input").val("");

        };
        //添加卡方式
        $scope.showSpeedyAddCard = true;
        $scope.switchAddCard = function () {
            $scope.showSpeedyAddCard = !$scope.showSpeedyAddCard;
            $scope.speedyAddCardSuccessList = [];
            $("#speedyAddCard_input").val("");
        };
        //快速添加卡信息提醒
        $scope.speedyAddCardInfo = true;
        //快速添加卡
        $scope.addCard_speedy = function (event,cardNumber) {
            var keyCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
            if(keyCode === 13) {
               if (!cardNumber) {
                   return;
               }
                /*if (cardNumber.length < 8) {
                    $scope.speedyAddCardInfo = false;
                    $timeout(function () {
                        $scope.speedyAddCardInfo = true;
                    }, 2000);
                    $(".speedyAddNumber").text("卡号需要大于8位！");
                    return
                }*/
                if (!validateCardNumber(cardNumber)) {
                    $scope.speedyAddCardInfo = false;
                    $timeout(function () {
                        $scope.speedyAddCardInfo = true;
                    }, 2000);
                    $(".speedyAddNumber").text("卡号不符合规则！");
                    return;
                }
                if ($scope.communityData.card.some(function (t) {
                    return t.serial === cardNumber;
                })) {
                    $scope.speedyAddCardInfo = false;
                    $("#speedyAddCard_input").val("");
                    $(".speedyAddNumber").text("卡号重复！");
                    $timeout(function () {
                        $scope.speedyAddCardInfo = true;
                    }, 2000);
                    return
                }
                var addCardData = {
                    communityId: $scope.communityData.address.guid,
                    serial: cardNumber
                };
                $.ajax({
                    type: 'put',
                    url: 'Cards',
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(addCardData)
                }).done(function (data) {
                    if (!data.id) {
                        $(".speedyAddNumber").text("添加失败!");
                        $timeout(function () {
                            $scope.speedyAddCardInfo = false;
                            $timeout(function () {
                                $scope.speedyAddCardInfo = true;
                            },2000)
                        });
                    } else {
                        $timeout(function () {
                            $scope.speedyAddCardSuccessList.unshift(cardNumber);
                            $("#speedyAddCard_input").val("");
                            data.auth = [];
                            $scope.communityData.card.unshift(data);
                            $scope.card_viewData.unshift(data);
                        });
                    }
                }).fail(function (err) {
                    console.log(err);
                });

            }
        };
        //正常添加卡
        $scope.addCard = function (cardNumber, cardPersonnel) {
            if (!cardNumber) {
                $scope.addCardNumberValidate = false;
                $timeout(function () {
                    $scope.addCardNumberValidate = true;
                }, 3000);
                $(".addNumber").text("请填写卡号！");
                return;
            }
            if (cardNumber.length < 8) {
                $scope.addCardNumberValidate = false;
                $timeout(function () {
                    $scope.addCardNumberValidate = true;
                }, 3000);
                $(".addNumber").text("卡号需要大于8位！");
                return;
            }
            if (!validateCardNumber(cardNumber)) {
                $scope.addCardNumberValidate = false;
                $timeout(function () {
                    $scope.addCardNumberValidate = true;
                }, 3000);
                $(".addNumber").text("卡号不符合规则！");
                return;
            }
            if ($scope.communityData.card.some(function (t) {
                return t.serial === cardNumber;
            })) {
                $scope.addCardNumberValidate = false;
                $timeout(function () {
                    $scope.addCardNumberValidate = true;
                }, 3000);
                $(".addNumber").text("卡号重复！");
                return;
            }
            if (!cardPersonnel) {
                $scope.addcardPersonnelsValidate = false;
                $timeout(function () {
                    $scope.addcardPersonnelsValidate = true;
                }, 3000);
                $(".addCardPersonnels").text("请选择持卡人！");
                return;
            }
            var addCardData = {
                communityId: $scope.communityData.address.guid,
                serial: cardNumber,
                nric: cardPersonnel
            };
            $.ajax({
                type: 'put',
                url: 'Cards',
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(addCardData)
            }).done(function (data) {
                if (!data.id) {
                    $(".addCardcomplete").text("添加失败，请查看卡号是否重复!");
                    $timeout(function () {
                        $scope.addCardcomplete = false;
                    });
                } else {
                    $(".addCardcomplete").text("添加成功");
                    $timeout(function () {
                        $scope.addCardcomplete = false;
                        data.auth = [];
                        $scope.communityData.card.unshift(data);
                        $scope.card_viewData.unshift(data);
                    });
                }
                $timeout(function () {
                    $scope.addCardcomplete = true;
                }, 3000)
            }).fail(function (err) {
                console.log(err);
            });
        };
        //选定卡
        var lastTimeCard;
        var thisTimeCard;
        $scope.chooseCard = function (index,event,card) {
            var $target = $("#" + index);
            if (event.shiftKey){
                thisTimeCard = Number(index);
                if (lastTimeCard !== undefined){
                    if (thisTimeCard>lastTimeCard){
                        for (var i=lastTimeCard;i<=thisTimeCard;i++){
                            $("#"+i).attr('checked', true);
                            $("#"+i).parent().parent().addClass("bg-success");
                        }
                    }else {
                        for (var i=thisTimeCard;i<=lastTimeCard;i++){
                            $("#"+i).attr('checked', true);
                            $("#"+i).parent().parent().addClass("bg-success");
                        }
                    }
                    lastTimeCard = Number(index);
                    document.getSelection().empty();
                }else {
                    $target.attr('checked', true);
                    $target.parent().parent().addClass("bg-success");
                    lastTimeCard = Number(index);
                }
            }else {
                if ($target.is(':checked')) {
                    $target.attr('checked', false);
                    $target.parent().parent().removeClass("bg-success");
                    lastTimeCard = Number(index);
                } else {
                    $target.attr('checked', true);
                    $target.parent().parent().addClass("bg-success");
                    lastTimeCard = Number(index);
                }
            }
            var selectCardList = []; //选择卡的列表
            var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            angular.forEach(selectCard, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectCardList.push(itemValue);
            });
            if (selectCardList.length === 0){
                $scope.tobe_editCardList = [];
                $scope.cardEdit_show = false;
            }else {
                if (selectCardList.every(function (value) {
                        return value.auth.length === 0
                    })){
                    $scope.tobe_editCardList = selectCardList;
                    $scope.cardEdit_show = true;
                }else {
                    $scope.tobe_editCardList = [];
                    $scope.cardEdit_show = false;
                }
            }
            $scope.ChooseauthDevice = unAuthDeviceFilterGenerator(selectCardList, $scope.communityData.device);
            $scope.alreadyAuth = authDeviceFilterGenerator(selectCardList);
        };
        //全选卡
        $scope.selectAllCard = function () {
           var cardAll = $("input:checkbox[name='chooseAuthCard']");
           cardAll.attr('checked', true);
           cardAll.parent().parent().addClass("bg-success");
            var selectCardList = []; //选择卡的列表
            var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            angular.forEach(selectCard, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectCardList.push(itemValue);
            });
            if (selectCardList.every(function (value) {
                    return value.auth.length === 0
                })){
                $scope.tobe_editCardList = selectCardList;
                $scope.cardEdit_show = true;
            }else {
                $scope.tobe_editCardList = [];
                $scope.cardEdit_show = false;
            }
            $scope.ChooseauthDevice = unAuthDeviceFilterGenerator(selectCardList, $scope.communityData.device);
            $scope.alreadyAuth = authDeviceFilterGenerator(selectCardList);
        };
        //取消选择卡
        $scope.selectAllCard_not = function () {
            var cardAll = $("input:checkbox[name='chooseAuthCard']");
            cardAll.attr('checked', false);
            cardAll.parent().parent().removeClass("bg-success");
            var selectCardList = []; //选择卡的列表
            var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            angular.forEach(selectCard, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectCardList.push(itemValue);
            });
            $scope.tobe_editCardList = [];
            $scope.cardEdit_show = false;
            $scope.ChooseauthDevice = unAuthDeviceFilterGenerator(selectCardList, $scope.communityData.device);
            $scope.alreadyAuth = authDeviceFilterGenerator(selectCardList);
        };
        $scope.selectBinding = function () {
            if ($("#alreadyBindingAuth").is(':checked')) {
                $scope.alreadyBinding = true;
            } else {
                $scope.alreadyBinding = false;
            }
        };
        //编辑按钮默认不显示
        $scope.cardEdit_show = false;
        $scope.editCardcomplete= true;
        //打开编辑卡
        $scope.tobe_editCardSerial = "";
        $scope.selectCard_Edit = function () {
            console.log($scope.tobe_editCardList);
            if ($scope.tobe_editCardList.length === 1){
                if ($scope.tobe_editCardList[0].nric){
                    var editCardRooms = $filter("nricTorooms")($scope.tobe_editCardList[0].nric, $scope.communityData.personnel);
                    $scope.editCard_address = $filter("roomsTobuildingObj")(editCardRooms[0], $scope.communityData.address);
                    $scope.editCard_address.nric = $scope.tobe_editCardList[0].nric;
                    $scope.roomPersonnel($scope.editCard_address.room);
                }else {
                    $scope.roomPersonnel();
                    $scope.editCard_address = {};
                }
            }else {
                $scope.roomPersonnel();
                $scope.editCard_address = {};
            }
            $scope.tobe_editCardList.forEach(function (value) {
                $scope.tobe_editCardSerial = $scope.tobe_editCardSerial+value.serial+"；";
            });
        };
        //编辑卡
        $scope.editCard = function (nric) {
            for(var i=0;i<$scope.tobe_editCardList.length;i++){
                (function (editData) {
                    var cardData = {
                        id: editData.id,
                        serial:editData.serial,
                        nric:nric,
                        communityId: editData.communityId
                    };
                    $.ajax({
                        type: 'put',
                        url: 'Cards',
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify(cardData)
                    }).done(function (data) {
                        if (!data.id) {
                            $(".editCardcomplete").text(editData.serial + "编辑失败!");
                            $timeout(function () {
                                $scope.editCardcomplete = false;
                            });
                        } else {
                            $(".editCardcomplete").text(data.serial + "提交成功");
                            $timeout(function () {
                                $scope.editCardcomplete = false;
                                data.auth = [];
                                var lengthCardCom = $scope.communityData.card.length;
                                var lengthCardView = $scope.card_viewData.length;
                                for(var i=0;i<lengthCardCom;i++){
                                    if ($scope.communityData.card[i].id === data.id){
                                        $scope.communityData.card[i].nric = data.nric;
                                        break;
                                    }
                                }
                                for (i=0;i<lengthCardView;i++){
                                    if ($scope.card_viewData[i].id === data.id){
                                        $scope.card_viewData[i].nric = data.nric;
                                        break;
                                    }
                                }
                            });
                        }
                        $timeout(function() {
                                $scope.editCardcomplete = true;
                            },
                            2000);
                    }).fail(function (err) {
                        console.log(err);
                    });
                })($scope.tobe_editCardList[i])
            }
        };
        //删除卡
        $scope.deleteCard = function () {
            var selectCardList = []; //选择卡的列表
            var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            angular.forEach(selectCard, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectCardList.push(itemValue);
            });
            if (selectCardList.length === 0) {
                return;
            }
            var sure = confirm("你确定删除这" + selectCardList.length + "张卡吗？");
            if (!sure) {
                return;
            }
            for (var i = 0; i < selectCardList.length; i++) {
                if (selectCardList[i].auth.length === 0) {
                    deleteCardGenerator(selectCardList[i]);
                } else {
                    sure = confirm("卡号:" + selectCardList[i].serial + "因有授权无法删除！是否继续删除剩余卡？");
                    if (!sure) {
                        break;
                    }
                }
            }

            function deleteCardGenerator(carddata) {
                $.ajax({
                    type: 'DELETE',
                    url: 'Cards',
                    data: JSON.stringify(carddata),
                    contentType: 'application/json; charset=utf-8'
                }).done(function (data) {
                    $timeout(function () {
                        $scope.communityData.card.forEach(function (item, index) {
                            if (item.id === carddata.id) {
                                $scope.communityData.card.splice(index, 1);
                            }
                        });
                        $scope.card_viewData.forEach(function (item, index) {
                            if (item.id === carddata.id) {
                                $scope.card_viewData.splice(index, 1);
                            }
                        })
                    });
                }).fail(function (err) {
                    console.log(err);
                });
            }
        };
        //授权生成器
        function authGenerator(cardList, deviceList, $time, $binding) {
            var i = 0; //门口机
            var j = 0; //卡
            function getNext(value) {
                if (value) {
                    if (j < cardList.length) {
                        auth(i, j++);
                    } else {
                        if (++i < deviceList.length) {
                            j = 0;
                            auth(i, j++);
                        }
                    }

                } else {
                    if (++i < deviceList.length) {
                        j = 0;
                        auth(i, j++);
                    }
                }
            }

            function auth(i, j) {
                var subData = {
                    deviceId: deviceList[i],
                    expire: $time,
                    binding: $binding

                };
                $.ajax({
                    type: 'put',
                    url: 'Cards/' + cardList[j],
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(subData)
                }).done(function (data) {
                    var value = data.errorCode === 70000003 || data.result;
                    if (data.result) {
                        $timeout(function() {
                            $scope.communityData.card.forEach(function(t) {
                                if (t.id === cardList[j]) {
                                    t.auth.push({
                                        deviceId: deviceList[i],
                                        expire: $time,
                                        binding: $binding
                                    });
                                }
                            });
                        });
                    }
                    if (value) {
                        if (j === 0) {
                            $scope.authCompleteinfo.push({
                                device: deviceList[i],
                                success: [cardList[j]]
                            });
                        } else {
                            $scope.authCompleteinfo[i].success.push(cardList[j]);
                        }
                    } else {
                        if (j === 0) {
                            $scope.authCompleteinfo.push({
                                device: deviceList[i],
                                fail: cardList.slice(j),
                                message: data.message
                            });
                        } else {
                            $scope.authCompleteinfo[i].fail = cardList.slice(j);
                            $scope.authCompleteinfo[i].message = data.message
                        }
                    }
                    if (i === deviceList.length - 1) {
                        if (!value || j === cardList.length - 1) {
                            $timeout(function() {
                                var selectCardList = []; //选择卡的列表
                                var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
                                angular.forEach(selectCard,
                                    function(item) {
                                        var itemValue = angular.fromJson(item.value);
                                        selectCardList.push(itemValue);
                                    });
                                $scope.ChooseauthDevice =
                                    unAuthDeviceFilterGenerator(selectCardList, $scope.communityData.device);
                                $scope.alreadyAuth = authDeviceFilterGenerator(selectCardList);
                            });
                        }
                    }
                    getNext(value);
                }).fail(function (err) {
                    console.log(err);
                });
            }
            return {
                getNext: getNext,
                auth: auth
            }
        }
        //授权
        //是否选择时间
        $scope.alreadyTime = false;
        $scope.validityTimeDefault = function () {
            if ($("#alreadyTimeAuth").is(':checked')){
                var nowDate = new Date().format("yyyy-MM-dd");
                nowDate = nowDate+"T"+"00:00";
                $("#validityTime").val(nowDate);
            }
        };
        //是否选择绑定房号
        $scope.alreadyBinding = false;
        $scope.authCardToDevice = function () {
            var authCardList = [];
            var authDeviceList = [];
            var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            angular.forEach(selectCard, function (item) {
                var itemValue = angular.fromJson(item.value);
                if (itemValue.nric){
                    authCardList.push(itemValue.id);
                }
            });
            if (authCardList.length === 0) {
                alert("请选择授权卡");
                return;
            }
            var selectDevice = angular.element("input:checkbox[name='chooseAuthDevice']:checked");
            angular.forEach(selectDevice, function (item) {
                var itemValue = angular.fromJson(item.value);
                authDeviceList.push(itemValue.id);
            });
            if (authDeviceList.length === 0) {
                alert("请选择设备");
                return;
            }
            var $time;
            var $binding;
            if ($("#alreadyTimeAuth").is(':checked')) {
                $time = (new Date($("#validityTime").val()).getTime()) / 1000;
            } else {
                $time = undefined;
            }
            if ($("#alreadyBindingAuth").is(':checked') && !$scope.chooseBinding) {
                $binding = $("#bindingRoomAddress").val();
            } else {
                $binding = undefined;
            }
            $scope.authCompleteinfo = [];
            authGenerator(authCardList, authDeviceList, $time, $binding).getNext(true);
        };
        //取消授权
        $scope.deleteAuthCard = function () {
            var authCardList = [];
            var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            angular.forEach(selectCard, function (item) {
                var itemValue = angular.fromJson(item.value);
                authCardList.push(itemValue.id);
            });
            if (authCardList.length === 0) {
                alert("请选择卡");
                return;
            }
            var unAuthDeviceList = [];
            var unAuthDevice = angular.element("input:checkbox[name='chooseAlreadyAuth']:checked");
            angular.forEach(unAuthDevice, function (item) {
                var itemValue = angular.fromJson(item.value);
                unAuthDeviceList.push(itemValue.deviceId);
            });

            function unauthGenerator(cardList, deviceList) {
                var i = 0; //门口机
                var j = 0; //卡
                function getNext(value) {
                    if (value) {
                        if (j < cardList.length) {
                            auth(i, j++);
                        } else {
                            if (++i < deviceList.length) {
                                j = 0;
                                auth(i, j++);
                            }
                        }

                    } else {
                        if (++i < deviceList.length) {
                            j = 0;
                            auth(i, j++);
                        }
                    }
                }

                function auth(i, j) {
                    var subData = {
                        deviceId: deviceList[i]
                    };
                    $.ajax({
                        type: 'delete',
                        url: 'Cards/' + cardList[j],
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify(subData)
                    }).done(function (data) {
                        if (data.result) {
                            $timeout(function() {
                                $scope.communityData.card.forEach(function(t) {
                                    if (t.id === cardList[j]) {
                                        t.auth.forEach(function(t2, index) {
                                            if (t2.deviceId === deviceList[i]) {
                                                t.auth.splice(index, 1);
                                            }
                                        });
                                    }
                                });
                            });
                        }
                        if (data.result) {
                            if (j === 0) {
                                $scope.authCompleteinfo.push({
                                    device: deviceList[i],
                                    success: [cardList[j]]
                                });
                            } else {
                                $scope.authCompleteinfo[i].success.push(cardList[j]);
                            }
                        } else {
                            if (j === 0) {
                                $scope.authCompleteinfo.push({
                                    device: deviceList[i],
                                    fail: cardList.slice(j),
                                    message: data.message
                                });
                            } else {
                                $scope.authCompleteinfo[i].fail = cardList.slice(j);
                                $scope.authCompleteinfo[i].message = data.message;
                            }
                        }
                        if (i === deviceList.length - 1) {
                            if (!data.result || j === cardList.length - 1) {
                                $timeout(function() {
                                    var selectCardList = []; //选择卡的列表
                                    var selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
                                    angular.forEach(selectCard,
                                        function(item) {
                                            var itemValue = angular.fromJson(item.value);
                                            selectCardList.push(itemValue);
                                        });
                                    $scope.ChooseauthDevice =
                                        unAuthDeviceFilterGenerator(selectCardList, $scope.communityData.device);
                                    $scope.alreadyAuth = authDeviceFilterGenerator(selectCardList);
                                });
                            }
                        }
                        getNext(data.result);
                    }).fail(function (err) {
                        console.log(err);
                    });
                }
                return {
                    getNext: getNext,
                    auth: auth
                }
            }
            $scope.authCompleteinfo = [];
            unauthGenerator(authCardList, unAuthDeviceList).getNext(true);
        };
        //卡片查询过滤器
        $scope.cardFilter = function (str) {
            if (!str) {
                $scope.card_viewData = $scope.communityData.card.slice(0);
                return;
            }
            var filterData = [];
            $scope.communityData.card.forEach(function (item) {
                for (var prop in item) {
                    if (prop === "serial") {
                        if (item[prop].indexOf(str) !== -1) {
                            filterData.push(item);
                            break;
                        }
                    }
                    if (prop === "nric") {
                        if (item[prop].indexOf(str) !== -1) {
                            filterData.push(item);
                            break;
                        } else {
                            if ($filter("nricToname")(item[prop], $scope.communityData.personnel).indexOf(str) !== -1) {
                                filterData.push(item);
                                break;
                            }
                        }
                    }
                }
            });
            $scope.card_viewData = filterData;
        };
        /*门禁卡管理结束*/

        /*指纹管理开始*/
        //手指是否已经录入提醒是否显示
        $scope.chooseFingersInfoHide = true;
        //手指数据
        $scope.FingerConstans = [{
                id: 6,
                name: "右手拇指"
            },
            {
                id: 7,
                name: "右手食指"
            },
            {
                id: 8,
                name: "右手中指"
            },
            {
                id: 9,
                name: "右手无名指"
            },
            {
                id: 10,
                name: "右手小指"
            },
            {
                id: 1,
                name: "左手拇指"
            },
            {
                id: 2,
                name: "左手食指"
            },
            {
                id: 3,
                name: "左手中指"
            },
            {
                id: 4,
                name: "左手无名指"
            },
            {
                id: 5,
                name: "左手小指"
            }
        ];
        //已经添加过
        var fingeradded = [];
        //切换手指初始化指纹输入
        $scope.chooseFingerConstans = function (finger) {
            if (fingeradded.some(function (t) {
                    return t.finger === Number(finger);
                })) {
                $scope.chooseFingersInfoHide = false;
            } else {
                $scope.chooseFingersInfoHide = true;
            }
            fingerReadCtrl.reset();
            $("#fingerprint1").attr("src", "images/scanfinger1.png");
            $("#fingerprint2").attr("src", "images/scanfinger2.png");
            $("#fingerprint3").attr("src", "images/scanfinger3.png");
        };
        //获取用户已经保存的指纹
        $scope.getUserFingerprints = function (user) {
            if (!user) {
                return;
            }
            $.get("Fingerprints/" + JSON.parse(user).nric,
                function(data) {
                    fingeradded = data;
                    console.log(data);
                    console.log($scope.communityData.Fingerprints);
                });

        };
        //是否已经有指纹信息
        $scope.chooseFinger = function (finger) {
            if (!finger) {
                return finger;
            }
            if (fingeradded.some(function (t) {
                return t.finger === finger.id;
            })) {
                return "text-success";
            } else {
                return "text-danger";
            }

        };
        //打开添加指纹
        var fingerSocket;
        var fingerReadCtrl = (function () {
            var order = true;
            var images = [];

            function ctrl(imgObj) {
                if (order) {
                    console.log("请按重新采集");
                    return;
                }
                if (imgObj.index === 0) {
                    $("#fingerprint1").attr("src", "data:image/png;base64," + imgObj.data.image);
                    images.push(imgObj);
                }
                if (imgObj.index === 1) {
                    $("#fingerprint2").attr("src", "data:image/png;base64," + imgObj.data.image);
                    images.push(imgObj);
                }
                if (imgObj.index === 2) {
                    $("#fingerprint3").attr("src", "data:image/png;base64," + imgObj.data.image);
                    images.push(imgObj);
                }
                if (imgObj.errcode === 0) {
                    images.push(imgObj);
                    $("#FingersInfo").text("采集成功，请保存！").removeClass("text-danger").addClass("text-success");
                    order = true;
                }
                if (imgObj.errcode === -1) {
                    fingerSocket.send(JSON.stringify({
                        command: "reset"
                    }));
                    reset();
                    $("#FingersInfo").text("采集失败，请重新采集！").removeClass("text-success").addClass("text-danger");
                    $("#fingerprint1").attr("src", "images/scanfinger1.png");
                    $("#fingerprint2").attr("src", "images/scanfinger2.png");
                    $("#fingerprint3").attr("src", "images/scanfinger3.png");
                }
            }

            function reset() {
                order = false;
                images = [];
                if (!$scope.websocketIsready){
                    $("#FingersInfo").text("指纹服务连接成功!").removeClass("text-danger").addClass("text-success");
                }else {
                    $("#FingersInfo").text("指纹服务连接失败，请查看是否启动服务或重新打开模块！").removeClass("text-success").addClass("text-danger");
                }
            }

            function getImages() {
                return images;
            }
            return {
                ctrl: ctrl,
                reset: reset,
                getImages: getImages
            }
        }());
        $scope.openAddFinger = function () {
            $("#addFinger").modal('show');
            /*if ('WebSocket' in window){
                fingerSocket = new WebSocket("ws://localhost:5018/");
            } else if ('MozWebSocket' in window){
                fingerSocket = new MozWebSocket("ws://localhost:5018/");
            }
            else{
                alert("不支持WebSocket");
                return;
            }*/
            fingerSocket = new WebSocket("ws://localhost:5018/");
            fingerSocket.onerror = function (event) {
                $timeout(function () {
                    $scope.websocketIsready = true;
                });
                $("#FingersInfo").text("指纹服务连接失败，请查看是否启动服务或重新打开模块！").removeClass("text-success").addClass("text-danger");
                $("#fingerprint1").attr("src", "images/scanfinger1.png");
                $("#fingerprint2").attr("src", "images/scanfinger2.png");
                $("#fingerprint3").attr("src", "images/scanfinger3.png");
            };
            fingerSocket.onopen = function () {
                $timeout(function () {
                    $scope.websocketIsready = false;
                });
                fingerSocket.send(JSON.stringify({
                    command: "reset"
                }));
                fingerReadCtrl.reset();
                $("#FingersInfo").text("指纹服务连接成功！").removeClass("text-danger").addClass("text-success");
                $("#fingerprint1").attr("src", "images/scanfinger1.png");
                $("#fingerprint2").attr("src", "images/scanfinger2.png");
                $("#fingerprint3").attr("src", "images/scanfinger3.png");
            };
            fingerSocket.onclose = function () {
                $timeout(function () {
                    $scope.websocketIsready = true;
                });
                $("#FingersInfo").text("指纹服务连接失败，请查看是否启动服务或重新打开模块！").removeClass("text-success").addClass("text-danger");
            };
            fingerSocket.onmessage = function (event) {
                var message = JSON.parse(event.data);
                fingerReadCtrl.ctrl(message);
            }

        };
        //重置指纹读取
        $scope.resetFinger = function () {
            fingerSocket.send(JSON.stringify({
                command: "reset"
            }));
            fingerReadCtrl.reset();
            $("#fingerprint1").attr("src", "images/scanfinger1.png");
            $("#fingerprint2").attr("src", "images/scanfinger2.png");
            $("#fingerprint3").attr("src", "images/scanfinger3.png");
        };
        //关闭添加指纹
        $scope.closeAddFinger = function () {
            $("#addFinger").modal('hide');
            fingerSocket.close();
        };
        //添加指纹
        $scope.addFinger = function (finger, user) {
            if (!finger) {
                alert("请选择手指");
                return;
            }
            if (!user) {
                alert("请选择用户！");
                return;
            }
            if (fingerReadCtrl.getImages().length !== 4) {
                if (fingeradded.some(function (t) {
                        return t.finger === Number(finger);
                    })) {
                    var subData = {
                        communityId: $scope.communityData.address.guid
                    };
                    for (var i = 0; i < fingeradded.length; i++) {
                        if (fingeradded[i].finger === Number(finger)) {
                            subData.id = fingeradded[i].id;
                            break;
                        }
                    }
                    if ($scope.communityData.Fingerprints.some(function (t) {
                        return t.id === subData.id;
                    })) {
                        $("#FingersInfo").text("已经绑定该小区").removeClass("text-danger").addClass("text-success");
                        $timeout(function () {
                            $scope.resetFinger();
                        }, 1000);
                    } else {
                        $.ajax({
                            type: 'put',
                            url: 'Fingerprints/Bind',
                            contentType: 'application/json; charset=utf-8',
                            data: JSON.stringify(subData)
                        }).done(function (data) {
                            if (data) {
                                $("#FingersInfo").text("保存成功").removeClass("text-danger").addClass("text-success");
                                var addData = {
                                    auth: [],
                                    finger: Number(finger),
                                    id: subData.id,
                                    nric: JSON.parse(user).nric
                                };
                                $timeout(function () {
                                    $scope.resetFinger();
                                }, 1000);
                                $timeout(function () {
                                    $scope.communityData.Fingerprints.unshift(addData);
                                    $scope.fingerprint_viewData.unshift(addData);
                                });
                            } else {
                                $("#FingersInfo").text("保存失败").removeClass("text-success").addClass("text-danger");
                            }

                        }).fail(function (err) {
                            console.log(err);
                        });
                    }
                } else {
                    alert("请采集指纹");
                    return;
                }
            } else {
                var subData = {
                    feature: fingerReadCtrl.getImages()[3].data.feature,
                    image: fingerReadCtrl.getImages()[0].data.image,
                    width: fingerReadCtrl.getImages()[0].data.width,
                    height: fingerReadCtrl.getImages()[0].data.height,
                    communityId: $scope.communityData.address.guid,
                    nric: JSON.parse(user).nric,
                    finger: finger
                };
                $.ajax({
                    type: 'put',
                    url: 'Fingerprints',
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(subData)
                }).done(function (data) {
                    $("#FingersInfo").text("保存成功").removeClass("text-danger").addClass("text-success");
                    data.auth = [];
                    $timeout(function () {
                        $scope.resetFinger();
                    }, 1000);
                    var haveuser = $scope.communityData.Fingerprints.filter(function(item) {
                        return item.nric === data.nric;
                    });
                    if(haveuser.length === 0){
                        $timeout(function () {                 
                            $scope.communityData.Fingerprints.unshift(data);
                            $scope.fingerprint_viewData.unshift(data);
                        });
                    }else {
                        var havefinger = haveuser.filter(function(item) {
                            return item.finger === data.finger;
                        });
                        if(havefinger === 0){
                            $timeout(function () {                 
                                $scope.communityData.Fingerprints.push(data);
                                $scope.fingerprint_viewData.push(data);
                            });
                        }else{
                            console.log(havefinger);

                            $timeout(function() {
                                console.log($scope.communityData.Fingerprints);
                                console.log($scope.fingerprint_viewData);
                                havefinger[0].id = data.id;
                                console.log($scope.communityData.Fingerprints);
                                console.log($scope.fingerprint_viewData);
                            });
                        }
                    }
                }).fail(function (err) {
                    console.log(err);
                });
            }
        };
        //选定指纹
        var thisTimeFinger;
        var lastTimeFinger;
        $scope.chooseFingerprint = function (index,event,fingerprint) {
            var $target = $("#" + index);
            if (event.shiftKey){
                thisTimeFinger = Number(index);
                if (lastTimeFinger !== undefined){
                    if (thisTimeFinger>lastTimeFinger){
                        for (var i=lastTimeFinger;i<=thisTimeFinger;i++){
                            $("#"+i).attr('checked', true);
                            $("#"+i).parent().parent().addClass("bg-success");
                        }
                    }else {
                        for (var i=thisTimeFinger;i<=lastTimeFinger;i++){
                            $("#"+i).attr('checked', true);
                            $("#"+i).parent().parent().addClass("bg-success");
                        }
                    }
                    lastTimeFinger = Number(index);
                    document.getSelection().empty();
                }else {
                    $target.attr('checked', true);
                    $target.parent().parent().addClass("bg-success");
                    lastTimeFinger = Number(index);
                }
            }else {
                if ($target.is(':checked')) {
                    $target.attr('checked', false);
                    $target.parent().parent().removeClass("bg-success");
                    lastTimeFinger = Number(index);
                } else {
                    $target.attr('checked', true);
                    $target.parent().parent().addClass("bg-success");
                    lastTimeFinger = Number(index);
                }
            }
            var selectfingerprintList = []; //选择的列表
            var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            angular.forEach(selectfingerprint, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectfingerprintList.push(itemValue);
            });
            $scope.alreadyAuthFingerprint = authDeviceFilterGenerator(selectfingerprintList);
            $scope.unalreadyAuthFingerprint = unAuthDeviceFilterGenerator(selectfingerprintList, $scope.communityData.device);
        };
        //全选指纹
        $scope.selectAllFingerprint = function () {
            var cardAll = $("input:checkbox[name='chooseAuthFingerprint']");
            cardAll.attr('checked', true);
            cardAll.parent().parent().addClass("bg-success");
            var selectfingerprintList = []; //选择卡的列表
            var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            angular.forEach(selectfingerprint, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectfingerprintList.push(itemValue);
            });
            $scope.alreadyAuthFingerprint = authDeviceFilterGenerator(selectfingerprintList);
            $scope.unalreadyAuthFingerprint = unAuthDeviceFilterGenerator(selectfingerprintList, $scope.communityData.device);
        };
        //取消选择指纹
        $scope.selectAllfingerprint_not = function () {
            var cardAll = $("input:checkbox[name='chooseAuthFingerprint']");
            cardAll.attr('checked', false);
            cardAll.parent().parent().removeClass("bg-success");
            var selectfingerprintList = []; //选择卡的列表
            var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            angular.forEach(selectfingerprint, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectfingerprintList.push(itemValue);
            });
            $scope.alreadyAuthFingerprint = authDeviceFilterGenerator(selectfingerprintList);
            $scope.unalreadyAuthFingerprint = unAuthDeviceFilterGenerator(selectfingerprintList, $scope.communityData.device);
        };

        //删除指纹
        $scope.deletefingerprint = function () {
            var selectfingerprintList = []; //选择卡的列表
            var selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            angular.forEach(selectfingerprint, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectfingerprintList.push(itemValue);
            });
            if (selectfingerprintList.length === 0) {
                return;
            }
            var sure = confirm("你确定删除这" + selectfingerprintList.length+ "个指纹吗？");
            if (!sure) {
                return;
            }
            for (var i = 0; i < selectfingerprintList.length; i++) {
                if (selectfingerprintList[i].auth.length === 0) {
                    deleteFingerprintGenerator(selectfingerprintList[i]);
                } else {
                    sure = confirm("指纹:" + $filter("nricToname")(selectfingerprintList[i].nric, $scope.communityData.personnel) + $filter("fingerFilter")(selectfingerprintList[i].finger) + "的指纹因有授权无法删除！是否继续删除剩余指纹？");
                    if (!sure) {
                        break;
                    }
                }
            }

            function deleteFingerprintGenerator(fingerprintdata) {
                var deleteData = {
                    communityId: $scope.communityData.address.guid,
                    id: fingerprintdata.id
                };
                $.ajax({
                    type: 'DELETE',
                    url: 'Fingerprints',
                    data: JSON.stringify(deleteData),
                    contentType: 'application/json; charset=utf-8'
                }).done(function (data) {
                    $timeout(function () {
                        $scope.communityData.Fingerprints.forEach(function (item, index) {
                            if (item.id === fingerprintdata.id) {
                                $scope.communityData.Fingerprints.splice(index, 1);
                            }
                        });
                        $scope.fingerprint_viewData.forEach(function (item, index) {
                            if (item.id === fingerprintdata.id) {
                                $scope.fingerprint_viewData.splice(index, 1);
                            }
                        });
                    });
                }).fail(function (err) {
                    console.log(err);
                });
            }
        };

        function fingerprintAuthGenerator(fingerprintList, deviceList, $time, $binding) {
            var i = 0; //门口机
            var j = 0; //指纹
            function getNext(value) {
                if (value) {
                    if (j < fingerprintList.length) {
                        auth(i, j++);
                    } else {
                        if (++i < deviceList.length) {
                            j = 0;
                            auth(i, j++);
                        }
                    }
                } else {
                    if (++i < deviceList.length) {
                        j = 0;
                        auth(i, j++);
                    }
                }
            }

            function auth(i, j) {
                var subData = {
                    deviceId: deviceList[i],
                    expire: $time,
                    binding: $binding
                };
                $.ajax({
                    type: 'put',
                    url: 'Fingerprints/' + fingerprintList[j],
                    contentType: 'application/json; charset=utf-8',
                    data: JSON.stringify(subData)
                }).done(function (data) {
                    var value = data.errorCode === 70000003 || data.errorCode === 24 || data.result;
                    if (data.result) {
                        $timeout(function() {
                            $scope.communityData.Fingerprints.forEach(function(t) {
                                if (t.id === fingerprintList[j]) {
                                    t.auth.push({
                                        deviceId: deviceList[i],
                                        expire: $time,
                                        binding: $binding
                                    });
                                }
                            });
                        });
                    }
                    if (data.errorCode === 70000003 || data.result) {
                        if (j === 0) {
                            $scope.authCompleteinfo.push({
                                device: deviceList[i],
                                success: [fingerprintList[j]]
                            })
                        } else {
                            if ($scope.authCompleteinfo[i].success) {
                                $scope.authCompleteinfo[i].success.push(fingerprintList[j]);
                            } else {
                                $scope.authCompleteinfo.push({
                                    device: deviceList[i],
                                    success: [fingerprintList[j]]
                                });
                            }
                        }
                    } else {
                        if (data.errorCode === 24) {
                            if (j === 0) {
                                $scope.authCompleteinfo.push({
                                    device: deviceList[i],
                                    fail: fingerprintList.slice(j, j + 1),
                                    message: data.message
                                });
                            } else {
                                if ($scope.authCompleteinfo[i].fail) {
                                    $scope.authCompleteinfo[i].fail.push(fingerprintList.slice(j, j + 1)[0]);
                                } else {
                                    $scope.authCompleteinfo.push({
                                        device: deviceList[i],
                                        fail: [fingerprintList[j]]
                                    });
                                }

                            }
                        } else {
                            if (j === 0) {
                                $scope.authCompleteinfo.push({
                                    device: deviceList[i],
                                    fail: fingerprintList.slice(j),
                                    message: data.message
                                });
                            } else {
                                $scope.authCompleteinfo[i].fail.concat(fingerprintList.slice(j));
                                $scope.authCompleteinfo[i].message = data.message;
                            }
                        }
                    }
                    if (i === deviceList.length - 1) {
                        if (!value || j === fingerprintList.length - 1) {
                            $timeout(function() {
                                /*更新授权和未授权门口机列表*/
                                var selectfingerprintList = []; //选择指纹的列表
                                var selectfingerprint =
                                    angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
                                angular.forEach(selectfingerprint,
                                    function(item) {
                                        var itemValue = angular.fromJson(item.value);
                                        selectfingerprintList.push(itemValue);
                                    });
                                $scope.alreadyAuthFingerprint = authDeviceFilterGenerator(selectfingerprintList);
                                $scope.unalreadyAuthFingerprint =
                                    unAuthDeviceFilterGenerator(selectfingerprintList, $scope.communityData.device);
                            });
                        }
                    }
                    getNext(value);
                }).fail(function (err) {
                    console.log(err);
                });
            }
            return {
                getNext: getNext,
                auth: auth
            }
        }
        //授权指纹到门口机
        $scope.authFingerprintToDevice = function () {
            var authFingerprintList = [];
            var authDeviceList = [];
            var selectFingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            angular.forEach(selectFingerprint, function (item) {
                var itemValue = angular.fromJson(item.value);
                authFingerprintList.push(itemValue.id);
            });
            if (authFingerprintList.length === 0) {
                alert("请选择授权指纹");
                return;
            }
            var selectDevice = angular.element("input:checkbox[name='chooseAuthDevice']:checked");
            angular.forEach(selectDevice, function (item) {
                var itemValue = angular.fromJson(item.value);
                authDeviceList.push(itemValue.id);
            });
            if (authDeviceList.length === 0) {
                alert("请选择设备");
                return;
            }
            var $time;
            var $binding;
            if ($("#alreadyTimeAuth").is(':checked')) {
                $time = (new Date($("#validityTime").val()).getTime()) / 1000;
            } else {
                $time = undefined;
            }
            if ($("#alreadyBindingAuth").is(':checked') && !$scope.chooseBinding) {
                $binding = $("#bindingRoomAddress").val();
            } else {
                $binding = undefined;
            }
            $scope.authCompleteinfo = [];
            fingerprintAuthGenerator(authFingerprintList, authDeviceList, $time, $binding).getNext(true);
        };
        //取消授权指纹
        $scope.deleteAuthfingerprint = function () {
            var unAuthDeviceList = [];
            var authFingerprintList = [];
            var selectFingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            angular.forEach(selectFingerprint, function (item) {
                var itemValue = angular.fromJson(item.value);
                authFingerprintList.push(itemValue.id);
            });
            var unAuthDevice = angular.element("input:checkbox[name='chooseAlreadyAuth']:checked");
            angular.forEach(unAuthDevice, function (item) {
                var itemValue = angular.fromJson(item.value);
                unAuthDeviceList.push(itemValue.deviceId);
            });
            if (authFingerprintList.length === 0 || unAuthDeviceList.length === 0) {
                return;
            }

            function unauthGenerator(fingerprintList, deviceList) {
                var i = 0; //门口机
                var j = 0; //指纹
                function getNext(value) {
                    if (value) {
                        if (j < fingerprintList.length) {
                            auth(i, j++);
                        } else {
                            if (++i < deviceList.length) {
                                j = 0;
                                auth(i, j++);
                            }
                        }

                    } else {
                        if (++i < deviceList.length) {
                            j = 0;
                            auth(i, j++);
                        }
                    }
                }

                function auth(i, j) {
                    var subData = {
                        deviceId: deviceList[i]
                    };
                    $.ajax({
                        type: 'delete',
                        url: 'Fingerprints/' + fingerprintList[j],
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify(subData)
                    }).done(function (data) {
                        var value = data.errorCode === 70000003 || data.result;
                        if (data.result) {
                            $timeout(function() {
                                $scope.communityData.Fingerprints.forEach(function(t) {
                                    if (t.id === fingerprintList[j]) {
                                        t.auth.forEach(function(t2, index) {
                                            if (t2.deviceId === deviceList[i]) {
                                                t.auth.splice(index, 1);
                                            }
                                        });
                                    }
                                });
                            });
                        }
                        if (value) {
                            if (j === 0) {
                                $scope.authCompleteinfo.push({
                                    device: deviceList[i],
                                    success: [fingerprintList[j]]
                                });
                            } else {
                                $scope.authCompleteinfo[i].success.push(fingerprintList[j]);
                            }
                        } else {
                            if (j === 0) {
                                $scope.authCompleteinfo.push({
                                    device: deviceList[i],
                                    fail: fingerprintList.slice(j),
                                    message: data.message
                                })
                            } else {
                                $scope.authCompleteinfo[i].fail = fingerprintList.slice(j);
                                $scope.authCompleteinfo[i].message = data.message;
                            }
                        }
                        if (i === deviceList.length - 1) {
                            if (!data.result || j === fingerprintList.length - 1) {
                                $timeout(function() {
                                    /*更新授权和未授权门口机列表*/
                                    var selectfingerprintList = []; //选择指纹的列表
                                    var selectfingerprint =
                                        angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
                                    angular.forEach(selectfingerprint,
                                        function(item) {
                                            var itemValue = angular.fromJson(item.value);
                                            selectfingerprintList.push(itemValue);
                                        });
                                    $scope.alreadyAuthFingerprint = authDeviceFilterGenerator(selectfingerprintList);
                                    $scope.unalreadyAuthFingerprint =
                                        unAuthDeviceFilterGenerator(selectfingerprintList, $scope.communityData.device);
                                });
                            }
                        }
                        getNext(value);
                    }).fail(function (err) {
                        console.log(err);
                    });
                }
                return {
                    getNext: getNext,
                    auth: auth
                }
            }
            $scope.authCompleteinfo = [];
            unauthGenerator(authFingerprintList, unAuthDeviceList).getNext(true);
        };
        //指纹查询过滤器
        $scope.fingerprintFilter = function (str) {
            if (!str) {
                $scope.fingerprint_viewData = $scope.communityData.Fingerprints.slice(0);
                return
            }
            var filterData = [];
            $scope.communityData.Fingerprints.forEach(function (item) {
                for (var prop in item) {
                    if (item.hasOwnProperty(prop)) {
                        if (prop === "nric") {
                            if (item[prop].indexOf(str) !== -1) {
                                filterData.push(item);
                                break;
                            } else {
                                if ($filter("nricToname")(item[prop], $scope.communityData.personnel).indexOf(str) !==
                                    -1) {
                                    filterData.push(item);
                                    break;
                                }
                            }
                        }
                    }
                }
            });
            $scope.fingerprint_viewData = filterData;
        };
        /*指纹管理结束*/


        /*广告投放开始*/

        //广告系统视图加载
        $scope.chooseadvertisingView = function (viewNumber) {
            switch (viewNumber) {
                case 1:
                    sideUrlChooseAdvertising = 1;
                    $scope.selectedAdView = 1;
                    return;
                case 2:
                    sideUrlChooseAdvertising = 2;
                    $scope.selectedAdView = 2;
                    return;
            }
        };
        $scope.functionaladvertisingView = function () {
            switch ($scope.selectedAdView) {
                case 1:
                    $('#uploadFile').on('show.bs.collapse', function () {
                        $('#selectedPlayCom').multiselect();
                    });
                    return "views/AdvertisingView/fileManagement.html";
                case 2:
                    return "views/AdvertisingView/advertisingLaunch.html";
                default:
                    if (!$scope.hideAdFileManage){
                        sideUrlChooseAdvertising = 1;
                        return "views/AdvertisingView/fileManagement.html";
                    }
                    if (!$scope.hideAdLaunch){
                        sideUrlChooseAdvertising = 2;
                        return "views/AdvertisingView/advertisingLaunch.html";
                    }
            }
        };
        //个人文件获取
        $scope.getAdminAdvertisingFile = function () {
            $.get("Advertising/Files", function (data) {
                $timeout(function () {
                    console.log(data);
                    $scope.adminData.Advertising = data;
                });
            });
        };
        //上传广告
        $scope.upAdvertisingFile = function () {
            var upForm = $('#upFileForm');
            var postUrl = upForm.attr("action");
            var requestMethod = upForm.attr("method");
            var formData = new FormData(upForm[0]);
            /*var $time = form_data.get("Term");
            var $timeStrap = new Date($time).getTime()/1000;
            form_data.set('Term', $timeStrap);*/
            /*mp4 = 1 flv = 2*/
            var type = formData.get("File").type;
            var size = formData.get("File").size;
            console.log(type);
            console.log(size);
            if (size > 30000000){
                alert("文件过大,不能超过28M");
                return;
            }
            if (type !== "video/mp4" && type !== "video/flv"){
                alert("只允许上传mp4或者flv视频");
                return;
            }
            if (type === "video/mp4"){
                formData.set('DataType', 1);
            }
            if (type === "video/flv"){
                formData.set('DataType', 2);
            }

            $.ajax({
                url : postUrl,
                type: requestMethod,
                data : formData,
                contentType: false,
                cache: false,
                processData:false
            }).done(function(response){
                $timeout(function () {
                    $scope.adminData.Advertising.push(
                        {
                            title:formData.get("Title"),
                            id:response,
                            remark:formData.get("Remark"),
                            communities:formData.getAll("Communities")
                        }
                    );
                });
            });
        };
        //编辑广告文件
        $scope.open_EditFile = function (file) {
            $scope.whoFile = JSON.parse(JSON.stringify(file));
            $('#editPlayCom').multiselect();
            $("#editFile").modal("show");
        };
        $scope.editFile = function () {
            var upForm = $('#editFileForm');
            var formData = new FormData(upForm[0]);
            var reqData = {
                Id: $scope.whoFile.id,
                Title:formData.get("Title"),
                Remark: formData.get("Remark"),
                Communities: formData.getAll("Communities")
            };
            console.log(reqData);
            $.ajax({
                url : "/Advertising/Files",
                type: "put",
                data : JSON.stringify(reqData),
                contentType: 'application/json; charset=utf-8'
            }).done(function(response){
            });

        };
        //获取小区播放计划
        $scope.getComPlans = function (com) {
            $scope.authADCompleteinfo = [];
            $.get("/Advertising/Plans/"+com, function (data) {
                $timeout(function () {
                    console.log(data);
                    $scope.communityData.AdvertisingPlans = data;
                });
            });
            //请求设备数据
            $.get('Devices/Folk/' + com, function (data) {
                $timeout(function () {
                    $scope.communityData.ADunAuthDevice = data.slice(0);
                    $scope.ChooseauthDevice_AD = [];
                    $scope.alreadyAuth_AD = [];

                });
            });
        };
        //获取小区的广告文件
        var chooseComAdvertising;
        $scope.getcomAdFile = function (com) {
            chooseComAdvertising = com;
            $.get("Advertising/Files/"+com, function (data) {
                $timeout(function () {
                    $scope.communityData.AdFiles = data;
                });
            });
        };
        //添加时段form
        $scope.addPlayTimeForm = function () {
            $("#addplayTime").append("<form class=\"form-inline addplayform\">\n" +
                "                            <div class=\"form-group form-group-sm\">\n" +
                "                                <label>播放区间：</label>\n" +
                "                                <input type=\"time\" name=\"StartTime\" class=\"form-control\">--\n" +
                "                                <input type=\"time\" name=\"EndTime\" class=\"form-control\">\n" +
                "                            </div>\n" +
                "                            <div class=\"form-group form-group-sm\">\n" +
                "                                <label>星期：</label>\n" +
                "                                <select class=\"form-control playWeek\" multiple=\"multiple\" name=\"WeekDays\">\n" +
                "                                    <option value=\"0\">星期日</option>\n" +
                "                                    <option value=\"1\">星期一</option>\n" +
                "                                    <option value=\"2\">星期二</option>\n" +
                "                                    <option value=\"3\">星期三</option>\n" +
                "                                    <option value=\"4\">星期四</option>\n" +
                "                                    <option value=\"5\">星期五</option>\n" +
                "                                    <option value=\"6\">星期六</option>\n" +
                "                                </select>\n" +
                "                            </div>\n" +
                "                            <div class=\"form-group form-group-sm\">\n" +
                "                                <label>循环：</label>\n" +
                "                                <label class=\"radio-inline\">\n" +
                "                                    <input type=\"radio\" name=\"Loop\" value=\"true\" checked> 是\n" +
                "                                </label>\n" +
                "                                <label class=\"radio-inline\">\n" +
                "                                    <input type=\"radio\" name=\"Loop\" value=\"false\"> 否\n" +
                "                                </label>\n" +
                "                            </div>\n" +
                "                            <button type=\"button\" class=\"btn btn-default btn-sm\" onclick='removeSelf(event)'>删除</button>\n" +
                "                        </form>");
            $('.playWeek').multiselect({
                buttonContainer: '<div class="btn-group btn-group-sm" />'
            });
        };
        //删除时段form
        function removeSelf(event) {
            var parent=document.getElementById("addplayTime");
            parent.removeChild(event.srcElement.parentElement);
        };
        //时间转换成秒数
        function timeToSeconds(timeStr) {
            var shi = timeStr.substring(0,2);
            var fen = timeStr.substring(3);
            var second = Number(shi)*3600+Number(fen)*60;
            return second;
        }
        //秒数转化成时间
        $scope.secondsTotime = function(secondStr) {
            var second = Number(secondStr);
            var shi = parseInt(second/3600);
            if (String(shi).length === 1){
                shi = "0"+shi;
            }
            var fen = second%3600/60;
            if (String(fen).length === 1){
                fen = "0"+fen;
            }
            return shi + ":" + fen;
        };
        //星期过滤器
        $scope.weekDayToStr = function (weekDays) {
            if (weekDays.length === 0){
                return "星期";
            }
            var list = [];
            var str = "";
            var week = ["日","一","二","三","四","五","六"];
            for (var i=0;i<weekDays.length;i++) {
                list.push(week[weekDays[i]]);
            }
            str = list.join("、");
            str = "星期"+str;
            return str;
        };
        //上传计划
        $scope.addPlaybackPlan = function () {
            var playbackPlanData = {
                fileid:"",
                term:"",
                remark:"",
                plans:[]
            };
            var playbackPlan = $("#playbackPlanForm");
            var playbackPlanFormData = new FormData(playbackPlan[0]);
            if (!playbackPlanFormData.get("FileId")){
                alert("请选择文件！");
                return;
            }
            if (!playbackPlanFormData.get("Remark")){
                alert("请填写备注！");
                return;
            }
            if (!playbackPlanFormData.get("Term")){
                alert("请填写终止时间！");
                return;
            }

            var playForms = $(".addplayform");
            if (playForms.length === 0){
                alert("请添加时段");
                return;
            }
            for (var i=0;i<playForms.length;i++){
                var formData = new FormData(playForms[i]);
                if (!formData.get("StartTime")){
                    alert("有时段开始时间没有正确填写！");
                    return;
                }
                if (!formData.get("EndTime")){
                    alert("有时段结束时间没有正确填写！");
                    return;
                }
                if (timeToSeconds(formData.get("StartTime")) >= timeToSeconds(formData.get("EndTime"))){
                    alert("有时段结束时间没有大于开始时间！");
                    return;
                }
                if (formData.getAll("WeekDays").length === 0){
                    alert("有时段的星期没有选择");
                    return;
                }
                formData.set("StartTime",timeToSeconds(formData.get("StartTime")));
                formData.set("EndTime",timeToSeconds(formData.get("EndTime")));
                playbackPlanData.plans.push({
                    StartTime: formData.get("StartTime"),
                    EndTime: formData.get("EndTime"),
                    WeekDays: formData.getAll("WeekDays"),
                    Loop: formData.get("Loop")
                });
            }
            playbackPlanData.fileid = playbackPlanFormData.get("FileId");
            var termTimestamp = new Date(playbackPlanFormData.get("Term")).getTime()/1000;
            var today = new Date().getTime()/1000;
            if (termTimestamp <= today){
                alert("终止时间需要大于今天！");
                return;
            }
            playbackPlanData.term = termTimestamp;
            playbackPlanData.remark = playbackPlanFormData.get("Remark");
            $.ajax({
                type: 'post',
                url: 'Advertising/Plans/'+chooseComAdvertising,
                contentType: 'application/json; charset=utf-8',
                data: JSON.stringify(playbackPlanData)
            }).done(function (data) {
                alert("上传成功！");
                $.get("/Advertising/Plans/"+chooseComAdvertising, function (data) {
                    $timeout(function () {
                        console.log(data);
                        $scope.communityData.AdvertisingPlans = data;
                    });
                });
            }).fail(function (err) {
                console.log(err);
            });
        };
        //删除计划
        var selectedPlan;
        $scope.deletePlaybackPlan = function () {
            if (!selectedPlan){
                return selectedPlan;
            }
            console.log(selectedPlan);
            $.ajax({
                type: 'delete',
                url: 'Advertising/Plans/'+selectedPlan
            }).done(function (data) {
                console.log(data);
                if (data.result){
                    $.get("/Advertising/Plans/"+chooseComAdvertising, function (data) {
                        $timeout(function () {
                            console.log(data);
                            $scope.communityData.AdvertisingPlans = data;
                        });
                    });
                }else {
                    alert("删除失败！"+ data.message);
                }
            }).fail(function (err) {
                console.log(err);
            });
        };
        //选择播放计划
        $scope.choosePlan = function (plan) {
            selectedPlan = plan.id;
            //获取计划的已投放设备
            $.get('Advertising/Devices/' + selectedPlan, function (data) {
                $timeout(function () {
                    $scope.ChooseauthDevice_AD = $scope.communityData.ADunAuthDevice.filter(function (item) {
                        return data.indexOf(item.id) === -1;
                    });
                    $scope.alreadyAuth_AD = $scope.communityData.ADunAuthDevice.filter(function (item) {
                        return data.indexOf(item.id) !== -1;
                    });
                });
            });
        };
        //选择播放计划样式
        $scope.choosePlanStyle = function (item) {
            return item.id == selectedPlan ? "success" : "";
        };
        //授权播放计划
        $scope.authAdPlayToDevice = function () {
            $scope.authADCompleteinfo = [];
            var selectDeviceList = [];
            var selectDevice = angular.element("input:checkbox[name='chooseAuthDevice_AD']:checked");
            angular.forEach(selectDevice, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectDeviceList.push(itemValue.id);
            });
            if(selectDeviceList.length === 0){
                return
            }
            for (var i=0;i<selectDeviceList.length;i++){
                (function (i) {
                    var issue = {
                        DeviceId: selectDeviceList[i],
                        PlanId: selectedPlan
                    };
                    $.ajax({
                        type: 'post',
                        url: 'Advertising/Issue',
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify(issue)
                    }).done(function (data) {
                        $timeout(function () {
                            if (data.result){
                                var successDevice = $scope.communityData.ADunAuthDevice.filter(function (item) {
                                    return item.id === selectDeviceList[i];
                                });
                                $scope.alreadyAuth_AD.push(successDevice[0]);
                                $scope.ChooseauthDevice_AD = $scope.ChooseauthDevice_AD.filter(function(item) {
                                    return item.id !== selectDeviceList[i];
                                });
                            }
                            data.device = selectDeviceList[i];
                            $scope.authADCompleteinfo.push(data);
                        });
                        console.log(data);
                    }).fail(function (err) {
                        console.log(err);
                    });
                }(i))
            }
        };
        //取消授权播放计划
        $scope.deleteAuth_AD = function () {
            $scope.authADCompleteinfo = [];
            var selectDeviceList = [];
            var selectDevice = angular.element("input:checkbox[name='chooseAlreadyAuth_AD']:checked");
            angular.forEach(selectDevice, function (item) {
                var itemValue = angular.fromJson(item.value);
                selectDeviceList.push(itemValue.id);
            });
            if(selectDeviceList.length === 0) {
                return;
            }
            for (var i=0;i<selectDeviceList.length;i++) {
                (function(i) {
                    var issue = {
                        DeviceId: selectDeviceList[i],
                        PlanId: selectedPlan
                    };
                    $.ajax({
                        type: 'delete',
                        url: 'Advertising/Issue',
                        contentType: 'application/json; charset=utf-8',
                        data: JSON.stringify(issue)
                    }).done(function(data) {
                        $timeout(function() {
                            if (data.result) {
                                var successDevice = $scope.communityData.ADunAuthDevice.filter(function(item) {
                                    return item.id === selectDeviceList[i];
                                });
                                $scope.ChooseauthDevice_AD.push(successDevice[0]);
                                $scope.alreadyAuth_AD = $scope.alreadyAuth_AD.filter(function(item) {
                                    return item.id !== selectDeviceList[i];
                                });
                            }
                            data.device = selectDeviceList[i];
                            $scope.authADCompleteinfo.push(data);
                        });
                        console.log(data);
                    }).fail(function(err) {
                        console.log(err);
                    });
                }(i));
            }
        };
        /*广告投放结束*/
        /*查询系统开始*/
        $scope.moreQuery = "更多选项";
        $scope.openMore = false;
        $scope.openMoreChange = function () {
            if ($scope.openMore) {
                $scope.openMore = false;
                $scope.moreQuery = "更多选项";
            } else {
                $scope.openMore = true;
                $scope.moreQuery = "关闭更多";
            }
        };
        //查询系统视图加载
        $scope.chooseQueryView = function (viewNumber) {
            switch (viewNumber) {
                case 1:
                    sideUrlChooseQuery = 1;
                    $scope.selectedView = 1;
                    return;
                case 2:
                    sideUrlChooseQuery = 2;
                    $scope.selectedView = 2;
                    return;
            }
        };
        $scope.functionalQueryView = function () {
            switch ($scope.selectedView) {
                case 1:
                    return "views/QueryView/record.html";
                case 2:
                    return "views/QueryView/DeviceStatus.html";
                default:
                    sideUrlChooseQuery = 1;
                    return "views/QueryView/record.html";
            }
        };
        //缓存查询字段
        $scope.searchData = {
            GateList: []
        };
        //静态事件列表
        $scope.eventlist = [{
                id: "",
                name: "全部"
            }, {
                id: "0",
                name: "指纹开锁"
            }, {
                id: "1",
                name: "呼叫"
            },
            {
                id: "2",
                name: "QQ开锁"
            }, {
                id: "3",
                name: "IC卡开锁"
            }, {
                id: "4",
                name: "监视"
            }
        ];
        $scope.event = $scope.eventlist[0].id; //事件初始化
        //初始化搜索时间
        $scope.initTime = function () {
            $("#startTime").val(new Date().format("yyyy-MM-dd") + " 00:00:00");
            $("#endTime").val(new Date().format("yyyy-MM-dd") + " 23:59:59");
        };
        $scope.getGate = function (comid) {
            $.get("Ranger/Gates/" + comid, function (data) {
                $timeout(function () {
                    $scope.searchData.GateList = orderBy(data, 'Name');
                    $scope.searchData.GateList.forEach(function (item) {
                        switch (item.address.toString().length) {
                            case 1:
                                item.address = "000000" + item.address;
                                break;
                            case 2:
                                item.address = "00000" + item.address;
                                break;
                            case 3:
                                item.address = "0000" + item.address;
                                break;
                            case 4:
                                item.address = "000" + item.address;
                                break;
                            case 5:
                                item.address = "00" + item.address;
                                break;
                            case 6:
                                item.address = "0" + item.address;
                                break;
                            default:
                                item.address = item.address;
                        }
                    });
                    $scope.searchData.GateList.unshift({
                        id: "",
                        address: "全部"
                    });
                    $scope.searchData.Gate = $scope.searchData.GateList[0].id;
                });
            });
            $.get('Communities/LoadArch/' + comid, function (data) {
                $timeout(function () {
                    $scope.communityData.queryAddress = data;
                });
            });
        };
        //查询记录
        $rootScope.recordBarData = false;
        $rootScope.listQuery = false;
        $scope.QueryRecord = function (com, gate, event, name, nric, phone, addressBuilding, addressUnit, addressRoom) {
            if (nric) {
                var validator = new IDValidator();
                if (!validator.isValid(nric)) {
                    alert("身份证号码格式不正确！");
                    return;
                }
            }
            //查询的小区
            for (var i = 0; i < $scope.adminData.communities.length; i++) {
                if ($scope.adminData.communities[i].id === com) {
                    $scope.comName = $scope.adminData.communities[i].name;
                    break;
                }
            }
            //获取查询时间范围
            var startTimeStr = document.getElementById("startTime").value;
            var endTimeStr = document.getElementById("endTime").value;
            var beginTime = getTime.getTimestamp(startTimeStr);
            var endTime = getTime.getTimestamp(endTimeStr);
            var requestData = {
                BeginTime: beginTime,
                EndTime: endTime,
                Gate: gate,
                Community: com,
                Event: event,
                Nric: nric,
                Name: name,
                Phone: phone
            };
            if (addressBuilding) {
                requestData.Address = addressBuilding.id;
            }
            if (addressUnit) {
                requestData.Address = addressBuilding.id + addressUnit.id;
            }
            if (addressRoom) {
                requestData.Address = addressBuilding.id + addressUnit.id + addressRoom.id;
            }
            console.log(JSON.parse(JSON.stringify(requestData)));
            $.ajax({
                type: 'post',
                url: 'Ranger/QueryEvents/' + $rootScope.g.wsHash,
                data: JSON.stringify(requestData),
                contentType: 'application/json; charset=utf-8'
            }).done(function (data) {

            }).fail(function (err) {
                console.log(err);
            });
        };
        $scope.detail = function (id, eventType) {
            $scope.Imgbase = "Ranger/EventImage/" + id + "/" + eventType;
            $("#detailImage").modal("show");
        };
        $scope.enlargeImg = function () {
            $("#detailModal").addClass("enlargeImg");
        };
        $scope.restoreImg = function () {
            $("#detailModal").removeClass("enlargeImg");
        };
        //设备日志查询
        //设备状态
        $scope.StatusIds = [{
            id: "",
            name: "全部"
        }, {
            id: 0,
            name: "关闭"
        }, {
            id: 1,
            name: "打开"
        }, {
            id: 2,
            name: "离线"
        }, {
            id: 3,
            name: "网络恢复"
        }, {
            id: 4,
            name: "软件上线"
        }];
        $scope.StatusId = $scope.StatusIds[0].id;
        $scope.QueryStatus = function (com, gate, statusid) {
            //查询的小区
            for (var i = 0; i < $scope.adminData.communities.length; i++) {
                if ($scope.adminData.communities[i].id === com) {
                    $scope.comName = $scope.adminData.communities[i].name;
                    break;
                }
            }
            //获取查询时间范围
            var startTimeStr = document.getElementById("startTime").value;
            var endTimeStr = document.getElementById("endTime").value;
            var beginTime = getTime.getTimestamp(startTimeStr);
            var endTime = getTime.getTimestamp(endTimeStr);
            var requestData = {
                BeginTime: beginTime,
                EndTime: endTime,
                DeviceId: gate,
                CommunityId: com,
                Status: statusid
            };
            console.log(requestData);
            $.ajax({
                type: 'post',
                url: 'Ranger/QueryLogs/' + $rootScope.g.wsHash,
                data: JSON.stringify(requestData),
                contentType: 'application/json; charset=utf-8'
            }).done(function (data) {

            }).fail(function (err) {
                console.log(err);
            });
        }
    });