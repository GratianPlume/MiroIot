/// <reference path="./node_modules/@types/bootstrap/index.d.ts" />
/// <reference path="./node_modules/@types/bootstrap-treeview/index.d.ts" />
/// <reference path="./node_modules/@types/angular-route/index.d.ts" />
/// <reference path="./local.d.ts" />
const srAngularApp = angular
    .module("srAngular", ["ngRoute"])
    .config(($routeProvider: angular.route.IRouteProvider, $iot: typeof Iot) => {
        $routeProvider
            .when("/entranceGuardSystem", {
                templateUrl: `views/entranceGuardSystem.html?${$iot.startTime}`,
                resolve: {
                    auth: ($q: ng.IQService, $rootScope: RootScope) => {
                        const auth = $rootScope.isAuthorize;
                        if (auth) {
                            return $q.when(auth);
                        } else {
                            return $q.reject({
                                authenticated: false
                            });
                        }
                    }
                }
            })
            .when("/querySystem", {
                templateUrl: "views/querySystem.html?" + $iot.startTime,
                resolve: {
                    auth: ($q: ng.IQService, $rootScope: RootScope) => {
                        const auth = $rootScope.isAuthorize;
                        if (auth) {
                            return $q.when(auth);
                        } else {
                            return $q.reject({
                                authenticated: false
                            });
                        }
                    }
                }
            })
            .when("/advertisingSystem", {
                templateUrl: "views/advertisingSystem.html?" + $iot.startTime,
                resolve: {
                    auth: ($q: ng.IQService, $rootScope: RootScope) => {
                        const auth = $rootScope.isAuthorize;
                        if (auth) {
                            return $q.when(auth);
                        } else {
                            return $q.reject({
                                authenticated: false
                            });
                        }
                    }
                }
            })
            .otherwise({
                templateUrl: "views/Login.html?" + $iot.startTime
            });
    })
    .run(($rootScope: RootScope, $location: ng.ILocationService, $iot: typeof Iot) => {
        $rootScope.isAuthorize = false;
        $rootScope.$on("$routeChangeStart", () => {
            if (!$rootScope.isAuthorize) {
                $location.path("/");
            }
        });
        //当前操作小区
        $rootScope.currentCommunity = false;
        //关闭广告功能 默认打开
        $rootScope.openAdsystem = $iot.advertisingMode;

        try {
            $iot
                .connect()
                .bindOpen(() => (document.title = $iot.title + " - 连接服务器成功"))
                .bindClose(() => {
                    document.title = $iot.title + " - 与服务器断开连接";
                    alert("连接已断开，请重新登录！");
                    location.reload();
                })
                .bindError(() => alert($iot.title + "通信发生错误"))
                .bindClearEvents(() => {
                    $rootScope.$apply(() => {
                        $rootScope.events = [];
                        $rootScope.recordBarData = true;
                        $rootScope.listQuery = true;
                    });
                })
                .bindEvent(item => $rootScope.events.push(item))
                .bindEventsCompleted(() => {
                    $rootScope.$apply(() => {
                        $rootScope.recordBarData = false;
                    });
                })
                .bindClearLogs(() => {
                    $rootScope.$apply(() => {
                        $rootScope.Status = [];
                        $rootScope.logsbarData = true;
                        $rootScope.listStatus = true;
                    });
                })
                .bindLog(item => $rootScope.Status.push(item))
                .bindLogsCompleted(() => {
                    $rootScope.$apply(() => {
                        $rootScope.logsbarData = false;
                    });
                });
        } catch (err) {
            if (typeof err === "string") document.getElementById("message_output").innerHTML = err;
        }
    }).directive("isFalse", () => ({
        restrict: "A",
        require: "ngModel",
        link: (scope, element, attr, ngModel) => {
            function fromUser(value?: boolean) {
                return value ? false : undefined;
            }

            function toUser(value?: boolean) {
                return value === false;
            }
            (<ng.INgModelController>ngModel).$parsers.push(fromUser);
            (<ng.INgModelController>ngModel).$formatters.push(toUser);
        }
    }))
    .directive("isTrue", () => ({
        restrict: "A",
        require: "ngModel",
        link: (scope, element, attr, ngModel) => {
            function fromUser(value?: boolean) {
                return value ? true : undefined;
            }

            function toUser(value?: boolean) {
                return value;
            }
            (<ng.INgModelController>ngModel).$parsers.push(fromUser);
            (<ng.INgModelController>ngModel).$formatters.push(toUser);
        }
    }))
    .filter("relativeText", () => (value: Relative): string => 
        value ? Helper.relativeConstans[value - 1].name : ""
    )
    .filter("roomName", ($iot: typeof Iot) => (input: Guid): string => {
        const id = $iot.current.id;
        const x = $iot.communities.flatten(id, input);
        return !x ? input : x.block.name + x.unit.name + x.flat.id;
    })
    .filter("roomToAddressid", ($iot: typeof Iot) => (input: Guid): string => {
        const id = $iot.current.id;
        const x = $iot.communities.flatten(id, input);
        return x.block.id + x.unit.id + x.flat.id;
    })
    .filter("nricFilter", () => (nric: string) => (nric.length > 18 ? "" : nric))
    .filter("deviceAddress", () => Helper.deviceAddressToStr)
    .filter("nricToname", () => (id: string, people: Dict<Person>): string => {
        if (!id) {
            return "";
        }
        const x = people.$[id];
        return x ? x.name : "";
    })
    .filter("nricTorooms", () => (id: string, people: Dict<Person>): string[] => {
        if (!id) {
            return [];
        }
        const x = people.$[id];
        return x ? x.rooms.map(y => y.id) : [];
    })
    .filter("deviceToAddress", () => (device: string, deviceList: Dict<Device>): number => {
        const item = deviceList.$[device];
        return item ? item.address : undefined;
    })
    .filter("cardidTonumber", () => (id: string, number: Card[]): string => {
        for (let i = 0; i < number.length; i++) {
            if (number[i].id === id) {
                return number[i].serial;
            }
        }
    })
    .filter("bindingroomToaddress", ($iot: typeof Iot) => (room: string): string => {
        if (!room || room.length !== 10) return "";
        const blockId = room.slice(0, 4);
        const block = $iot.current.arch.communityX.items.$[blockId];
        const unitId = room.slice(4, 6);
        const unit = block.items.$[unitId];
        const roomId = room.slice(6);
        return block.name + unit.name + roomId;
    })
    .filter("fingerFilter", () => (finger: number): string => (finger ? Helper.fingerConstans[finger - 1].name : ""))
    .filter("Filter_level", () => (level: number): number => level & 63)
    .filter("fingerprintToName", ($filter: Filter) => (id: string, fingerprintList: Fingerprint[], personelList: Dict<Person>, fingers: FingerConstans[]): string => {
        for (let i = 0; i < fingerprintList.length; i++) {
            if (fingerprintList[i].id === id) {
                const fingerName = fingers.filter(t => t.id === fingerprintList[i].finger);
                return $filter("nricToname")(fingerprintList[i].nric, personelList) + "的" + fingerName[0].name;
            }
        }
    })
    .filter("personFilter", ($filter: Filter) => (viewData: MainView, filter: string): DictCore<Person> => {
        if (!filter) {
            return viewData.personnel.copy.$;
        }
        const roomPredicate = (room: RoomBinding) => $filter("roomName")(room.id).indexOf(filter) !== -1 || $filter("roomToAddressid")(room.id).indexOf(filter) !== -1;
        const predicate = (item: Person) => {
            for (const prop in item) {
                if (item.hasOwnProperty(prop)) {
                    if (prop === "rooms" && item[prop].some(roomPredicate)) {
                        return true;
                    } else if (item[prop].toString().indexOf(filter) !== -1) {
                        return true;
                    }
                }
            }
            return false;
        };
        return viewData.personnel.filter(predicate).$;
    })
    .filter("unAuthDevice_filter", () => (deviceList: Dict<Device>, str: string) => {
        const num = Number(str);
        if (isNaN(num) || !num) {
            return deviceList.$;
        }
        const zip = String(num);
        return deviceList.filter(item => item.address.toString().slice(0, zip.length) === zip).$;
    })
    .filter("dateFilter", () => (time: number): string => {
        const padding = (num: number) => `0${num}`.slice(-2);
        const date = new Date(time * 1000);
        const year = date.getFullYear();
        const month = padding(date.getMonth() + 1);
        const day = padding(date.getDate());
        const hour = padding(date.getHours());
        const minute = padding(date.getMinutes());
        const second = padding(date.getSeconds());
        return `${year}/${month}/${day}  ${hour}:${minute}:${second}`;
    })
    .controller("mainCtrl", ($scope: Scope, $timeout: ng.ITimeoutService, $rootScope: RootScope, $location: ng.ILocationService, $filter: Filter, $fp: typeof FpService, $iot: typeof Iot) => {
        /*动态样式*/
        //主导航
        let urlChoose: 1 | 2;
        $scope.chooseUrl = num => {
            $rootScope.currentCommunity = num === 1;
            urlChoose = num;
        };
        $scope.Urlstyle = num => (num === urlChoose ? "active" : "");
        //侧边管理导航
        let sideUrlChoose: number;
        $scope.entrancesidebarStyle = num => (num === sideUrlChoose ? "active" : "");
        //侧边查询导航
        let sideUrlChooseQuery: number;
        $scope.querysidebarStyle = num => (num === sideUrlChooseQuery ? "active" : "");
        //侧边广告导航
        let sideUrlChooseAdvertising: number;
        $scope.advertisingsidebarStyle = num => (num === sideUrlChooseAdvertising ? "active" : "");
        //帐号管理路径导航
        $scope.accountUrl = num => ($scope.viewSwitch.mode === num ? "active" : "");
        /*动态样式*/
        $scope.hideGuardSystem = false;
        $scope.hideAdSystem = false;
        $scope.hideAdFileManage = true;
        $scope.hideAdLaunch = true;
        $scope.userGradeList = Helper.adminConstans.slice(0);
        //小区操作
        $scope.showOperateCom = true;
        //注册登录
        $scope.GradeValue = "";
        $scope.chooseAdPowerView = newVal => {
            const parsePower: () => [boolean, boolean] = () => {
                if ($rootScope.openAdsystem) {
                    if ($scope.adminData.level === 0 && Number(newVal) === 1) {
                        return [true, false];
                    }
                    if ($scope.adminData.level === 0 || !!($scope.adminData.level & 256)) {
                        return [false, true];
                    }
                }
                return [false, false];
            };
            [$scope.chooseAdPower_1, $scope.chooseAdPower_2] = parsePower();
        };
        const orderBy = $filter("orderBy");
        $scope.Login_register = true;
        $scope.login = (user, psw, rmm) => {
            $scope.hideGuardSystem = false;
            $scope.hideAdSystem = false;
            $scope.hideAdFileManage = true;
            $scope.hideAdLaunch = true;
            $iot.accounts
                .login(user, psw, rmm)
                .then(data => {
                    $rootScope.isAuthorize = true;
                    $timeout(() => {
                        $scope.chooseNumber = 5;
                        $scope.adminData.communities = data.communities;
                        $scope.adminData.name = data.name;
                        $scope.adminData.level = data.level;
                        //超级管理员
                        if (data.level === 0) {
                            $location.path("/entranceGuardSystem");
                            urlChoose = 1;
                            $scope.hideAdSystem = $rootScope.openAdsystem;
                            $scope.hideAdLaunch = false;
                            $scope.hideAdFileManage = false;
                            $scope.showOperateCom = true;
                            $scope.userGradeList = Helper.adminConstans.slice(0);
                            return;
                        }
                        //一级管理员
                        if ((data.level & 63) === 1) {
                            $scope.showOperateCom = true;
                            $scope.userGradeList = Helper.adminConstans.slice(1);
                            if ((data.level & 256) !== 0) {
                                $location.path("/entranceGuardSystem");
                                urlChoose = 1;
                                $scope.hideAdSystem = $rootScope.openAdsystem;
                                $scope.hideAdLaunch = false;
                                $scope.hideAdFileManage = false;
                                return;
                            } else {
                                $location.path("/entranceGuardSystem");
                                urlChoose = 1;
                                $scope.hideAdSystem = false;
                                $scope.hideAdLaunch = true;
                                $scope.hideAdFileManage = true;
                                return;
                            }
                        }
                        //二级管理员
                        if ((data.level & 63) === 2) {
                            $scope.showOperateCom = false;
                            $scope.userGradeList = Helper.adminConstans.slice(2);
                            if ((data.level & 64) !== 0 && (data.level & 128) !== 0) {
                                $scope.hideAdSystem = $rootScope.openAdsystem;
                                $scope.hideAdLaunch = false;
                                $scope.hideAdFileManage = false;
                                $location.path("/entranceGuardSystem");
                                urlChoose = 1;
                                return;
                            }
                            if ((data.level & 64) !== 0) {
                                $scope.hideAdSystem = $rootScope.openAdsystem;
                                $scope.hideAdFileManage = false;
                                $scope.hideAdLaunch = true;
                                $location.path("/entranceGuardSystem");
                                urlChoose = 1;
                                return;
                            }
                            if ((data.level & 128) !== 0) {
                                $scope.hideAdSystem = $rootScope.openAdsystem;
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
                        if ((data.level & 63) === 3) {
                            $scope.userGradeList = [];
                            $scope.hideGuardSystem = true;
                            if ((data.level & 64) !== 0 && (data.level & 128) !== 0) {
                                $scope.hideAdSystem = $rootScope.openAdsystem;
                                $scope.hideAdLaunch = false;
                                $scope.hideAdFileManage = false;
                                $location.path("/querySystem");
                                urlChoose = 2;
                                return;
                            }
                            if ((data.level & 64) !== 0) {
                                $scope.hideAdSystem = $rootScope.openAdsystem;
                                $scope.hideAdFileManage = false;
                                $scope.hideAdLaunch = true;
                                $location.path("/querySystem");
                                urlChoose = 2;
                                return;
                            }
                            if ((data.level & 128) !== 0) {
                                $scope.hideAdSystem = $rootScope.openAdsystem;
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
                })
                .catch(() => {
                    $("#errorText").removeClass("hidden");
                    $timeout(() => {
                        $("#errorText").addClass("hidden");
                    }, 3000);
                });
        };
        $scope.changeLogin = () => {
            $scope.Login_register = !$scope.Login_register;
            $("#errorText").text("");
        };
        $scope.registerActive = (user, pwd, code) => {
            if (user && pwd && code) {
                $iot.accounts
                    .register(user, pwd, code)
                    .then(data => {
                        if (data.result) {
                            $(".badge").text("");
                            alert("注册成功");
                        } else {
                            const errText = data.errors.map(x => x.description).join("\n");
                            $(".badge").text(errText);
                        }
                    })
                    .catch(err => console.log(err));
            } else {
                alert("请填写完所有数据！");
            }
        };
        /*注册登录结束*/

        /*门禁模块视图切换开始*/
        $scope.chooseView = (viewNumber: number) => {
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
        $scope.functionalView = () => {
            switch ($scope.chooseNumber) {
                case 1:
                    return "views/entranceGuardView/deviceManagement.html?" + $iot.startTime;
                case 2:
                    return "views/entranceGuardView/PersonnelManagement.html?" + $iot.startTime;
                case 3:
                    $("#addFinger").modal({
                        keyboard: false,
                        backdrop: "static",
                        show: false
                    });
                    return "views/entranceGuardView/fingerprintManagement.html?" + $iot.startTime;
                case 4:
                    return "views/entranceGuardView/cardManagement.html?" + $iot.startTime;
                case 5:
                    sideUrlChoose = 5;
                    return "views/entranceGuardView/CommunityStructure.html?" + $iot.startTime;
                case 6:
                    return "views/entranceGuardView/accountManagement.html?" + $iot.startTime;
                default:
                    return "views/entranceGuardView/CommunityStructure.html?" + $iot.startTime;
            }
        };
        $scope.asideView = true;
        /*门禁模块视图切换结束*/

        /*账号管理数据*/
        $scope.adminData = new AdminView();

        /*进入账号管理时获取当前管理员管理的人员数据*/
        $scope.getAdminList = () => {
            $iot.accounts.getSubAdmins().then(data => {
                $timeout(() => {
                    $scope.adminData.manager = data;
                });
            });
        };
        /*管理界面视图切换开始*/
        $scope.adminViewList = [{ control: 0, name: "小区列表" }, { control: 1, name: "管理员列表" }, { control: 2, name: "生成邀请码" }, { control: 3, name: "修改密码" }];
        $scope.viewSwitch = { mode: 0 };
        $scope.switchView = control => {
            $scope.viewSwitch.mode = control;
        };
        /*管理界面视图切换结束*/
        //修改小区
        let editCommunityData: CommunityDetail;
        $scope.openEditCommunity = (community: CommunityDetail) => {
            editCommunityData = community;
            $("#editCommunity").modal("show");
            $scope.newCommunityName = community.name;
            $scope.newCommunityRemark = community.remark;
        };
        $scope.editCommunity = (name, remark) => {
            if (!name) {
                alert("请填写名称");
                return;
            }
            $iot.communities
                .modify(editCommunityData.id, name, remark)
                .then(data => {
                    if (data) {
                        alert("修改成功！");
                        $timeout(() => {
                            editCommunityData.name = name;
                            editCommunityData.remark = remark;
                        });
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        };

        function mapToArray<T>(elements: JQuery<HTMLElement>, method: (x: HTMLInputElement) => T): T[] {
            return Helper.getSeq(elements)
                .map(method)
                .toArray();
        }
        /*删除小区开始*/
        $scope.deleteCommunity = () => {
            const deleteCommunityList = angular.element("input:checkbox[name='chooseDeleteCommunity']:checked");
            const sure = confirm("你确定删除这" + deleteCommunityList.length + "个小区吗？");
            if (!sure) {
                return;
            }
            const deleteCommunityIdList = mapToArray(deleteCommunityList, item => (angular.fromJson(item.value) as CommunityDetail).id);
            $iot.communities
                .delete(deleteCommunityIdList)
                .then(() => {
                    $timeout(() => {
                        $scope.adminData.communities = $scope.adminData.communities.filter(item => deleteCommunityIdList.indexOf(item.id) === -1);
                    });
                    alert("删除成功！");
                })
                .catch(err => {
                    console.log(err);
                });
        };
        /*删除小区结束*/

        /*新建小区开始*/
        $scope.createNewCommunity = (area, newCommunityName, newCommunityRemark) => {
            if (!area || !newCommunityName || !newCommunityRemark) {
                alert("请填写完所有信息");
                return;
            }
            $iot.communities
                .create(area, newCommunityName, newCommunityRemark)
                .then((data: Guid) => {
                    const newCommunityObj: CommunityDetail = {
                        id: data,
                        name: newCommunityName
                    };
                    $timeout(() => {
                        $scope.adminData.communities.unshift(newCommunityObj);
                    });
                    alert("添加成功！");
                })
                .catch(err => {
                    console.log(err);
                });
        };
        /*新建小区结束*/

        /*删除管理员开始*/
        $scope.deleteAdmin = () => {
            const deleteAdminList = angular.element("input:checkbox[name='managerChoose']:checked");
            const sure = confirm("你确定删除这" + deleteAdminList.length + "个管理员吗？");
            if (!sure) {
                return;
            }
            const deletaAdminOpenidList = mapToArray(deleteAdminList, x => x.value);

            $iot.accounts
                .deleteAdmins(deletaAdminOpenidList)
                .then(() => {
                    $timeout(() => {
                        $scope.adminData.manager = $scope.adminData.manager.filter(item => deletaAdminOpenidList.indexOf(item.openid) === -1);
                    });
                    alert("删除成功！");
                })
                .catch(err => {
                    console.log(err);
                });
        };
        /*删除管理员结束*/

        /*编辑管理员开始*/
        let editedManagerOpenid: string;
        $scope.editAdmin = (manager: AdminData, index) => {
            console.log(manager.communities);
            $("#editAdmin").modal("show");
            editedManagerOpenid = manager.openid;
            $scope.editedAdmin = manager.name ? manager.name : manager.openid;
            //已授权小区列表
            $scope.editedAdminCommunities = Helper.arrToDic<CommunityDetail>(manager.communities);
            //未授权小区列表
            if ($scope.editedAdminCommunities.length === 0) {
                $scope.uneditedAdminCommunities = Helper.arrToDic<CommunityDetail>(manager.communities);
            } else {
                $scope.uneditedAdminCommunities = Seq.ofArray($scope.adminData.communities)
                    .filter(x => !$scope.editedAdminCommunities.containKey(x.id))
                    .toDict();
            }
        };
        //授权小区
        $scope.authCommunity = () => {
            const authCommunityList = angular.element("input:checkbox[name='unAuthorizedCommunity']:checked");
            if (authCommunityList.length === 0) {
                alert("请选择小区！");
                return;
            }
            const sure = confirm("你确定授权这" + authCommunityList.length + "个小区给该管理员吗？");
            if (!sure) {
                return;
            }
            const authCommunityIdList = mapToArray(authCommunityList, x => x.value);
            $iot.accounts
                .authCommunities(editedManagerOpenid, authCommunityIdList)
                .then(() => {
                    $timeout(() => {
                        const addition = authCommunityIdList.map($scope.uneditedAdminCommunities.tryRemoveKey).filter(x => !!x);
                        $scope.editedAdminCommunities.tryAddHead(x=>x.id, addition);
                        $scope.adminData.manager.$[editedManagerOpenid].communities = $scope.editedAdminCommunities.toArray();
                    });
                    alert("授权成功！");
                })
                .catch(err => {
                    console.log(err);
                });
        };

        //删除授权
        $scope.unAuthCommunity = () => {
            const unauthCommunityList = angular.element("input:checkbox[name='AuthorizedCommunity']:checked");
            if (unauthCommunityList.length === 0) {
                alert("请选择小区！");
                return;
            }
            const sure = confirm("你确定删除该管理员这" + unauthCommunityList.length + "个小区的授权吗？");
            if (!sure) {
                return;
            }
            const unauthCommunityIdList: Guid[] = mapToArray(unauthCommunityList, x => x.value);

            $iot.accounts
                .unAuthCommunities(editedManagerOpenid, unauthCommunityIdList)
                .then(() => {
                    $timeout(() => {
                        const addtion = unauthCommunityIdList.map($scope.editedAdminCommunities.tryRemoveKey).filter(x => !!x);
                        $scope.uneditedAdminCommunities.tryAddHead(x => x.id, addtion);
                        $scope.adminData.manager.$[editedManagerOpenid].communities = $scope.editedAdminCommunities.toArray();
                    });
                    alert("删除成功！");
                })
                .catch(err => {
                    console.log(err);
                });
        };

        /*编辑管理员结束*/

        /*生成邀请码开始*/
        //授权小区下拉
        $scope.authList = true;
        $scope.showList = () => {
            $scope.authList = !$scope.authList;
        };
        $scope.generateInviteCode = remark => {
            if (!remark) {
                alert("请填写备注，以识别你申请的邀请码!");
                return;
            }
            const adPower = angular.element("input:checkbox[name='adPower']:checked");
            const grade = Number($("#userGrade").val());
            const level = Helper.getSeq(adPower).fold(grade, (s, x) => Number(x.value) | s);
            const inputEle = angular.element("input:checkbox[name='auth']:checked");
            const authCommunities = mapToArray(inputEle, x => ({ id: x.value }));
            $iot.accounts
                .newInviteCode(level, authCommunities, remark)
                .then(data => {
                    $("#generate").val(data);
                    $timeout(() => {
                        $scope.adminData.manager.addOrUpdate(data, {
                            level,
                            openid: data,
                            remark
                        });
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        };

        /*生成邀请码结束*/

        /*修改密码开始*/
        $scope.changepwd = (oldPwd, newPwd) => {
            if (!oldPwd || !newPwd) {
                alert("请填写旧密码或者新密码！");
                return;
            }
            $iot.manage
                .changePassword(oldPwd, newPwd)
                .then(data => {
                    alert("密码修改成功");
                })
                .catch(err => {
                    console.log(err);
                });
        };
        /*修改密码结束*/

        $scope.communityData = new MainView();

        /*小区结构开始*/
        let treeData: TreeItem[] = [];
        let treeComData: TreeItem; //小区数据
        let blockData: BlockItem; //楼数据
        let unitData: UnitItem; //单元数据
        let roomData: FlatItem; //房间数据
        $scope.addTree = true;
        $scope.closeaddTree = () => {
            $scope.addTree = true;
        };
        $scope.ComStrViewSwitch = {};
        $scope.drawTree = () => {
            if (sideUrlChoose !== 5) {
                return;
            }
            if (treeData.length !== 0) {
                $("#tree").treeview({
                    data: treeData, // 数据不是可选的
                    levels: 3, //水平
                    multiSelect: false //多
                });
                $("#tree").on("nodeSelected", (event, data) => {
                    switch (data.id) {
                        case "0":
                            treeComData = data;
                            $timeout(() => {
                                $scope.ComStrViewSwitch.mode = "0";
                                $scope.ComStrViewSwitch.buildingID = "";
                                $scope.ComStrViewSwitch.buildingName = "";
                            });
                            break;
                        case "1":
                            blockData = data;
                            $timeout(() => {
                                $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                                $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                                $scope.ComStrViewSwitch.unitID = "";
                                $scope.ComStrViewSwitch.unitName = "";
                                $scope.ComStrViewSwitch.mode = "1";
                            });
                            break;
                        case "2":
                            unitData = data;
                            $timeout(() => {
                                $scope.ComStrViewSwitch.mode = "2";
                                $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                                $scope.ComStrViewSwitch.editunitName = data.unitName;
                            });
                            break;
                        case "3":
                            roomData = data;
                            $timeout(() => {
                                $scope.ComStrViewSwitch.mode = "3";
                                $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                            });
                            break;
                    }
                    $scope.addTree = false;
                });
            }
        };
        $scope.SendArch = com => {
            if (!com.id) {
                return;
            }
            $rootScope.currentCommunity = true;
            //请求小区结构数据
            $scope.asideView = false;
            $iot.communities.loadArch(com.id).then(data => {
                $timeout(() => {
                    $scope.communityData.address = data;
                    $scope.addTree = true;
                });
                if (!data.guid) {
                    treeData = [
                        {
                            text: com.name,
                            id: "0",
                            guid: com.id,
                            nodes: []
                        }
                    ];
                    $("#tree").treeview({
                        data: treeData, // 数据不是可选的
                        levels: 2, //水平
                        multiSelect: false //多
                    });
                    $("#tree").on("nodeSelected", (event, data: NodeItem) => {
                        switch (data.id) {
                            case "0":
                                $timeout(() => {
                                    $scope.ComStrViewSwitch.mode = "0";
                                });
                                treeComData = data;
                                break;
                            case "1":
                                $timeout(() => {
                                    $scope.ComStrViewSwitch.mode = "1";
                                });
                                blockData = data;
                                break;
                            case "2":
                                $timeout(() => {
                                    $scope.ComStrViewSwitch.mode = "2";
                                });
                                unitData = data;
                                break;
                            case "3":
                                $timeout(() => {
                                    $scope.ComStrViewSwitch.mode = "3";
                                });
                                roomData = data;
                                break;
                        }
                        $scope.addTree = false;
                    });
                } else {
                    treeData = Helper.toTreeItem(data);
                    $("#tree").treeview({
                        data: treeData, // 数据不是可选的
                        levels: 3, //水平
                        multiSelect: false //多
                    });
                    $("#tree").on("nodeSelected", (event, data: TreeItem | BlockItem | UnitItem | FlatItem) => {
                        switch (data.id) {
                            case "0":
                                treeComData = data;
                                $timeout(() => {
                                    $scope.ComStrViewSwitch.mode = "0";
                                    $scope.ComStrViewSwitch.buildingID = "";
                                    $scope.ComStrViewSwitch.buildingName = "";
                                });
                                break;
                            case "1":
                                blockData = data;
                                $timeout(() => {
                                    $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                                    $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                                    $scope.ComStrViewSwitch.unitID = "";
                                    $scope.ComStrViewSwitch.unitName = "";
                                    $scope.ComStrViewSwitch.mode = "1";
                                });
                                break;
                            case "2":
                                unitData = data;
                                $timeout(() => {
                                    $scope.ComStrViewSwitch.mode = "2";
                                    $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                                    $scope.ComStrViewSwitch.editunitName = data.unitName;
                                });
                                break;
                            case "3":
                                roomData = data;
                                $timeout(() => {
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
            $iot.persons.sum(com.id).then(data => {
                $timeout(() => {
                    $scope.communityData.personnel = data.copy;
                });
            });
            //请求设备数据
            $iot.devices.items(com.id, data => {
                $timeout(() => {
                    $scope.communityData.devices = data;
                    $scope.ChooseauthDevice = data.copy;
                    $scope.unalreadyAuthFingerprint = data.copy;
                });
            });
            //请求卡数据
            $iot.cards.sum(com.id).then((data: Card[]) => {
                console.log(data);
                $timeout(() => {
                    $scope.communityData.cards = data.slice(0);
                    $scope.card_viewData = data.slice(0);
                });
            });
            //请求指纹数据
            $iot.fingerprints.sum(com.id).then((data: Fingerprint[]) => {
                $timeout(() => {
                    $scope.communityData.Fingerprints = data.slice(0);
                    $scope.fingerprint_viewData = data.slice(0);
                });
            });
        };

        //添加楼
        $scope.addBuilding = (id, name) => {
            if (!id || !name) {
                alert("请填写完整信息！");
                return;
            }
            if (!Vadicate.blockId(id)) {
                return;
            }
            if (treeData[0].nodes.some(item => item.blockNumber === id)) {
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
            treeData[0].nodes = orderBy(treeData[0].nodes, "blockNumber");
            $("#tree").treeview({
                data: treeData, // 数据不是可选的
                levels: 2, //水平
                multiSelect: false //多
            });
            $("#tree").on("nodeSelected", (event, data) => {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        //修改楼
        $scope.editBuilding = (id, name) => {
            if (!id || !name) {
                alert("请填写完整信息");
                return;
            }
            if (!Vadicate.blockId(id)) {
                return;
            }
            for (let i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber === blockData.blockNumber) {
                    const otherFloor = treeData[0].nodes.filter((item, index) => index !== i);
                    if (otherFloor.some(item => item.blockNumber === id)) {
                        alert("该楼号重复！！");
                        return;
                    }
                    treeData[0].nodes[i].blockName = name;
                    treeData[0].nodes[i].blockNumber = id;
                    treeData[0].nodes[i].text = id + "--" + name;
                    break;
                }
            }
            treeData[0].nodes = orderBy(treeData[0].nodes, "blockNumber");
            $("#tree").treeview({
                data: treeData, // 数据不是可选的
                levels: 2, //水平
                multiSelect: false //多
            });
            $("#tree").on("nodeSelected", (event, data) => {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        //删除楼
        $scope.deleteBuilding = () => {
            for (let i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockName === blockData.blockNumber) {
                    if ($scope.communityData.devices.some(t => Helper.deviceAddressToStr(t.address).slice(0, 4) === blockData.blockNumber)) {
                        alert("请先清除节点下的设备！");
                        return;
                    }
                    treeData[0].nodes.splice(i, 1);
                    break;
                }
            }
            $("#tree").treeview({
                data: treeData, // 数据不是可选的
                levels: 2, //水平
                multiSelect: false //多
            });
            $timeout(() => {
                $scope.ComStrViewSwitch.mode = "0";
                $scope.ComStrViewSwitch.editbuildingID = "";
                $scope.ComStrViewSwitch.editbuildingName = "";
            });
            $("#tree").on("nodeSelected", (event, data) => {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        //添加单元
        $scope.addunit = (unitid, unitname) => {
            if (!unitid || !unitname) {
                alert("请填写完整信息！");
                return;
            }
            if (!Vadicate.unitId(unitid)) {
                return;
            }
            for (let i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber === blockData.blockNumber) {
                    if (treeData[0].nodes[i].nodes.some(item => item.unitNumber === unitid)) {
                        alert("单元号重复！");
                        return;
                    }
                    treeData[0].nodes[i].nodes.push({
                        text: unitid + "--" + unitname,
                        id: "2",
                        blockNumber: blockData.blockNumber,
                        unitNumber: unitid,
                        unitName: unitname,
                        nodes: []
                    });
                    treeData[0].nodes[i].nodes = orderBy(treeData[0].nodes[i].nodes, "unitNumber");
                }
            }
            $("#tree").treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $("#tree").on("nodeSelected", (event, data) => {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        //修改单元
        $scope.editunit = (editunitId, editunitName) => {
            if (!editunitId || !editunitName) {
                alert("请填写完整信息！");
                return;
            }
            if (!Vadicate.unitId(editunitId)) {
                return;
            }
            for (let i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber === unitData.blockNumber) {
                    for (let j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                        if (treeData[0].nodes[i].nodes[j].unitNumber === unitData.unitNumber) {
                            const otherunit = treeData[0].nodes[i].nodes.filter((item, index) => index !== j);
                            if (otherunit.some(item => item.unitNumber === editunitId)) {
                                alert("单元号重复！");
                                return;
                            }
                            treeData[0].nodes[i].nodes[j].text = editunitId + "--" + editunitName;
                            treeData[0].nodes[i].nodes[j].unitNumber = editunitId;
                            treeData[0].nodes[i].nodes[j].unitName = editunitName;
                            treeData[0].nodes[i].nodes = orderBy(treeData[0].nodes[i].nodes, "unitNumber");
                            break;
                        }
                    }
                    break;
                }
            }
            $("#tree").treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $("#tree").on("nodeSelected", (event, data) => {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        $scope.deleteunit = () => {
            if (
                $scope.communityData.devices
                    .filter(t => Helper.deviceAddressToStr(t.address).slice(0, 4) === unitData.blockNumber)
                    .some(t => Helper.deviceAddressToStr(t.address).slice(4, 6) === unitData.unitNumber)
            ) {
                alert("请先清除节点下的设备！");
                return;
            }
            for (let i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber === unitData.blockNumber) {
                    for (let j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                        if (treeData[0].nodes[i].nodes[j].unitNumber === unitData.unitNumber) {
                            treeData[0].nodes[i].nodes.splice(j, 1);
                            break;
                        }
                    }
                    break;
                }
            }
            $("#tree").treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $("#tree").on("nodeSelected", (event, data) => {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        $scope.addroom = (roomidstart, roomidend, storeyidstart, storeyidend) => {
            if (!roomidstart || !roomidend || !storeyidstart || !storeyidend) {
                alert("请填写完整信息！");
                return;
            }
            console.log(`roomidstart:${roomidstart}\nroomidend:${roomidend}\nstoreyidstart:${storeyidstart}\nstoreyidend:${storeyidend}`);
            if (!Vadicate.flatId(roomidstart, roomidend)) {
                return;
            }
            if (!Vadicate.flatId(storeyidstart, storeyidend)) {
                return;
            }

            const floorStart = Number(storeyidstart);
            const floorEnd = Number(storeyidend);
            const roomStart = Number(roomidstart);
            const roomEnd = Number(roomidend);
            const resultroom: string[] = [];
            for (let fr = floorStart; fr <= floorEnd; fr++) {
                for (let rn = roomStart; rn <= roomEnd; rn++) {
                    const id = (fr * 100 + rn + 10000).toString().slice(-4);
                    resultroom.push(id);
                }
            }
            const block = Helper.findInArray(treeData[0].nodes, x => x.blockNumber === unitData.blockNumber);
            if (block) {
                const unit = Helper.findInArray(block.nodes, x => x.unitNumber === unitData.unitNumber);
                if (unit) {
                    const addtion = resultroom.filter(t => !unit.nodes.some(x => x.roomNumber === t)).map(
                        t =>
                            ({
                                text: t,
                                blockNumber: unitData.blockNumber,
                                unitNumber: unitData.unitNumber,
                                roomNumber: t,
                                id: "3",
                                guid: ""
                            } as FlatItem)
                    );
                    unit.nodes = Helper.sortedMerge(addtion, unit.nodes, 0, (a, b) => a.roomNumber.localeCompare(b.roomNumber));
                }
            }

            $("#tree").treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $("#tree").on("nodeSelected", (event, data) => {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        $scope.editroom = editroomId => {
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
            for (let i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber === roomData.blockNumber) {
                    for (let j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                        if (treeData[0].nodes[i].nodes[j].unitNumber === roomData.unitNumber) {
                            for (let n = 0; n < treeData[0].nodes[i].nodes[j].nodes.length; n++) {
                                if (treeData[0].nodes[i].nodes[j].nodes[n].roomNumber === roomData.roomNumber) {
                                    treeData[0].nodes[i].nodes[j].nodes[n].text = editroomId;
                                    treeData[0].nodes[i].nodes[j].nodes[n].roomNumber = editroomId;
                                    treeData[0].nodes[i].nodes[j].nodes = orderBy(treeData[0].nodes[i].nodes[j].nodes, "roomNumber");
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    break;
                }
            }
            $("#tree").treeview({
                data: treeData, // 数据不是可选的
                levels: 3, //水平
                multiSelect: false //多
            });
            $("#tree").on("nodeSelected", (event, data) => {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        $scope.deleteroom = () => {
            for (let i = 0; i < treeData[0].nodes.length; i++) {
                if (treeData[0].nodes[i].blockNumber === roomData.blockNumber) {
                    for (let j = 0; j < treeData[0].nodes[i].nodes.length; j++) {
                        if (treeData[0].nodes[i].nodes[j].unitNumber === roomData.unitNumber) {
                            for (let n = 0; n < treeData[0].nodes[i].nodes[j].nodes.length; n++) {
                                if (treeData[0].nodes[i].nodes[j].nodes[n].roomNumber === roomData.roomNumber) {
                                    treeData[0].nodes[i].nodes[j].nodes.splice(n, 1);
                                    $timeout(() => {
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
            $("#tree").treeview({
                data: treeData, // 数据不是可选的
                levels: 4, //水平
                multiSelect: false //多
            });
            $("#tree").on("nodeSelected", (event, data) => {
                switch (data.id) {
                    case "0":
                        treeComData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "0";
                            $scope.ComStrViewSwitch.buildingID = "";
                            $scope.ComStrViewSwitch.buildingName = "";
                        });
                        break;
                    case "1":
                        blockData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                            $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                            $scope.ComStrViewSwitch.unitID = "";
                            $scope.ComStrViewSwitch.unitName = "";
                            $scope.ComStrViewSwitch.mode = "1";
                        });
                        break;
                    case "2":
                        unitData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "2";
                            $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                            $scope.ComStrViewSwitch.editunitName = data.unitName;
                        });
                        break;
                    case "3":
                        roomData = data;
                        $timeout(() => {
                            $scope.ComStrViewSwitch.mode = "3";
                            $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                        });
                        break;
                }
            });
        };
        $scope.SubmitComTree = () => {
            const submitData: CommunityData = {
                name: treeData[0].text,
                guid: treeData[0].guid,
                buildings: []
            };
            treeData[0].nodes.forEach((flooritem, floorindex) => {
                submitData.buildings.push({
                    id: flooritem.blockNumber,
                    name: flooritem.blockName,
                    units: []
                });
                flooritem.nodes.forEach((unititem, unitindex) => {
                    submitData.buildings[floorindex].units.push({
                        id: unititem.unitNumber,
                        name: unititem.unitName,
                        apartments: []
                    });
                    unititem.nodes.forEach(roomitem => {
                        submitData.buildings[floorindex].units[unitindex].apartments.push({
                            id: roomitem.roomNumber,
                            guid: roomitem.guid
                        });
                    });
                });
            });
            $iot.communities
                .updateArch(submitData)
                .then(_ => {
                    alert("提交成功");
                    $iot.communities.loadArch(treeData[0].guid).then(data => {
                        $timeout(() => {
                            $scope.communityData.address = data;
                        });
                        treeData = Helper.toTreeItem(data);
                        $("#tree").treeview({
                            data: treeData, // 数据不是可选的
                            levels: 3, //水平
                            multiSelect: false //多
                        });
                        $("#tree").on("nodeSelected", (event, data: TreeItem | BlockItem | UnitItem | FlatItem) => {
                            switch (data.id) {
                                case "0":
                                    treeComData = data;
                                    $timeout(() => {
                                        $scope.ComStrViewSwitch.mode = "0";
                                        $scope.ComStrViewSwitch.buildingID = "";
                                        $scope.ComStrViewSwitch.buildingName = "";
                                    });
                                    break;
                                case "1":
                                    blockData = data;
                                    $timeout(() => {
                                        $scope.ComStrViewSwitch.editbuildingID = data.blockNumber;
                                        $scope.ComStrViewSwitch.editbuildingName = data.blockName;
                                        $scope.ComStrViewSwitch.unitID = "";
                                        $scope.ComStrViewSwitch.unitName = "";
                                        $scope.ComStrViewSwitch.mode = "1";
                                    });
                                    break;
                                case "2":
                                    unitData = data;
                                    $timeout(() => {
                                        $scope.ComStrViewSwitch.mode = "2";
                                        $scope.ComStrViewSwitch.editunitID = data.unitNumber;
                                        $scope.ComStrViewSwitch.editunitName = data.unitName;
                                    });
                                    break;
                                case "3":
                                    roomData = data;
                                    $timeout(() => {
                                        $scope.ComStrViewSwitch.mode = "3";
                                        $scope.ComStrViewSwitch.editroomID = data.roomNumber;
                                    });
                                    break;
                            }
                            $scope.addTree = false;
                        });
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        };
        /*小区结构结束*/

        /*人员管理开始*/
        $scope.editing = true;
        $scope.addAddressList = [];
        $scope.nationList = Helper.nationList;
        $scope.pac = Helper.pcaCode;
        $scope.relativeList = Helper.relativeConstans;
        $scope.newPerson = { rooms: [] } as any;
        $scope.roomSample = {} as any;
        let refreshOrNo = true;

        function roomToView(name: string, value: RoomBinding): RoomView {
            return {
                id: value.id,
                name: name,
                living: value.living,
                relative: value.relative,
                rentalStart: value.rentalStart ? new Date(value.rentalStart * 1000) : undefined,
                rentalEnd: value.rentalEnd ? new Date(value.rentalEnd * 1000) : undefined,
                uniform: value.uniform
            };
        }
        function roomFromView(value: RoomView): RoomBinding {
            return {
                id: value.id,
                living: value.living,
                relative: value.relative,
                rentalStart: Helper.getUnixTimeSeconds(value.rentalStart),
                rentalEnd: Helper.getUnixTimeSeconds(value.rentalEnd),
                uniform: value.uniform,
            };

        }
        function cleanRoomView(room: RoomView) {
            if (room.relative === 10) {
                if (room.rentalStart && room.rentalEnd) {
                    return angular.copy(room);
                } else {
                    alert("请选择租赁区间");
                    return undefined;
                }
            } else {
                return {
                    id: room.id,
                    name: room.name,
                    living: room.living,
                    relative: room.relative,
                    uniform: room.uniform
                };
            }
        }

        $scope.addAddress = (building, unit, room) => {
            if (!building || !unit || !room) {
                alert("请选择完整地址");
                return;
            }
            if ($scope.addAddressList.some((item, index) => item.id === room.guid)) {
                return;
            }
            $scope.roomSample.name = building.name + unit.name + room.id;
            $scope.roomSample.id = room.guid;
            const roomView = cleanRoomView($scope.roomSample);
            if (!roomView) return;

            const roomBinding = roomFromView(roomView);
            $scope.newPerson.rooms.push(roomView);
            $scope.addAddressList.push(roomBinding);
        };
        $scope.deleteAddAddress = id => {
            let deleteIndex: number;
            $scope.newPerson.rooms.map((item, index) => {
                if (item.id === id) {
                    deleteIndex = index;
                }
            });
            $scope.newPerson.rooms.splice(deleteIndex, 1);
            $scope.addAddressList.splice(deleteIndex, 1);
        };
        //根据身份证查询人员
        $scope.queryPersonnerl = (id: string) => {
            if (id.length !== 18) {
                return;
            }
            const validator = new IDValidator();
            if (!validator.isValid(id)) {
                alert("身份证号码格式不正确！");
                return;
            }
            if ($scope.communityData.personnel.containKey(id)) {
                alert("身份证号码重复，请查看是否重复添加！");
                return;
            }
            $iot.persons.get(id).then(data => {
                if (JSON.stringify(data) === "{}") {
                    return;
                }
                $timeout(() => {
                    $scope.newPerson = {
                        id: id,
                        name: data.name,
                        idAddress: data.address,
                        birthday: new Date(data.birthDay),
                        idValidBegin: new Date(data.validFrom),
                        idValidEnd: new Date(data.validTo),
                        mac: data.phoneMac,
                        nation: data.nation,
                        qq: data.QQ,
                        remark: data.remark,
                        sex: data.sex,
                        tel: data.phone,
                        wechat: data.wechat,
                        workUnit: data.wechat,
                        permanent: data.permanent,
                        kind: data.kind,
                        fluidity: data.fluidity,
                    };
                });
            });
        };
        //刷新添加人员地址
        $scope.refreshAddAddressList = () => {
            if (refreshOrNo) {
                $scope.addAddressList = [];
                $scope.newPerson.rooms = [];
                refreshOrNo = false;
            }
        };
        //添加人员
        $scope.addPersonnel = person => {
            if (!person.name) {
                alert("请填写姓名!");
                return;
            }
            if ($scope.addAddressList.length === 0) {
                alert("请添加住址!");
                return;
            }
            const validator = new IDValidator();
            if (person.id) {
                if (!validator.isValid(person.id)) {
                    alert("身份证号码格式不正确！");
                    return;
                }
                if ($scope.communityData.personnel.containKey(person.id)) {
                    alert("身份证号码重复，请查看是否重复添加！");
                    return;
                }
            }

            const addData: Person = {
                name: person.name,
                phone: person.tel,
                nric: person.id,
                QQ: person.qq,
                wechat: person.wechat,
                remark: person.remark,
                occupation: person.workUnit,
                phoneMac: person.mac,
                address: person.idAddress,
                province: person.province ? person.province.name : undefined,
                city: person.city ? person.city.name : undefined,
                district: person.district ? person.district.name : undefined,
                pcaCode: Number(person.district ? person.district.code : person.city ? person.city.code : person.province ? person.province.code : undefined),
                domicile: person.domicile,
                fluidity: person.fluidity,
                head: (person.head || "").substring(22),
                headType: "png",
                kind: person.kind,
                nation: person.nation,
                permanent: person.permanent,
                regCode: person.regCode,
                sex: person.sex,
                validFrom: Helper.getUnixTimeSeconds(person.idValidBegin),
                validTo: Helper.getUnixTimeSeconds(person.idValidEnd),
                birthDay: Helper.getUnixTimeSeconds(person.birthday),
                rooms: $scope.addAddressList.slice(0)
            };
            console.log(addData);
            $iot.persons
                .put(addData)
                .then((data: Nric) => {
                    addData.nric = data;
                    $timeout(() => {
                        refreshOrNo = true;
                        $scope.communityData.personnel.addOrUpdate(data, addData);
                        $scope.alertSuccess = true;
                        $timeout(() => {
                            $scope.alertSuccess = false;
                        }, 2000);
                    });
                })
                .catch(() => {
                    $timeout(() => {
                        $scope.alertFail = true;
                        $timeout(() => {
                            $scope.alertFail = false;
                        }, 2000);
                    });
                });
        };
        //选定人员
        let deletechoosePersonId: string;
        $scope.choosePersonnel = person => {
            $scope.chooseBackColor = person.nric;
            deletechoosePersonId = person.nric;
            $scope.choosePersonEdit = person;
            $scope.editing = person.nric.length === 18;
            console.log(Helper.pacCodeDict);
            function getpcas() {
                if (person.pcaCode) {
                    const pcaCode = person.pcaCode.toString();
                    if (pcaCode.length >= 2) {
                        const province = Helper.pacCodeDict.$[pcaCode.substr(0, 2)];
                        if (pcaCode.length >= 4) {
                            const city = province.$[pcaCode.substr(0, 4)];
                            if (pcaCode.length === 6) {
                                const district = city.$[pcaCode];
                                return [province.value, city.value, district];
                            }
                            return [province.value, city.value];
                        }
                        return [province.value];
                    }
                }
                return[];
            }

            const pcas = getpcas();

            $scope.curPerson = {
                id: $scope.editing ? person.nric : undefined,
                name: person.name,
                sex: person.sex,
                head: person.head ? `data:image/png;base64,${person.head}` : "",
                province: pcas[0],
                city: pcas[1],
                district: pcas[2],
                domicile: person.domicile,
                fluidity: person.fluidity,
                idAddress: person.address,
                idValidBegin: new Date(person.validFrom*1000),
                idValidEnd: new Date(person.validTo*1000),
                birthday: new Date(person.birthDay*1000),
                kind: person.kind,
                mac: person.phoneMac,
                tel: person.phone,
                nation: person.nation,
                qq: person.QQ,
                wechat: person.wechat,
                permanent: person.permanent,
                regCode: person.regCode,
                remark: person.remark,
                workUnit: person.occupation,
                rooms: person.rooms.map(x => {
                    const name = $filter("roomName")(x.id);
                    return roomToView(name, x);
                })
            };

        };
        //添加选定人员背景
        $scope.chooseStyle = person => ($scope.chooseBackColor === person.nric ? "success" : "");
        //删除人员
        $scope.deletePersonnel = () => {
            if (!deletechoosePersonId) {
                alert("请选择你要删除的人员！");
                return;
            }
            const sure = confirm("你确定删除这个人员信息吗？");
            if (!sure) {
                return;
            }
            $iot.persons
                .delete(treeData[0].guid, deletechoosePersonId)
                .then(() => {
                    $timeout(() => {
                        $scope.communityData.personnel.tryRemoveKey(deletechoosePersonId);
                    });
                    alert("删除成功！");
                })
                .catch(err => {
                    console.log(err);
                });
        };
        //修改人员
        $scope.editAddAddress = (building, unit, room) => {
            if (!building || !unit || !room) {
                alert("请选择完整地址");
                return;
            }
            if ($scope.curPerson.rooms.some((item, index) => item.id === room.guid)) {
                return;
            }
            $scope.roomSample.name = building.name + unit.name + room.id;
            $scope.roomSample.id = room.guid;
            const roomView = cleanRoomView($scope.roomSample);
            if (!roomView) return;
            $scope.curPerson.rooms.push(roomView);
        };
        $scope.editDeleteAddAddress = id => {
            $scope.curPerson.rooms = $scope.curPerson.rooms.filter(x => x.id !== id);
        };
        $scope.editPerson = person => {
            if (!person.name) {
                alert("请填写姓名!");
                return;
            }
            if ($scope.curPerson.rooms.length === 0) {
                alert("请添加住址!");
                return;
            }
            const editData: Person = {
                name: person.name,
                phone: person.tel,
                nric: $scope.choosePersonEdit.nric,
                QQ: person.qq,
                wechat: person.wechat,
                remark: person.remark,
                occupation: person.workUnit,
                phoneMac: person.mac,
                address: person.idAddress,
                province: person.province ? person.province.name : undefined,
                city: person.city ? person.city.name : undefined,
                district: person.district ? person.district.name : undefined,
                pcaCode: Number(person.district ? person.district.code : person.city ? person.city.code : person.province ? person.province.code : undefined),
                domicile: person.domicile,
                fluidity: person.fluidity,
                head: (person.head || "").substring(22) || undefined,
                headType: "png",
                kind: person.kind,
                nation: person.nation,
                permanent: person.permanent,
                regCode: person.regCode,
                sex: person.sex,
                validFrom: Helper.getUnixTimeSeconds(person.idValidBegin),
                validTo: Helper.getUnixTimeSeconds(person.idValidEnd),
                birthDay: Helper.getUnixTimeSeconds(person.birthday),
                // rooms: $scope.addAddressList.slice(0),
                newNric: $scope.editing ? undefined : (person.id || undefined)
            };
            const validatoredit = new IDValidator();
            if (!$scope.editing) {
                if (person.id) {
                    if (!validatoredit.isValid(person.id)) {
                        alert("身份证号码格式不正确！");
                        return;
                    }
                    if ($scope.communityData.personnel.containKey(person.id)) {
                        alert("身份证号码重复，请查看是否重复添加！");
                        return;
                    }
                }
            }
            const deleteRooms = $scope.choosePersonEdit.rooms
                .filter(item => !$scope.curPerson.rooms.some(x => angular.equals(item, x)))
                .map(x => x.id);
            const addRooms = $scope.curPerson.rooms
                .map(roomFromView)
                .filter(item => !$scope.choosePersonEdit.rooms.some(x => angular.equals(item, x)));
            editData.deleteRooms = deleteRooms;
            editData.rooms = addRooms;
            console.log("提交数据：");
            console.log(editData);
            $iot.persons
                .put(editData)
                .then(nric => {
                    $timeout(() => {
                        const x = $scope.communityData.personnel.import(nric, editData);
                        if (x) {
                            x.nric = nric;
                            x.rooms = $scope.curPerson.rooms.map(roomFromView);
                            delete x.deleteRooms;
                        }
                        $scope.alertSuccess = true;
                        $timeout(() => {
                            $scope.alertSuccess = false;
                        }, 2000);
                    });
                })
                .catch(() => {
                    $timeout(() => {
                        $scope.alertFail = true;
                        $timeout(() => {
                            $scope.alertFail = false;
                        }, 2000);
                    });
                });
        };

        /*人员管理结束*/

        /*设备管理开始*/
        let choosedeviceId: number;
        //添加设备
        $scope.addDevice = (addressBuilding, addressUnit, deviceNumber, devicePwd, deviceRemark) => {
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
            const deviceId = Number(addressBuilding.id + addressUnit.id + deviceNumber);
            if ($scope.communityData.devices.some(item => Number(deviceId) === item.address)) {
                alert("该设备地址已经添加！");
                return;
            }
            const addDeviceData: Device = {
                communityId: $scope.communityData.address.guid,
                password: devicePwd,
                address: deviceId,
                remark: deviceRemark
            };
            $iot.devices
                .put(addDeviceData)
                .then(data => {
                    $timeout(() => {
                        $scope.communityData.devices.addOrUpdate(data.id, data);
                        $scope.ChooseauthDevice.addOrUpdate(data.id, data);
                        $scope.unalreadyAuthFingerprint.addOrUpdate(data.id, data);
                    });
                    alert("提交成功");
                })
                .catch(err => {
                    console.log(err);
                });
        };
        //选定设备
        $scope.chooseDevice = device => {
            choosedeviceId = device.address;
            $scope.choosedeviceGuid = device.id;
            $scope.newDevicepwd = device.password;
            $scope.newRemark = device.remark;
        };
        //选定设备高亮
        $scope.chooseDeviceStyle = device => (device.address === choosedeviceId ? "success" : "");
        //删除设备
        $scope.deleteDevice = () => {
            if (!choosedeviceId) {
                alert("请选择你要删除的设备！");
                return;
            }
            const sure = confirm("你确定删除这个设备吗？");
            if (!sure) {
                return;
            }
            $iot.devices
                .delete($scope.choosedeviceGuid)
                .then(() => {
                    $timeout(() => {
                        $scope.communityData.devices.tryRemoveKey($scope.choosedeviceGuid);
                        $scope.ChooseauthDevice.tryRemoveKey($scope.choosedeviceGuid);
                        $scope.unalreadyAuthFingerprint.tryRemoveKey($scope.choosedeviceGuid);
                    });
                    alert("删除成功！");
                })
                .catch(err => {
                    console.log(err);
                });
        };
        //修改设备密码
        $scope.editDevicepwd = (newDevicepwd, newRemark) => {
            if (newDevicepwd.length < 6) {
                alert("密码需要大于6位数");
                return;
            }
            if (isNaN(Number(newDevicepwd))) {
                alert("密码必须为数字");
                return;
            }
            const changepwd: Device = {
                id: $scope.choosedeviceGuid,
                password: newDevicepwd,
                remark: newRemark
            };
            $iot.devices
                .put(changepwd)
                .then(data => {
                    if (data) {
                        $timeout(() => {
                            const x = $scope.communityData.devices.$[$scope.choosedeviceGuid];
                            if (x) {
                                x.password = newDevicepwd;
                                x.remark = newRemark;
                            }
                        });
                        alert("修改成功");
                    } else {
                        alert("修改失败");
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        };
        /*设备管理结束*/

        /*门禁卡管理开始*/
        //选定待授权设备判断是否可以绑定房间
        $scope.selectAuthDevice = () => {
            //获取选择的门口机
            const authDevice = angular.element("input:checkbox[name='chooseAuthDevice']:checked");
            //获取的门口机地址列表
            const authDeviceAddress: string[] = mapToArray(authDevice, x => {
                const itemValue: Device = angular.fromJson(x.value);
                return Helper.deviceAddressToStr(itemValue.address);
            });
            if (authDeviceAddress.length === 0) {
                $scope.chooseBinding = true; //禁用绑定房复选框
                $scope.alreadyBinding = false; //禁用选择绑定房号下拉框
                return;
            }

            //如果是同一栋同一个单元，获取它的所有房间
            const getTheFlats = () => {
                const first = authDeviceAddress[0].slice(0, 6);
                if (authDeviceAddress.length > 1) {
                    for (let i = 1; i < authDeviceAddress.length; i++) {
                        if (authDeviceAddress[i].slice(0, 10) !== first) {
                            return Helper.none<Dict<FlatData>>();
                        }
                    }
                }
                const block = first.slice(0, 4);
                const unit = first.slice(4);
                const flats = $iot.current.arch.communityX.items.$[block].items.$[unit].items;
                return Helper.val(flats);
            };
            getTheFlats()
                .data(flats => {
                    $scope.chooseBinding = false; //启用绑定房复选框
                    if ($("#alreadyBindingAuth").is(":checked")) {
                        $scope.alreadyBinding = true; //启用选择绑定房号下拉框
                    }
                    $scope.bindingRoom = flats.toArray(
                        x =>
                            <BindingRoom>{
                                room: x.id,
                                id: authDeviceAddress[0].slice(0, 6) + x
                            }
                    );
                })
                .none(() => {
                    $scope.chooseBinding = true;
                    $scope.alreadyBinding = false;
                    $scope.bindingRoom = [];
                });
        };

        $scope.addCardNumberValidate = true; //添加卡号验证提醒文字显示
        $scope.addcardPersonnelsValidate = true; //添加卡号，用户验证提醒文字显示
        $scope.addCardcomplete = true; //添加卡完成提醒文字显示
        $scope.chooseBinding = true;
        $scope.authCompleteinfo = [];
        //卡号验证
        function validateCardNumber(cardNumber: string): boolean {
            const characterArr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
            const cardNumberLow: string[] = Array.prototype.slice.call(cardNumber.toLowerCase());
            return cardNumberLow.every(t => characterArr.indexOf(t) !== -1);
        }

        //添加卡选择房间的时候过滤人员
        $scope.cardPersonnels = Dict.ofArray<Person>(t => t.nric, []);
        $scope.cardPersonnel = {};
        $scope.roomPersonnel = roomId => {
            if (!roomId) {
                $scope.cardPersonnel = {};
                return;
            }
            const predicate = (item: Person) => item.rooms.some(x => x.id === roomId.guid);
            $scope.cardPersonnels = $scope.communityData.personnel.filter(predicate);
            if ($scope.cardPersonnels.length !== 0) {
                $scope.cardPersonnel.x = $scope.cardPersonnels.first.nric;
            }
        };
        //打开添加卡modal
        $scope.openAddCard = () => {
            $scope.speedyAddCardSuccessList = [];
            $("#speedyAddCard_input").val("");
        };
        //添加卡方式
        $scope.showSpeedyAddCard = true;
        $scope.switchAddCard = () => {
            $scope.showSpeedyAddCard = !$scope.showSpeedyAddCard;
            $scope.speedyAddCardSuccessList = [];
            $("#speedyAddCard_input").val("");
        };
        //快速添加卡信息提醒
        $scope.speedyAddCardInfo = true;
        //快速添加卡
        $scope.addCard_speedy = (event, cardNumber) => {
            const keyCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
            if (keyCode === 13) {
                if (!cardNumber) {
                    return;
                }
                if (!validateCardNumber(cardNumber)) {
                    $scope.speedyAddCardInfo = false;
                    $timeout(() => {
                        $scope.speedyAddCardInfo = true;
                    }, 2000);
                    $(".speedyAddNumber").text("卡号不符合规则！");
                    return;
                }
                if ($scope.communityData.cards.some(t => t.serial === cardNumber)) {
                    $scope.speedyAddCardInfo = false;
                    $("#speedyAddCard_input").val("");
                    $(".speedyAddNumber").text("卡号重复！");
                    $timeout(() => {
                        $scope.speedyAddCardInfo = true;
                    }, 2000);
                    return;
                }
                const addCardData: Card = {
                    communityId: $scope.communityData.address.guid,
                    serial: cardNumber
                };
                $iot.cards
                    .put(addCardData)
                    .then((data: Card) => {
                        if (!data.id) {
                            $(".speedyAddNumber").text("添加失败!");
                            $timeout(() => {
                                $scope.speedyAddCardInfo = false;
                                $timeout(() => {
                                    $scope.speedyAddCardInfo = true;
                                }, 2000);
                            });
                        } else {
                            $timeout(() => {
                                $scope.speedyAddCardSuccessList.unshift(cardNumber);
                                $("#speedyAddCard_input").val("");
                                data.auth = [];
                                $scope.communityData.cards.unshift(data);
                                $scope.card_viewData.unshift(data);
                            });
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        };
        //正常添加卡
        $scope.addCard = (cardNumber, cardPersonnel) => {
            if (!cardNumber) {
                $scope.addCardNumberValidate = false;
                $timeout(() => {
                    $scope.addCardNumberValidate = true;
                }, 3000);
                $(".addNumber").text("请填写卡号！");
                return;
            }
            if (cardNumber.length < 8) {
                $scope.addCardNumberValidate = false;
                $timeout(() => {
                    $scope.addCardNumberValidate = true;
                }, 3000);
                $(".addNumber").text("卡号需要大于8位！");
                return;
            }
            if (!validateCardNumber(cardNumber)) {
                $scope.addCardNumberValidate = false;
                $timeout(() => {
                    $scope.addCardNumberValidate = true;
                }, 3000);
                $(".addNumber").text("卡号不符合规则！");
                return;
            }
            if ($scope.communityData.cards.some(t => t.serial === cardNumber)) {
                $scope.addCardNumberValidate = false;
                $timeout(() => {
                    $scope.addCardNumberValidate = true;
                }, 3000);
                $(".addNumber").text("卡号重复！");
                return;
            }
            if (!cardPersonnel) {
                $scope.addcardPersonnelsValidate = false;
                $timeout(() => {
                    $scope.addcardPersonnelsValidate = true;
                }, 3000);
                $(".addCardPersonnels").text("请选择持卡人！");
                return;
            }
            const addCardData = {
                communityId: $scope.communityData.address.guid,
                nric: cardPersonnel,
                serial: cardNumber
            };
            $iot.cards
                .put(addCardData)
                .then((data: Card) => {
                    if (!data.id) {
                        $(".addCardcomplete").text("添加失败，请查看卡号是否重复!");
                        $timeout(() => {
                            $scope.addCardcomplete = false;
                        });
                    } else {
                        $(".addCardcomplete").text("添加成功");
                        $timeout(() => {
                            $scope.addCardcomplete = false;
                            data.auth = [];
                            $scope.communityData.cards.unshift(data);
                            $scope.card_viewData.unshift(data);
                        });
                    }
                    $timeout(() => {
                        $scope.addCardcomplete = true;
                    }, 3000);
                })
                .catch(err => {
                    console.log(err);
                });
        };
        //选定卡
        let lastTimeCard: number;
        let thisTimeCard: number;
        $scope.chooseCard = (index, event, card) => {
            const $target = $("#" + index);
            if (event.shiftKey) {
                thisTimeCard = Number(index);
                if (lastTimeCard !== undefined) {
                    if (thisTimeCard > lastTimeCard) {
                        for (let i = lastTimeCard; i <= thisTimeCard; i++) {
                            $("#" + i).attr("checked", <any>true);
                            $("#" + i)
                                .parent()
                                .parent()
                                .addClass("bg-success");
                        }
                    } else {
                        for (let i = thisTimeCard; i <= lastTimeCard; i++) {
                            $("#" + i).attr("checked", <any>true);
                            $("#" + i)
                                .parent()
                                .parent()
                                .addClass("bg-success");
                        }
                    }
                    lastTimeCard = Number(index);
                    document.getSelection().empty();
                } else {
                    $target.attr("checked", <any>true);
                    $target
                        .parent()
                        .parent()
                        .addClass("bg-success");
                    lastTimeCard = Number(index);
                }
            } else {
                if ($target.is(":checked")) {
                    $target.attr("checked", <any>false);
                    $target
                        .parent()
                        .parent()
                        .removeClass("bg-success");
                    lastTimeCard = Number(index);
                } else {
                    $target.attr("checked", <any>true);
                    $target
                        .parent()
                        .parent()
                        .addClass("bg-success");
                    lastTimeCard = Number(index);
                }
            }
            const selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            const selectCardList: Card[] = mapToArray(selectCard, x => angular.fromJson(x.value)); //选择卡的列表
            if (selectCardList.length === 0) {
                $scope.tobe_editCardList = [];
                $scope.cardEdit_show = false;
            } else {
                if (selectCardList.every(value => value.auth.length === 0)) {
                    $scope.tobe_editCardList = selectCardList;
                    $scope.cardEdit_show = true;
                } else {
                    $scope.tobe_editCardList = [];
                    $scope.cardEdit_show = false;
                }
            }
            $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
            $scope.alreadyAuth = Helper.unionAuths(selectCardList);
        };
        //全选卡
        $scope.selectAllCard = () => {
            const cardAll = $("input:checkbox[name='chooseAuthCard']");
            cardAll.attr("checked", <any>true);
            cardAll
                .parent()
                .parent()
                .addClass("bg-success");
            const selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            const selectCardList: Card[] = mapToArray(selectCard, x => angular.fromJson(x.value)); //选择卡的列表
            if (selectCardList.every(value => value.auth.length === 0)) {
                $scope.tobe_editCardList = selectCardList;
                $scope.cardEdit_show = true;
            } else {
                $scope.tobe_editCardList = [];
                $scope.cardEdit_show = false;
            }
            $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
            $scope.alreadyAuth = Helper.unionAuths(selectCardList);
        };
        //取消选择卡
        $scope.selectAllCard_not = () => {
            const cardAll = $("input:checkbox[name='chooseAuthCard']");
            cardAll.attr("checked", <any>false);
            cardAll
                .parent()
                .parent()
                .removeClass("bg-success");
            const selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            const selectCardList: Authorizable[] = mapToArray(selectCard, x => angular.fromJson(x.value)); //选择卡的列表
            $scope.tobe_editCardList = [];
            $scope.cardEdit_show = false;
            $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
            $scope.alreadyAuth = Helper.unionAuths(selectCardList);
        };
        $scope.selectBinding = () => {
            if ($("#alreadyBindingAuth").is(":checked")) {
                $scope.alreadyBinding = true;
            } else {
                $scope.alreadyBinding = false;
            }
        };
        //编辑按钮默认不显示
        $scope.cardEdit_show = false;
        $scope.editCardcomplete = true;
        //打开编辑卡
        $scope.tobe_editCardSerial = "";
        $scope.selectCard_Edit = () => {
            console.log($scope.tobe_editCardList);
            if ($scope.tobe_editCardList.length === 1) {
                if ($scope.tobe_editCardList[0].nric) {
                    const editCardRooms = $filter("nricTorooms")($scope.tobe_editCardList[0].nric, $scope.communityData.personnel);
                    const flat = $iot.communities.flatten($scope.communityData.address.guid, editCardRooms[0]);
                    $scope.editCard_address = {
                        building: flat.block,
                        unit: flat.unit,
                        room: flat.flat,
                        nric: $scope.tobe_editCardList[0].nric
                    };
                    $scope.roomPersonnel($scope.editCard_address.room);
                } else {
                    $scope.roomPersonnel();
                    $scope.editCard_address = {};
                }
            } else {
                $scope.roomPersonnel();
                $scope.editCard_address = {};
            }
            $scope.tobe_editCardList.forEach(value => {
                $scope.tobe_editCardSerial = $scope.tobe_editCardSerial + value.serial + "；";
            });
        };
        //编辑卡
        $scope.editCard = (nric: Nric) => {
            for (let i = 0; i < $scope.tobe_editCardList.length; i++) {
                const editData = $scope.tobe_editCardList[i];
                const cardData: Card = {
                    communityId: editData.communityId,
                    id: editData.id,
                    nric,
                    serial: editData.serial,
                };
                $iot.cards
                    .put(cardData)
                    .then(data => {
                        if (!data.id) {
                            $(".editCardcomplete").text(editData.serial + "编辑失败!");
                            $timeout(() => {
                                $scope.editCardcomplete = false;
                            });
                        } else {
                            $(".editCardcomplete").text(data.serial + "提交成功");
                            $timeout(() => {
                                $scope.editCardcomplete = false;
                                data.auth = [];
                                const lengthCardCom = $scope.communityData.cards.length;
                                const lengthCardView = $scope.card_viewData.length;
                                for (let i = 0; i < lengthCardCom; i++) {
                                    if ($scope.communityData.cards[i].id === data.id) {
                                        $scope.communityData.cards[i].nric = data.nric;
                                        break;
                                    }
                                }
                                for (let i = 0; i < lengthCardView; i++) {
                                    if ($scope.card_viewData[i].id === data.id) {
                                        $scope.card_viewData[i].nric = data.nric;
                                        break;
                                    }
                                }
                            });
                        }
                        $timeout(() => {
                            $scope.editCardcomplete = true;
                        }, 2000);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        };
        //删除卡
        $scope.deleteCard = () => {
            const selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            const selectCardList: Card[] = mapToArray(selectCard, x => angular.fromJson(x.value)); //选择卡的列表
            if (selectCardList.length === 0) {
                return;
            }
            let sure = confirm("你确定删除这" + selectCardList.length + "张卡吗？");
            if (!sure) {
                return;
            }
            for (let i = 0; i < selectCardList.length; i++) {
                if (selectCardList[i].auth.length === 0) {
                    deleteCardGenerator(selectCardList[i]);
                } else {
                    sure = confirm("卡号:" + selectCardList[i].serial + "因有授权无法删除！是否继续删除剩余卡？");
                    if (!sure) {
                        break;
                    }
                }
            }

            function deleteCardGenerator(carddata: Card) {
                $iot.cards
                    .delete(carddata)
                    .then(() => {
                        $timeout(() => {
                            $scope.communityData.cards.forEach((item, index) => {
                                if (item.id === carddata.id) {
                                    $scope.communityData.cards.splice(index, 1);
                                }
                            });
                            $scope.card_viewData.forEach((item, index) => {
                                if (item.id === carddata.id) {
                                    $scope.card_viewData.splice(index, 1);
                                }
                            });
                        });
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        };

        function issueSuccess(deviceIdx: number, secretIdx: number, devices: Guid[], secrets: Guid[]) {
            if (secretIdx === 0) {
                $scope.authCompleteinfo.push({
                    device: devices[deviceIdx],
                    success: [secrets[secretIdx]],
                    fail: []
                });
            } else {
                $scope.authCompleteinfo[deviceIdx].success.push(secrets[secretIdx]);
            }
        }
        function issueFail(deviceIdx: number, secretIdx: number, devices: Guid[], secrets: Guid[], message: string) {
            if (deviceIdx === 0) {
                $scope.authCompleteinfo.push({
                    device: devices[deviceIdx],
                    success: [],
                    fail: secrets.slice(deviceIdx),
                    message
                });
            } else {
                $scope.authCompleteinfo[deviceIdx].fail.concat(secrets.slice(deviceIdx));
                $scope.authCompleteinfo[deviceIdx].message = message;
            }
        }

        function issueIgnoreError(deviceIdx: number, secretIdx: number, devices: Guid[], secrets: Guid[], message: string) {
            if (secretIdx === 0) {
                $scope.authCompleteinfo.push({
                    device: devices[deviceIdx],
                    success: [],
                    fail: [secrets[secretIdx]],
                    message
                });
            } else {
                $scope.authCompleteinfo[deviceIdx].fail.push(secrets[secretIdx]);
            }
        }

        //授权生成器
        function authGenerator(cardList: string[], deviceList: string[], $time: number, $binding: string) {
            const getNext = Helper.permitGenerator(cardList, deviceList);

            function auth(deviceIdx: number, cardIdx: number) {
                const subData: Auth = {
                    deviceId: deviceList[deviceIdx],
                    expire: $time,
                    binding: $binding
                };
                $iot.cards
                    .issue(cardList[cardIdx], subData)
                    .then((data: Result) => {
                        const value = data.errorCode === 70000003 || data.result;
                        if (data.result) {
                            $timeout(() => {
                                $scope.communityData.cards.forEach(t => {
                                    if (t.id === cardList[cardIdx]) {
                                        t.auth.push({
                                            deviceId: deviceList[deviceIdx],
                                            expire: $time,
                                            binding: $binding
                                        });
                                    }
                                });
                            });
                        }
                        if (value) {
                            issueSuccess(deviceIdx, cardIdx, deviceList, cardList);
                        } else {
                            issueFail(deviceIdx, cardIdx, deviceList, cardList, data.message);
                        }
                        if (deviceIdx === deviceList.length - 1) {
                            if (!value || cardIdx === cardList.length - 1) {
                                $timeout(() => {
                                    const selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
                                    const selectCardList: Authorizable[] = mapToArray(selectCard, x => angular.fromJson(x.value)); //选择卡的列表
                                    $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
                                    $scope.alreadyAuth = Helper.unionAuths(selectCardList);
                                });
                            }
                        }
                        getNext(value, auth);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
            getNext(true, auth);
        }
        //授权
        //是否选择时间
        $scope.alreadyTime = false;
        $scope.validityTimeDefault = () => {
            if ($("#alreadyTimeAuth").is(":checked")) {
                const nowDate = new Date().format("yyyy-MM-dd") + "T" + "00:00";
                $("#validityTime").val(nowDate);
            }
        };
        //是否选择绑定房号
        $scope.alreadyBinding = false;
        $scope.authCardToDevice = () => {
            const selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            const authCardList: Guid[] = Helper.getSeq(selectCard)
                .map<Card>(x => angular.fromJson(x.value))
                .filter(x => !!x.nric)
                .map(x => x.id)
                .toArray();
            if (authCardList.length === 0) {
                alert("请选择授权卡");
                return;
            }
            const selectDevice = angular.element("input:checkbox[name='chooseAuthDevice']:checked");
            const authDeviceList: Guid[] = mapToArray(selectDevice, x => angular.fromJson(x.value).id);
            if (authDeviceList.length === 0) {
                alert("请选择设备");
                return;
            }
            let $time: number;
            let $binding: string;
            if ($("#alreadyTimeAuth").is(":checked")) {
                const val = $("#validityTime").val() as string;
                $time = Math.floor(new Date(val).getTime() / 1000);
            } else {
                $time = undefined;
            }
            if ($("#alreadyBindingAuth").is(":checked") && !$scope.chooseBinding) {
                $binding = $("#bindingRoomAddress").val() as string;
            } else {
                $binding = undefined;
            }
            $scope.authCompleteinfo = [];
            authGenerator(authCardList, authDeviceList, $time, $binding);
        };
        //取消授权
        $scope.deleteAuthCard = () => {
            const selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
            const authCardList = mapToArray(selectCard, x => (<Card>angular.fromJson(x.value)).id);
            if (authCardList.length === 0) {
                alert("请选择卡");
                return;
            }
            const unAuthDevice = angular.element("input:checkbox[name='chooseAlreadyAuth']:checked");
            const unAuthDeviceList: Guid[] = mapToArray(unAuthDevice, x => (<Auth>angular.fromJson(x.value)).deviceId);

            function unauthGenerator(cardList: Guid[], deviceList: Guid[]) {
                const getNext = Helper.permitGenerator(cardList, deviceList);

                function auth(deviceIdx: number, cardIdx: number) {
                    const subData: Auth = {
                        deviceId: deviceList[deviceIdx]
                    };
                    $iot.cards
                        .withdraw(cardList[cardIdx], subData)
                        .then(data => {
                            if (data.result) {
                                $timeout(() => {
                                    $scope.communityData.cards.forEach(t => {
                                        if (t.id === cardList[cardIdx]) {
                                            t.auth.forEach((t2, index) => {
                                                if (t2.deviceId === deviceList[deviceIdx]) {
                                                    t.auth.splice(index, 1);
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                            if (data.result) {
                                issueSuccess(deviceIdx, cardIdx, deviceList, cardList);
                            } else {
                                issueFail(deviceIdx, cardIdx, deviceList, cardList, data.message);
                            }
                            if (deviceIdx === deviceList.length - 1) {
                                if (!data.result || cardIdx === cardList.length - 1) {
                                    $timeout(() => {
                                        //const selectCard = angular.element("input:checkbox[name='chooseAuthCard']:checked");
                                        const selectCardList: Authorizable[] = mapToArray(selectCard, x => angular.fromJson(x.value)); //选择卡的列表
                                        $scope.ChooseauthDevice = Helper.complementOfIntersect(selectCardList, $scope.communityData.devices);
                                        $scope.alreadyAuth = Helper.unionAuths(selectCardList);
                                    });
                                }
                            }
                            getNext(data.result, auth);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                }
                getNext(true, auth);
            }
            $scope.authCompleteinfo = [];
            unauthGenerator(authCardList, unAuthDeviceList);
        };
        //卡片查询过滤器
        $scope.cardFilter = str => {
            $scope.card_viewData = !str
                ? $scope.communityData.cards.slice(0)
                : $scope.communityData.cards.filter(item => {
                    for (const prop in item) {
                        if (item.hasOwnProperty(prop)) {
                            if (prop === "serial") {
                                if (item[prop].indexOf(str) !== -1) {
                                    return true;
                                }
                            } else if (prop === "nric") {
                                if (item[prop].indexOf(str) !== -1 || $filter("nricToname")(item[prop], $scope.communityData.personnel).indexOf(str) !== -1) {
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                });
        };
        /*门禁卡管理结束*/

        /*指纹管理开始*/
        //手指是否已经录入提醒是否显示
        $scope.chooseFingersInfoHide = true;
        //手指数据
        $scope.FingerConstans = Helper.fingerConstans;

        function createFingerprint() {
            const fp = $fp.create();
            fp.onImage = (index, image) => {
                switch (index) {
                    case 0:
                        $("#fingerprint1").attr("src", image);
                        break;
                    case 1:
                        $("#fingerprint2").attr("src", image);
                        break;
                    case 2:
                        $("#fingerprint3").attr("src", image);
                        break;
                }
            };
            fp.onsuccess = () => {
                $("#FingersInfo")
                    .text("采集成功，请保存！")
                    .removeClass("text-danger")
                    .addClass("text-success");
            };
            fp.onfail = () => {
                $("#FingersInfo")
                    .text("采集失败，请重新采集！")
                    .removeClass("text-success")
                    .addClass("text-danger");
                $("#fingerprint1").attr("src", "images/scanfinger1.png");
                $("#fingerprint2").attr("src", "images/scanfinger2.png");
                $("#fingerprint3").attr("src", "images/scanfinger3.png");
            };
            fp.onreset = () => {
                if (!$scope.websocketIsready) {
                    $("#FingersInfo")
                        .text("指纹服务连接成功!")
                        .removeClass("text-danger")
                        .addClass("text-success");
                } else {
                    $("#FingersInfo")
                        .text("指纹服务连接失败，请查看是否启动服务或重新打开模块！")
                        .removeClass("text-success")
                        .addClass("text-danger");
                }
            };
            fp.onerror = () => {
                $timeout(() => {
                    $scope.websocketIsready = true;
                });
                $("#FingersInfo")
                    .text("指纹服务连接失败，请查看是否启动服务或重新打开模块！")
                    .removeClass("text-success")
                    .addClass("text-danger");
                $("#fingerprint1").attr("src", "images/scanfinger1.png");
                $("#fingerprint2").attr("src", "images/scanfinger2.png");
                $("#fingerprint3").attr("src", "images/scanfinger3.png");
            };
            fp.onopen = () => {
                $timeout(() => {
                    $scope.websocketIsready = false;
                });
                $("#FingersInfo")
                    .text("指纹服务连接成功！")
                    .removeClass("text-danger")
                    .addClass("text-success");
                $("#fingerprint1").attr("src", "images/scanfinger1.png");
                $("#fingerprint2").attr("src", "images/scanfinger2.png");
                $("#fingerprint3").attr("src", "images/scanfinger3.png");
            };
            fp.onclose = () => {
                $timeout(() => {
                    $scope.websocketIsready = true;
                });
                $("#FingersInfo")
                    .text("指纹服务连接失败，请查看是否启动服务或重新打开模块！")
                    .removeClass("text-success")
                    .addClass("text-danger");
            };
            return fp;
        }

        let fpService: FpService;

        //已经添加过
        let fingeradded: Fingerprint[] = [];
        //切换手指初始化指纹输入
        $scope.chooseFingerConstans = finger => {
            if (fingeradded.some(t => t.finger === Number(finger))) {
                $scope.chooseFingersInfoHide = false;
            } else {
                $scope.chooseFingersInfoHide = true;
            }
            fpService.reset();
            $("#fingerprint1").attr("src", "images/scanfinger1.png");
            $("#fingerprint2").attr("src", "images/scanfinger2.png");
            $("#fingerprint3").attr("src", "images/scanfinger3.png");
        };
        //获取用户已经保存的指纹
        $scope.getUserFingerprints = user => {
            if (!user) {
                return;
            }
            $iot.fingerprints.get(JSON.parse(user).nric).then(data => {
                fingeradded = data;
                console.log(data);
                console.log($scope.communityData.Fingerprints);
            });
        };
        //是否已经有指纹信息
        $scope.chooseFinger = finger => {
            return !finger ? <undefined>finger : fingeradded.some(t => t.finger === finger.id) ? "text-success" : "text-danger";
        };
        //打开添加指纹
        $scope.openAddFinger = () => {
            fpService = fpService || createFingerprint();
            $("#addFinger").modal("show");
        };
        //重置指纹读取
        $scope.resetFinger = () => {
            fpService.reset();
            $("#fingerprint1").attr("src", "images/scanfinger1.png");
            $("#fingerprint2").attr("src", "images/scanfinger2.png");
            $("#fingerprint3").attr("src", "images/scanfinger3.png");
        };
        //关闭添加指纹
        $scope.closeAddFinger = () => {
            $("#addFinger").modal("hide");
            fpService.close();
            fpService = undefined;
        };
        //添加指纹
        $scope.addFinger = (finger, user) => {
            if (!finger) {
                alert("请选择手指");
                return;
            }
            if (!user) {
                alert("请选择用户！");
                return;
            }
            if (!fpService.item) {
                if (fingeradded.some(t => t.finger === Number(finger))) {
                    const subData: FingerBinder = {
                        communityId: $scope.communityData.address.guid
                    };
                    for (let i = 0; i < fingeradded.length; i++) {
                        if (fingeradded[i].finger === Number(finger)) {
                            subData.id = fingeradded[i].id;
                            break;
                        }
                    }
                    if ($scope.communityData.Fingerprints.some(t => t.id === subData.id)) {
                        $("#FingersInfo")
                            .text("已经绑定该小区")
                            .removeClass("text-danger")
                            .addClass("text-success");
                        $timeout(() => {
                            $scope.resetFinger();
                        }, 1000);
                    } else {
                        $iot.fingerprints
                            .bind(subData)
                            .then(data => {
                                if (data) {
                                    $("#FingersInfo")
                                        .text("保存成功")
                                        .removeClass("text-danger")
                                        .addClass("text-success");
                                    const addData: Fingerprint = {
                                        auth: [],
                                        finger: Number(finger),
                                        id: subData.id,
                                        nric: JSON.parse(user).nric
                                    };
                                    $timeout(() => {
                                        $scope.resetFinger();
                                    }, 1000);
                                    $timeout(() => {
                                        $scope.communityData.Fingerprints.unshift(addData);
                                        $scope.fingerprint_viewData.unshift(addData);
                                    });
                                } else {
                                    $("#FingersInfo")
                                        .text("保存失败")
                                        .removeClass("text-success")
                                        .addClass("text-danger");
                                }
                            })
                            .catch(err => {
                                console.log(err);
                            });
                    }
                } else {
                    alert("请采集指纹");
                    return;
                }
            } else {
                const subData: Fingerprint = fpService.item;
                subData.communityId = $scope.communityData.address.guid;
                subData.nric = JSON.parse(user).nric;
                subData.finger = Number(finger);
                $iot.fingerprints
                    .put(subData)
                    .then(data => {
                        $("#FingersInfo")
                            .text("保存成功")
                            .removeClass("text-danger")
                            .addClass("text-success");
                        data.auth = [];
                        $timeout(() => {
                            $scope.resetFinger();
                        }, 1000);
                        const haveuser = $scope.communityData.Fingerprints.filter(item => item.nric === data.nric);
                        if (haveuser.length === 0) {
                            $timeout(() => {
                                $scope.communityData.Fingerprints.unshift(data);
                                $scope.fingerprint_viewData.unshift(data);
                            });
                        } else {
                            const havefinger = haveuser.filter(item => item.finger === data.finger);
                            if (havefinger.length === 0) {
                                $timeout(() => {
                                    $scope.communityData.Fingerprints.push(data);
                                    $scope.fingerprint_viewData.push(data);
                                });
                            } else {
                                $timeout(() => {
                                    console.log($scope.communityData.Fingerprints);
                                    console.log($scope.fingerprint_viewData);
                                    havefinger[0].id = data.id;
                                    console.log($scope.communityData.Fingerprints);
                                    console.log($scope.fingerprint_viewData);
                                });
                            }
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        };
        //选定指纹
        let thisTimeFinger: number;
        let lastTimeFinger: number;
        $scope.chooseFingerprint = (index, event, fingerprint) => {
            const $target = $(`#${index}`);
            if (event.shiftKey) {
                thisTimeFinger = Number(index);
                if (lastTimeFinger !== undefined) {
                    if (thisTimeFinger > lastTimeFinger) {
                        for (let i = lastTimeFinger; i <= thisTimeFinger; i++) {
                            $("#" + i).attr("checked", <any>true);
                            $("#" + i)
                                .parent()
                                .parent()
                                .addClass("bg-success");
                        }
                    } else {
                        for (let i = thisTimeFinger; i <= lastTimeFinger; i++) {
                            $("#" + i).attr("checked", <any>true);
                            $("#" + i)
                                .parent()
                                .parent()
                                .addClass("bg-success");
                        }
                    }
                    lastTimeFinger = Number(index);
                    document.getSelection().empty();
                } else {
                    $target.attr("checked", <any>true);
                    $target
                        .parent()
                        .parent()
                        .addClass("bg-success");
                    lastTimeFinger = Number(index);
                }
            } else {
                if ($target.is(":checked")) {
                    $target.attr("checked", <any>false);
                    $target
                        .parent()
                        .parent()
                        .removeClass("bg-success");
                    lastTimeFinger = Number(index);
                } else {
                    $target.attr("checked", <any>true);
                    $target
                        .parent()
                        .parent()
                        .addClass("bg-success");
                    lastTimeFinger = Number(index);
                }
            }
            const selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            const selectfingerprintList: Authorizable[] = mapToArray(selectfingerprint, x => angular.fromJson(x.value)); //选择的列表
            $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
            $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
        };
        //全选指纹
        $scope.selectAllFingerprint = () => {
            const cardAll = $("input:checkbox[name='chooseAuthFingerprint']");
            cardAll.attr("checked", <any>true);
            cardAll
                .parent()
                .parent()
                .addClass("bg-success");
            const selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            const selectfingerprintList: Authorizable[] = mapToArray(selectfingerprint, x => angular.fromJson(x.value)); //选择卡的列表
            $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
            $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
        };
        //取消选择指纹
        $scope.selectAllfingerprint_not = () => {
            const cardAll = $("input:checkbox[name='chooseAuthFingerprint']");
            cardAll.attr("checked", <any>false);
            cardAll
                .parent()
                .parent()
                .removeClass("bg-success");
            const selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            const selectfingerprintList: Authorizable[] = mapToArray(selectfingerprint, x => angular.fromJson(x.value)); //选择卡的列表
            $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
            $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
        };

        //删除指纹
        $scope.deletefingerprint = () => {
            const selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            const selectfingerprintList: Fingerprint[] = mapToArray(selectfingerprint, x => angular.fromJson(x.value)); //选择指纹的列表
            if (selectfingerprintList.length === 0) {
                return;
            }
            if (!confirm(`你确定删除这${selectfingerprintList.length}个指纹吗？`)) {
                return;
            }
            for (let i = 0; i < selectfingerprintList.length; i++) {
                if (selectfingerprintList[i].auth.length === 0) {
                    deleteFingerprintGenerator(selectfingerprintList[i]);
                } else {
                    const name = $filter("nricToname")(selectfingerprintList[i].nric, $scope.communityData.personnel);
                    const finger = $filter("fingerFilter")(selectfingerprintList[i].finger);
                    if (!confirm(`指纹:${name}${finger}的指纹已授权，无法删除！是否继续删除剩余指纹？`)) {
                        break;
                    }
                }
            }

            function deleteFingerprintGenerator(fingerprintdata: Fingerprint) {
                const deleteData: Fingerprint = {
                    communityId: $scope.communityData.address.guid,
                    id: fingerprintdata.id
                };
                $iot.fingerprints
                    .delete(deleteData)
                    .then(() => {
                        $timeout(() => {
                            $scope.communityData.Fingerprints.forEach((item, index) => {
                                if (item.id === fingerprintdata.id) {
                                    $scope.communityData.Fingerprints.splice(index, 1);
                                }
                            });
                            $scope.fingerprint_viewData.forEach((item, index) => {
                                if (item.id === fingerprintdata.id) {
                                    $scope.fingerprint_viewData.splice(index, 1);
                                }
                            });
                        });
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
        };

        function fingerprintAuthGenerator(fingerprintList: Guid[], deviceList: Guid[], $time: number, $binding: string) {
            const getNext = Helper.permitGenerator(fingerprintList, deviceList);

            function auth(deviceIdx: number, fpIdx: number) {
                const subData: Auth = {
                    deviceId: deviceList[deviceIdx],
                    expire: $time,
                    binding: $binding
                };
                $iot.fingerprints
                    .issue(fingerprintList[fpIdx], subData)
                    .then(data => {
                        const value = data.errorCode === 70000003 || data.errorCode === 24 || data.result;
                        if (data.result) {
                            $timeout(() => {
                                $scope.communityData.Fingerprints.forEach(t => {
                                    if (t.id === fingerprintList[fpIdx]) {
                                        t.auth.push({
                                            deviceId: deviceList[deviceIdx],
                                            expire: $time,
                                            binding: $binding
                                        });
                                    }
                                });
                            });
                        }
                        if (data.errorCode === 70000003 || data.result) {
                            issueSuccess(deviceIdx, fpIdx, deviceList, fingerprintList);
                        } else if (data.errorCode === 24) {
                            issueIgnoreError(deviceIdx, fpIdx, deviceList, fingerprintList, data.message);
                        } else {
                            issueFail(deviceIdx, fpIdx, deviceList, fingerprintList, data.message);
                        }

                        if (deviceIdx === deviceList.length - 1) {
                            if (!value || fpIdx === fingerprintList.length - 1) {
                                $timeout(() => {
                                    /*更新授权和未授权门口机列表*/
                                    const selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
                                    const selectfingerprintList: Authorizable[] = mapToArray(selectfingerprint, x => angular.fromJson(x.value)); //选择指纹的列表
                                    $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
                                    $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
                                });
                            }
                        }
                        getNext(value, auth);
                    })
                    .catch(err => {
                        console.log(err);
                    });
            }
            getNext(true, auth);
        }
        //授权指纹到门口机
        $scope.authFingerprintToDevice = () => {
            const selectFingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            const authFingerprintList: Guid[] = mapToArray(selectFingerprint, x => angular.fromJson(x.value));
            if (authFingerprintList.length === 0) {
                alert("请选择授权指纹");
                return;
            }
            const selectDevice = angular.element("input:checkbox[name='chooseAuthDevice']:checked");
            const authDeviceList: Guid[] = mapToArray(selectDevice, x => (<Device>angular.fromJson(x.value)).id);
            if (authDeviceList.length === 0) {
                alert("请选择设备");
                return;
            }
            let $time: number;
            let $binding: string;
            if ($("#alreadyTimeAuth").is(":checked")) {
                $time = new Date(<string>$("#validityTime").val()).getTime() / 1000;
            } else {
                $time = undefined;
            }
            if ($("#alreadyBindingAuth").is(":checked") && !$scope.chooseBinding) {
                $binding = $("#bindingRoomAddress").val() as string;
            } else {
                $binding = undefined;
            }
            $scope.authCompleteinfo = [];
            fingerprintAuthGenerator(authFingerprintList, authDeviceList, $time, $binding);
        };
        //取消授权指纹
        $scope.deleteAuthfingerprint = () => {
            const selectFingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
            const authFingerprintList: Guid[] = mapToArray(selectFingerprint, x => (<Fingerprint>angular.fromJson(x.value)).id);
            const unAuthDevice = angular.element("input:checkbox[name='chooseAlreadyAuth']:checked");
            const unAuthDeviceList: Guid[] = mapToArray(unAuthDevice, x => (<Auth>angular.fromJson(x.value)).deviceId);
            if (authFingerprintList.length === 0 || unAuthDeviceList.length === 0) {
                return;
            }

            function unauthGenerator(fingerprintList: Guid[], deviceList: Guid[]) {
                const getNext = Helper.permitGenerator(fingerprintList, deviceList);

                function auth(deviceIdx: number, fpIdx: number) {
                    const subData: Auth = {
                        deviceId: deviceList[deviceIdx]
                    };
                    $iot.fingerprints
                        .withdraw(fingerprintList[fpIdx], subData)
                        .then(data => {
                            const value = data.errorCode === 70000003 || data.result;
                            if (data.result) {
                                $timeout(() => {
                                    $scope.communityData.Fingerprints.forEach(t => {
                                        if (t.id === fingerprintList[fpIdx]) {
                                            t.auth.forEach((t2, index) => {
                                                if (t2.deviceId === deviceList[deviceIdx]) {
                                                    t.auth.splice(index, 1);
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                            if (value) {
                                issueSuccess(deviceIdx, fpIdx, deviceList, fingerprintList);
                            } else {
                                issueFail(deviceIdx, fpIdx, deviceList, fingerprintList, data.message);
                            }
                            if (deviceIdx === deviceList.length - 1) {
                                if (!data.result || fpIdx === fingerprintList.length - 1) {
                                    $timeout(() => {
                                        /*更新授权和未授权门口机列表*/
                                        const selectfingerprint = angular.element("input:checkbox[name='chooseAuthFingerprint']:checked");
                                        const selectfingerprintList: Authorizable[] = mapToArray(selectfingerprint, x => angular.fromJson(x.value)); //选择指纹的列表
                                        $scope.alreadyAuthFingerprint = Helper.unionAuths(selectfingerprintList);
                                        $scope.unalreadyAuthFingerprint = Helper.complementOfIntersect(selectfingerprintList, $scope.communityData.devices);
                                    });
                                }
                            }
                            getNext(value, auth);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                }
                getNext(true, auth);
            }
            $scope.authCompleteinfo = [];
            unauthGenerator(authFingerprintList, unAuthDeviceList);
        };
        //指纹查询过滤器
        $scope.fingerprintFilter = str => {
            if (!str) {
                $scope.fingerprint_viewData = $scope.communityData.Fingerprints.slice(0);
                return;
            }
            const filterData: Fingerprint[] = [];
            $scope.communityData.Fingerprints.forEach(item => {
                for (const prop in item) {
                    if (item.hasOwnProperty(prop)) {
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
                }
            });
            $scope.fingerprint_viewData = filterData;
        };
        /*指纹管理结束*/

        /*广告投放开始*/

        //广告系统视图加载
        $scope.chooseadvertisingView = viewNumber => {
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
        $scope.functionaladvertisingView = () => {
            switch ($scope.selectedAdView) {
                case 1:
                    $("#uploadFile").on("show.bs.collapse", () => {
                        $("#selectedPlayCom").multiselect();
                    });
                    return "views/AdvertisingView/fileManagement.html";
                case 2:
                    return "views/AdvertisingView/advertisingLaunch.html";
                default:
                    if (!$scope.hideAdFileManage) {
                        sideUrlChooseAdvertising = 1;
                        return "views/AdvertisingView/fileManagement.html";
                    }
                    if (!$scope.hideAdLaunch) {
                        sideUrlChooseAdvertising = 2;
                        return "views/AdvertisingView/advertisingLaunch.html";
                    }
            }
        };
        //个人文件获取
        $scope.getAdminAdvertisingFile = () => {
            $iot.advertising.files.sum().then(data => {
                $timeout(() => {
                    console.log(data);
                    $scope.adminData.Advertising = data;
                });
            });
        };
        //上传广告
        $scope.upAdvertisingFile = () => {
            const upForm = $("#upFileForm");
            const formData = new FormData(upForm[0] as any);
            /*var $time = form_data.get("Term");
            var $timeStrap = new Date($time).getTime()/1000;
            form_data.set('Term', $timeStrap);*/
            /*mp4 = 1 flv = 2*/
            const type = (formData.get("File") as File).type;
            const size = (formData.get("File") as File).size;
            console.log(type);
            console.log(size);
            if (size > 30000000) {
                alert("文件过大,不能超过28M");
                return;
            }
            if (type !== "video/mp4" && type !== "video/flv") {
                alert("只允许上传mp4或者flv视频");
                return;
            }
            if (type === "video/mp4") {
                formData.set("DataType", "1");
            }
            if (type === "video/flv") {
                formData.set("DataType", "2");
            }
            $iot.advertising.files.post(formData).then(id => {
                $timeout(() => {
                    $scope.adminData.Advertising.push({
                        title: String(formData.get("Title")),
                        id: id,
                        remark: String(formData.get("Remark")),
                        communities: formData.getAll("Communities").map(String)
                    });
                });
            });
        };
        //编辑广告文件
        $scope.open_EditFile = file => {
            $scope.whoFile = JSON.parse(JSON.stringify(file));
            $("#editPlayCom").multiselect();
            $("#editFile").modal("show");
        };
        $scope.editFile = () => {
            const upForm = $("#editFileForm");
            const formData = new FormData(upForm[0] as any);
            const reqData: Adfile = {
                id: $scope.whoFile.id,
                title: formData.get("Title") as string,
                remark: formData.get("Remark") as string,
                communities: formData.getAll("Communities") as Guid[]
            };
            console.log(reqData);
            $iot.advertising.files.put(reqData).then(() => { });
        };
        //获取小区播放计划
        $scope.getComPlans = com => {
            $scope.authADCompleteinfo = [];
            $iot.advertising.plans.get(com).then(data => {
                $timeout(() => {
                    console.log(data);
                    $scope.communityData.AdvertisingPlans = data;
                });
            });
            //请求设备数据
            $iot.devices.items(com, data => {
                $timeout(() => {
                    $scope.communityData.ADunAuthDevice = data.copy;
                    $scope.ChooseauthDevice_AD = Dict.zero<Device>();
                    $scope.alreadyAuth_AD = Dict.zero<Device>();
                });
            });
        };
        //获取小区的广告文件
        let chooseComAdvertising: Guid;
        $scope.getcomAdFile = com => {
            chooseComAdvertising = com;
            $iot.advertising.files.get(com).then((data: Adfile[]) => {
                $timeout(() => {
                    $scope.communityData.AdFiles = data;
                });
            });
        };
        //添加时段form
        $scope.addPlayTimeForm = () => {
            $("#addplayTime").append(
                '<form class="form-inline addplayform">\n' +
                '                            <div class="form-group form-group-sm">\n' +
                "                                <label>播放区间：</label>\n" +
                '                                <input type="time" name="StartTime" class="form-control">--\n' +
                '                                <input type="time" name="EndTime" class="form-control">\n' +
                "                            </div>\n" +
                '                            <div class="form-group form-group-sm">\n' +
                "                                <label>星期：</label>\n" +
                '                                <select class="form-control playWeek" multiple="multiple" name="WeekDays">\n' +
                '                                    <option value="0">星期日</option>\n' +
                '                                    <option value="1">星期一</option>\n' +
                '                                    <option value="2">星期二</option>\n' +
                '                                    <option value="3">星期三</option>\n' +
                '                                    <option value="4">星期四</option>\n' +
                '                                    <option value="5">星期五</option>\n' +
                '                                    <option value="6">星期六</option>\n' +
                "                                </select>\n" +
                "                            </div>\n" +
                '                            <div class="form-group form-group-sm">\n' +
                "                                <label>循环：</label>\n" +
                '                                <label class="radio-inline">\n' +
                '                                    <input type="radio" name="Loop" value="true" checked> 是\n' +
                "                                </label>\n" +
                '                                <label class="radio-inline">\n' +
                '                                    <input type="radio" name="Loop" value="false"> 否\n' +
                "                                </label>\n" +
                "                            </div>\n" +
                '                            <button type="button" class="btn btn-default btn-sm" onclick=\'removeSelf(event)\'>删除</button>\n' +
                "                        </form>"
            );
            $(".playWeek").multiselect({
                buttonContainer: '<div class="btn-group btn-group-sm" />'
            });
        };
        //删除时段form
        function removeSelf(event: MouseEvent) {
            const parent = document.getElementById("addplayTime");
            parent.removeChild(event.srcElement.parentElement);
        }
        //时间转换成秒数
        function timeToSeconds(time: FormDataEntryValue) {
            const timeStr = String(time);
            const hours = Number(timeStr.substring(0, 2));
            const minutes = Number(timeStr.substring(3));
            return hours * 3600 + minutes * 60;
        }
        //秒数转化成时间
        $scope.secondsTotime = secondStr => {
            const second = Number(secondStr);
            const hour = `0${(second / 3600) | 0}`.slice(-2);
            const minute = `0${((second % 3600) / 60) | 0}`.slice(-2);
            return hour + ":" + minute;
        };
        //星期过滤器
        $scope.weekDayToStr = weekDays => {
            if (weekDays.length === 0) {
                return "星期";
            }
            const list = [];
            let str: string;
            const week = Helper.weekConstans;
            for (let i = 0; i < weekDays.length; i++) {
                list.push(week[weekDays[i]]);
            }
            str = list.join("、");
            str = "星期" + str;
            return str;
        };
        //上传计划
        $scope.addPlaybackPlan = () => {
            const playbackPlanData: Adsolid = {
                fileId: "",
                remark: "",
                plans: []
            };
            const playbackPlan = $("#playbackPlanForm");
            const playbackPlanFormData = new FormData(playbackPlan[0] as any);
            if (!playbackPlanFormData.get("FileId")) {
                alert("请选择文件！");
                return;
            }
            if (!playbackPlanFormData.get("Remark")) {
                alert("请填写备注！");
                return;
            }
            if (!playbackPlanFormData.get("Term")) {
                alert("请填写终止时间！");
                return;
            }

            const playForms = $(".addplayform");
            if (playForms.length === 0) {
                alert("请添加时段");
                return;
            }
            for (let i = 0; i < playForms.length; i++) {
                const formData = new FormData(playForms[i] as any);
                if (!formData.get("StartTime")) {
                    alert("有时段开始时间没有正确填写！");
                    return;
                }
                if (!formData.get("EndTime")) {
                    alert("有时段结束时间没有正确填写！");
                    return;
                }
                if (timeToSeconds(formData.get("StartTime")) >= timeToSeconds(formData.get("EndTime"))) {
                    alert("有时段结束时间没有大于开始时间！");
                    return;
                }
                if (formData.getAll("WeekDays").length === 0) {
                    alert("有时段的星期没有选择");
                    return;
                }
                formData.set("StartTime", String(timeToSeconds(formData.get("StartTime"))));
                formData.set("EndTime", String(timeToSeconds(formData.get("EndTime"))));
                playbackPlanData.plans.push({
                    startTime: Number(formData.get("StartTime")),
                    endTime: Number(formData.get("EndTime")),
                    weekDays: formData.getAll("WeekDays").map(Number),
                    loop: !!formData.get("Loop")
                });
            }
            playbackPlanData.fileId = playbackPlanFormData.get("FileId") as string;
            const termTimestamp = new Date(Number(playbackPlanFormData.get("Term"))).getTime() / 1000;
            const today = new Date().getTime() / 1000;
            if (termTimestamp <= today) {
                alert("终止时间需要大于今天！");
                return;
            }
            playbackPlanData.term = termTimestamp;
            playbackPlanData.remark = playbackPlanFormData.get("Remark") as string;
            $iot.advertising.plans
                .post(chooseComAdvertising, playbackPlanData)
                .then(() => {
                    alert("上传成功！");
                    $iot.advertising.plans.get(chooseComAdvertising).then(data => {
                        $timeout(() => {
                            console.log(data);
                            $scope.communityData.AdvertisingPlans = data;
                        });
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        };
        //删除计划
        let selectedPlan: Guid;
        $scope.deletePlaybackPlan = () => {
            if (!selectedPlan) {
                return;
            }
            console.log(selectedPlan);
            $iot.advertising.plans
                .delete(selectedPlan)
                .then(x => {
                    console.log(x);
                    if (x.result) {
                        $iot.advertising.plans.get(chooseComAdvertising).then(data => {
                            $timeout(() => {
                                console.log(data);
                                $scope.communityData.AdvertisingPlans = data;
                            });
                        });
                    } else {
                        alert("删除失败！" + x.message);
                    }
                })
                .catch(err => {
                    console.log(err);
                });
        };
        //选择播放计划
        $scope.choosePlan = plan => {
            selectedPlan = plan.id;
            //获取计划的已投放设备
            $iot.advertising.devices.get(selectedPlan).then(data => {
                $timeout(() => {
                    $scope.ChooseauthDevice_AD = $scope.communityData.ADunAuthDevice.filter(item => data.indexOf(item.id) === -1);
                    $scope.alreadyAuth_AD = $scope.communityData.ADunAuthDevice.filter(item => data.indexOf(item.id) !== -1);
                });
            });
        };
        //选择播放计划样式
        $scope.choosePlanStyle = item => (item.id === selectedPlan ? "success" : "");
        //授权播放计划
        $scope.authAdPlayToDevice = () => {
            $scope.authADCompleteinfo = [];
            const selectDevice = angular.element("input:checkbox[name='chooseAuthDevice_AD']:checked");
            const selectDeviceList = mapToArray(selectDevice, x => (<Device>angular.fromJson(x.value)).id);
            if (selectDeviceList.length === 0) {
                return;
            }
            for (let i = 0; i < selectDeviceList.length; i++) {
                (i => {
                    const issue: Adissue = {
                        deviceId: selectDeviceList[i],
                        planId: selectedPlan
                    };
                    $iot.advertising.issue
                        .post(issue)
                        .then((data: IssueResult) => {
                            $timeout(() => {
                                if (data.result) {
                                    const successDevice = $scope.communityData.ADunAuthDevice.$[selectDeviceList[i]];
                                    $scope.alreadyAuth_AD.addOrUpdate(successDevice.id, successDevice);
                                    $scope.ChooseauthDevice_AD = $scope.ChooseauthDevice_AD.filter(item => item.id !== selectDeviceList[i]);
                                }
                                data.device = selectDeviceList[i];
                                $scope.authADCompleteinfo.push(data);
                            });
                            console.log(data);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                })(i);
            }
        };
        //取消授权播放计划
        $scope.deleteAuth_AD = () => {
            $scope.authADCompleteinfo = [];
            const selectDevice = angular.element("input:checkbox[name='chooseAlreadyAuth_AD']:checked");
            const selectDeviceList: Guid[] = mapToArray(selectDevice, x => (<Device>angular.fromJson(x.value)).id);
            if (selectDeviceList.length === 0) {
                return;
            }
            for (let i = 0; i < selectDeviceList.length; i++) {
                (i => {
                    const issue: Adissue = {
                        deviceId: selectDeviceList[i],
                        planId: selectedPlan
                    };
                    $iot.advertising.issue
                        .post(issue)
                        .then(data => {
                            $timeout(() => {
                                if (data.result) {
                                    const successDevice = $scope.communityData.ADunAuthDevice.$[selectDeviceList[i]];
                                    $scope.ChooseauthDevice_AD.addOrUpdate(successDevice.id, successDevice);
                                    $scope.alreadyAuth_AD = $scope.alreadyAuth_AD.filter(item => item.id !== selectDeviceList[i]);
                                }
                                data.device = selectDeviceList[i];
                                $scope.authADCompleteinfo.push(data);
                            });
                            console.log(data);
                        })
                        .catch(err => {
                            console.log(err);
                        });
                })(i);
            }
        };
        /*广告投放结束*/
        /*查询系统开始*/
        $scope.moreQuery = "更多选项";
        $scope.openMore = false;
        $scope.openMoreChange = () => {
            if ($scope.openMore) {
                $scope.openMore = false;
                $scope.moreQuery = "更多选项";
            } else {
                $scope.openMore = true;
                $scope.moreQuery = "关闭更多";
            }
        };
        //查询系统视图加载
        $scope.chooseQueryView = viewNumber => {
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
        $scope.functionalQueryView = () => {
            switch ($scope.selectedView) {
                case 1:
                    return "views/QueryView/record.html?" + $iot.startTime;
                case 2:
                    return "views/QueryView/DeviceStatus.html?" + $iot.startTime;
                default:
                    sideUrlChooseQuery = 1;
                    return "views/QueryView/record.html?" + $iot.startTime;
            }
        };
        //缓存查询字段
        $scope.searchData = {
            GateList: []
        };
        //静态事件列表
        $scope.eventlist = Helper.eventConstans;
        $scope.event = $scope.eventlist[0].id; //事件初始化
        //初始化搜索时间
        $scope.initTime = () => {
            $("#startTime").val(new Date().format("yyyy-MM-dd") + " 00:00:00");
            $("#endTime").val(new Date().format("yyyy-MM-dd") + " 23:59:59");
        };
        $scope.getGate = comid => {
            $iot.ranger.devices.get(comid).then((data: Device[]) => {
                $timeout(() => {
                    const dataView = data.map(Helper.deviceToView);
                    $scope.searchData.GateList = orderBy(dataView, "Name");
                    $scope.searchData.GateList.unshift({
                        id: "",
                        address: "全部"
                    });
                    $scope.searchData.Gate = $scope.searchData.GateList[0].id;
                });
            });
            $iot.communities.loadArch(comid).then(data => {
                $timeout(() => {
                    $scope.communityData.queryAddress = data;
                });
            });
        };
        //查询记录
        $rootScope.recordBarData = false;
        $rootScope.listQuery = false;
        $scope.QueryRecord = (com, gate, event, name, nric, phone, addressBuilding, addressUnit, addressRoom) => {
            if (!com || com.length === 0) return;
            if (nric) {
                const validator = new IDValidator();
                if (!validator.isValid(nric)) {
                    alert("身份证号码格式不正确！");
                    return;
                }
            }
            //查询的小区
            for (let i = 0; i < $scope.adminData.communities.length; i++) {
                if ($scope.adminData.communities[i].id === com) {
                    $scope.comName = $scope.adminData.communities[i].name;
                    break;
                }
            }
            //获取查询时间范围
            const startTimeStr = (<HTMLInputElement>document.getElementById("startTime")).value;
            const endTimeStr = (<HTMLInputElement>document.getElementById("endTime")).value;
            const beginTime = TimeConvert.getTimestamp(startTimeStr);
            const endTime = TimeConvert.getTimestamp(endTimeStr);
            const requestData: QueryEvents = {
                beginTime: beginTime,
                endTime: endTime,
                gate: gate,
                community: com,
                event: event,
                nric: nric,
                name: name,
                phone: phone
            };
            if (addressBuilding) {
                requestData.address = addressBuilding.id;
            }
            if (addressUnit) {
                requestData.address = addressBuilding.id + addressUnit.id;
            }
            if (addressRoom) {
                requestData.address = addressBuilding.id + addressUnit.id + addressRoom.id;
            }
            console.log(JSON.parse(JSON.stringify(requestData)));
            $iot.ranger.events
                .query(requestData)
                .then(() => { })
                .catch(err => {
                    console.log(err);
                });
        };
        $scope.detail = (id, eventType) => {
            $scope.Imgbase = `Ranger/EventImage/${id}/${eventType}`;
            $("#detailImage").modal("show");
        };
        $scope.enlargeImg = () => {
            $("#detailModal").addClass("enlargeImg");
        };
        $scope.restoreImg = () => {
            $("#detailModal").removeClass("enlargeImg");
        };
        //设备日志查询
        //设备状态
        $scope.StatusIds = Helper.statusConstans;
        $scope.StatusId = undefined;
        $scope.QueryStatus = (com, gate, statusid) => {
            if (!com || com.length === 0) return;
            //查询的小区
            for (let i = 0; i < $scope.adminData.communities.length; i++) {
                if ($scope.adminData.communities[i].id === com) {
                    $scope.comName = $scope.adminData.communities[i].name;
                    break;
                }
            }
            //获取查询时间范围
            const startTimeStr = (<HTMLInputElement>document.getElementById("startTime")).value;
            const endTimeStr = (<HTMLInputElement>document.getElementById("endTime")).value;
            const beginTime = TimeConvert.getTimestamp(startTimeStr);
            const endTime = TimeConvert.getTimestamp(endTimeStr);
            const requestData: QueryLogs = {
                beginTime: beginTime,
                endTime: endTime,
                deviceId: gate,
                communityId: com,
                status: statusid
            };
            console.log(requestData);
            $iot.ranger.logs
                .query(requestData)
                .then(() => { })
                .catch(err => {
                    console.log(err);
                });
        };
    });
