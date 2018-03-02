var Community = (function () {
    function Community(id) {
        this.id = id;
    }
    return Community;
}());
var Iot = (function () {
    function Iot() {
    }
    Iot.connect = function () {
        console.log("iot.connect");
        Iot._webClient = WebClient.connect();
        return Iot._webClient;
    };
    Iot.postForm = function (url, data) {
        return $.ajax({
            url: url,
            type: "post",
            data: data,
            contentType: false,
            cache: false,
            processData: false
        });
    };
    Iot.getCommunity = function (id) {
        var x = Iot.comms.$[id];
        if (x)
            return x;
        var y = new Community(id);
        Iot.comms.addOrUpdate(y);
        return y;
    };
    Iot.comms = Dict.zero(function (x) { return x.id; });
    Iot.accounts = {
        login: function (user, password, remember) {
            var loginData = {
                userName: user,
                password: password,
                rememberMe: remember
            };
            var encryptedData = {
                wsHash: Iot._webClient.id,
                ciphertext: encryptedString(Iot._webClient.rsaKey, JSON.stringify(loginData))
            };
            return $.ajax({
                type: "POST",
                url: "/Account/Login",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(encryptedData)
            });
        },
        register: function (user, password, inviteCode) {
            var reqData = {
                "userName": user,
                "password": password,
                "inviteCode": inviteCode
            };
            return $.ajax({
                type: "POST",
                url: "Account/Register",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(reqData)
            });
        },
        getSubAdmins: function () {
            return $.get("Account/subAdmins")
                .then(function (data) { return Dict.ofArray(function (x) { return x.openid; }, data); });
        },
        deleteAdmins: function (ids) {
            return $.ajax({
                type: "POST",
                url: "Account/DeleteAdmins",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ids)
            });
        },
        authCommunities: function (openId, ids) {
            return $.ajax({
                type: "POST",
                url: "Account/AuthCommunity/" + openId,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ids)
            });
        },
        unAuthCommunities: function (openId, ids) {
            return $.ajax({
                type: "POST",
                url: "Account/ReleaseCommunity/" + openId,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ids)
            });
        },
        newInviteCode: function (level, communities, remark) {
            var reqData = {
                communities: communities,
                level: level,
                remark: remark
            };
            return $.ajax({
                type: "POST",
                url: "Account/InviteCode",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(reqData)
            });
        }
    };
    Iot.communities = {
        modify: function (id, name, remark) {
            var editData = {
                id: id,
                name: name,
                remark: remark
            };
            return $.ajax({
                type: "POST",
                url: "Communities/Edit",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(editData)
            });
        },
        delete: function (ids) {
            return $.ajax({
                type: "POST",
                url: "Communities/Delete",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ids)
            });
        },
        create: function (area, name, remark) {
            var newCommunityData = {
                "area": area,
                "name": name,
                "remark": remark
            };
            return $.ajax({
                type: "POST",
                url: "Communities/Create",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(newCommunityData)
            });
        },
        loadArch: function (id) {
            return $.get("Communities/LoadArch/" + id)
                .then(function (x) {
                var arch = ArchService.ofDoc(x);
                Iot.getCommunity(id).arch = arch;
                return arch.communityX;
            });
        },
        updateArch: function (data) {
            return $.ajax({
                type: "POST",
                url: "Communities/SendArch",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(data)
            });
        },
        flatten: function (communityId, room) {
            return Iot.comms.$[communityId].arch.flatTable[room];
        }
    };
    Iot.manage = {
        changePassword: function (oldPassword, newPassword) {
            var reqData = {
                oldPassword: oldPassword,
                newPassword: newPassword
            };
            return $.ajax({
                type: "POST",
                url: "Manage/ChangePassword",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(reqData)
            });
        }
    };
    Iot.persons = {
        sum: function (communityId) {
            return $.get("Citizen/Folk/" + communityId)
                .then(function (x) { return Dict.ofArray(function (t) { return t.nric; }, x); });
        },
        put: function (value) {
            return $.ajax({
                type: "put",
                url: "Citizen",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        delete: function (communityId, nric) {
            var value = {
                id: communityId,
                nric: nric
            };
            return $.ajax({
                type: "DELETE",
                url: "Citizen",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        get: function (id) {
            return $.get("Citizen/" + id);
        }
    };
    Iot.devices = {
        items: function (communityId, callbackfn) {
            var devices = Iot.getCommunity(communityId).devices;
            if (devices)
                callbackfn(devices);
            else {
                $.get("Devices/Folk/" + communityId)
                    .then(function (x) {
                    var data = Dict.orderByArray(function (t) { return t.id; }, x, function (t) { return t.address; });
                    Iot.getCommunity(communityId).devices = data;
                    callbackfn(data);
                });
            }
        },
        put: function (value) {
            return $.ajax({
                type: "put",
                url: "Device",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        delete: function (id) {
            return $.ajax({
                type: "DELETE",
                url: "Device/" + id,
                contentType: "application/json; charset=utf-8"
            });
        }
    };
    Iot.cards = {
        sum: function (communityId) {
            return $.get("Cards/Folk/" + communityId);
        },
        put: function (valud) {
            return $.ajax({
                type: "put",
                url: "Cards",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(valud)
            });
        },
        delete: function (value) {
            return $.ajax({
                type: "DELETE",
                url: "Cards",
                data: JSON.stringify(value),
                contentType: "application/json; charset=utf-8"
            });
        },
        issue: function (id, value) {
            return $.ajax({
                type: "put",
                url: "Cards/" + id,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        withdraw: function (id, value) {
            return $.ajax({
                type: "delete",
                url: "Cards/" + id,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        }
    };
    Iot.fingerprints = {
        sum: function (communityId) {
            return $.get("Fingerprints/Folk/" + communityId);
        },
        get: function (nric) {
            return $.get("Fingerprints/" + nric);
        },
        bind: function (value) {
            return $.ajax({
                type: "put",
                url: "Fingerprints/Bind",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        put: function (value) {
            return $.ajax({
                type: "put",
                url: "Fingerprints",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        delete: function (value) {
            return $.ajax({
                type: "DELETE",
                url: "Fingerprints",
                data: JSON.stringify(value),
                contentType: "application/json; charset=utf-8"
            });
        },
        issue: function (id, value) {
            return $.ajax({
                type: "put",
                url: "Fingerprints/" + id,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        withdraw: function (id, value) {
            return $.ajax({
                type: "delete",
                url: "Fingerprints/" + id,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        }
    };
    Iot.advertising = {
        files: {
            sum: function () {
                return $.get("Advertising/Files");
            },
            get: function (communityId) {
                return $.get("Advertising/Files/" + communityId);
            },
            post: function (data) {
                return Iot.postForm("/Advertising/Files", data);
            },
            put: function (data) {
                return $.ajax({
                    url: "/Advertising/Files",
                    type: "put",
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8"
                });
            }
        },
        plans: {
            get: function (communityId) {
                return $.get("/Advertising/Plans/" + communityId);
            },
            delete: function (id) {
                return $.ajax({
                    type: "delete",
                    url: "Advertising/Plans/" + id
                });
            },
            post: function (communityId, value) {
                return $.ajax({
                    type: "post",
                    url: "Advertising/Plans/" + communityId,
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(value)
                });
            }
        },
        devices: {
            get: function (planId) {
                return $.get("Advertising/Devices/" + planId);
            }
        },
        issue: {
            post: function (value) {
                return $.ajax({
                    type: "delete",
                    url: "Advertising/Issue",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(value)
                });
            }
        }
    };
    Iot.ranger = {
        devices: {
            get: function (communityId) {
                return $.get("Ranger/Gates/" + communityId);
            }
        },
        events: {
            query: function (value) {
                return $.ajax({
                    type: "post",
                    url: "Ranger/QueryEvents/" + Iot._webClient.id,
                    data: JSON.stringify(value),
                    contentType: "application/json; charset=utf-8"
                });
            }
        },
        logs: {
            query: function (value) {
                return $.ajax({
                    type: "post",
                    url: "Ranger/QueryLogs/" + Iot._webClient.id,
                    data: JSON.stringify(value),
                    contentType: "application/json; charset=utf-8"
                });
            }
        }
    };
    return Iot;
}());
//# sourceMappingURL=iot.js.map