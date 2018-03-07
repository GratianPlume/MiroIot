/// <reference path="./node_modules/@types/jquery/index.d.ts" />

class Community {
    arch: ArchService;
    devices: Dict<Device>;
    cards: Dict<Card>;
    fingerprints: Dict<Fingerprint>;
    constructor(public readonly id: Guid) {
    }
}

class Iot {
    private static _webClient: WebClient;
    static startTime: string;
    static title: string;
    static advertisingMode: boolean;
    static comms = Dict.zero<Community>(x => x.id);
    static current: Community;

    static connect() {
        console.log("iot.connect");
        Iot._webClient = WebClient.connect();
        return Iot._webClient;
    }

    static postForm(url: string, data: FormData): Promise<any> {
        return $.ajax(<any>{
            url: url,
            type: "post",
            data: data,
            contentType: false,
            cache: false,
            processData: false
        });
    }
    /**
     * 获取或者创建一个社区对象
     * @param id 社区ID
     */
    static getCommunity(id: Guid) {
        const x = Iot.comms.$[id];
        if (x)
            return x;
        const y = new Community(id);
        Iot.comms.addOrUpdate(y);
        return y;
    }
    static accounts = {
        login(user: string, password: string, remember: boolean): Promise<AdminData> {
            const loginData = {
                userName: user,
                password: password,
                rememberMe: remember
            };
            const encryptedData = {
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

        register(user: string, password: string, inviteCode: string): Promise<ReasonResults> {
            const reqData = {
                userName: user,
                password: password,
                inviteCode: inviteCode
            };
            return $.ajax({
                type: "POST",
                url: "Account/Register",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(reqData)
            });
        },

        getSubAdmins(): Promise<Dict<AdminData>> {
            return ($.get("Account/subAdmins") as Promise<AdminData[]>)
                .then(data => Dict.ofArray<AdminData>(x => x.openid, data));
        },

        deleteAdmins(ids: Guid[]): Promise<never> {
            return $.ajax({
                type: "POST",
                url: "Account/DeleteAdmins",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ids)
            });
        },

        authCommunities(openId: string, ids: Guid[]): Promise<never> {
            return $.ajax({
                type: "POST",
                url: `Account/AuthCommunity/${openId}`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ids)
            });
        },

        unAuthCommunities(openId: string, ids: Guid[]): Promise<never> {
            return $.ajax({
                type: "POST",
                url: `Account/ReleaseCommunity/${openId}`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ids)
            });
        },

        newInviteCode(level: number, communities: CommunityDetail[], remark: string): Promise<Guid> {
            const reqData = {
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

    static communities = {
        modify(id: Guid, name: string, remark: string): Promise<boolean> {
            const editData = {
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

        delete(ids: Guid[]): Promise<never> {
            return $.ajax({
                type: "POST",
                url: "Communities/Delete",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ids)
            });
        },

        create(area: number, name: string, remark: string): Promise<Guid> {
            const newCommunityData = {
                area: area,
                name: name,
                remark: remark
            };
            return $.ajax({
                type: "POST",
                url: "Communities/Create",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(newCommunityData)
            });
        },
        
        loadArch(id: Guid): Promise<CommunityData> {
            return ($.get(`Communities/LoadArch/${id}`) as Promise<CommunityData>)
                .then(x => {
                    const arch = ArchService.ofDoc(x);
                    Iot.current = Iot.getCommunity(id);
                    Iot.current.arch = arch;
                    return x;
                });
        },

        updateArch(data: CommunityData): Promise<boolean> {
            return $.ajax({
                type: "POST",
                url: "Communities/SendArch",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(data)
            });
        },
        flatten(communityId: Guid, room: Guid) {
            return Iot.comms.$[communityId].arch.flatTable[room];
        }
    };
    /**
     * 管理自己的账户
     */
    static manage = {
        changePassword(oldPassword: string, newPassword): Promise<ReasonResults> {
            const reqData = {
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

    static persons = {
        sum(communityId: Guid): Promise<Dict<Person>> {
            return ($.get(`Citizen/Folk/${communityId}`) as Promise<Person[]>)
                .then(x => Dict.ofArray<Person>(t => t.nric, x));
        },
        put(value: Person): Promise<Nric> {
            return $.ajax({
                type: "put",
                url: "Citizen",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        delete(communityId: Guid, nric: Nric): Promise<never> {
            const value: CommunityPerson = {
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
        get(id: Nric): Promise<Person> {
            return $.get(`Citizen/${id}`);
        }
    };

    static devices = {
        items(communityId: Guid, callbackfn: (x: Dict<Device>) => void) {
            const devices = Iot.getCommunity(communityId).devices;
            if (devices)
                callbackfn(devices);
            else {
                ($.get(`Devices/Folk/${communityId}`) as Promise<Device[]>)
                    .then(x => {
                        const data = Dict.orderByArray<Device>(t => t.id, x, t => t.address);
                        Iot.getCommunity(communityId).devices = data;
                        callbackfn(data);
                    });
            }
            //else 
        },
        put(value: Device): Promise<Device> {
            return $.ajax({
                type: "put",
                url: "Device",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        delete(id: Guid): Promise<never> {
            return $.ajax({
                type: "DELETE",
                url: `Device/${id}`,
                contentType: "application/json; charset=utf-8"
            });
        }
    };

    static cards = {
        sum(communityId: Guid): Promise<Card[]> {
            return $.get(`Cards/Folk/${communityId}`);
        },
        put(valud: Card): Promise<Card> {
            return $.ajax({
                type: "put",
                url: "Cards",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(valud)
            });
        },
        delete(value: Card): Promise<never> {
            return $.ajax({
                type: "DELETE",
                url: "Cards",
                data: JSON.stringify(value),
                contentType: "application/json; charset=utf-8"
            });
        },
        issue(id: Guid, value: Auth): Promise<Result> {
            return $.ajax({
                type: "put",
                url: `Cards/${id}`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        withdraw(id: Guid, value: Auth): Promise<Result> {
            return $.ajax({
                type: "delete",
                url: `Cards/${id}`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        }
    };

    static fingerprints = {
        sum(communityId: Guid): Promise<Fingerprint[]> {
            return $.get(`Fingerprints/Folk/${communityId}`);
        },
        get(nric: Nric): Promise<Fingerprint[]> {
            return $.get(`Fingerprints/${nric}`);
        },
        bind(value: FingerBinder): Promise<boolean> {
            return $.ajax({
                type: "put",
                url: "Fingerprints/Bind",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        put(value: Fingerprint): Promise<Fingerprint> {
            return $.ajax({
                type: "put",
                url: "Fingerprints",
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        delete(value: Fingerprint): Promise<never> {
            return $.ajax({
                type: "DELETE",
                url: "Fingerprints",
                data: JSON.stringify(value),
                contentType: "application/json; charset=utf-8"
            });
        },
        issue(id: Guid, value: Auth): Promise<Result> {
            return $.ajax({
                type: "put",
                url: `Fingerprints/${id}`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        },
        withdraw(id: Guid, value: Auth): Promise<Result> {
            return $.ajax({
                type: "delete",
                url: `Fingerprints/${id}`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(value)
            });
        }
    };

    static advertising = {
        files: {
            sum(): Promise<Adfile[]> {
                return $.get("Advertising/Files");
            },
            get(communityId: Guid): Promise<Adfile[]> {
                return $.get(`Advertising/Files/${communityId}`);
            },
            post(data: FormData): Promise<Guid> {
                return Iot.postForm("/Advertising/Files", data);
            },
            put(data: Adfile): Promise<never> {
                return $.ajax({
                    url: "/Advertising/Files",
                    type: "put",
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8"
                });
            }
        },
        plans: {
            get(communityId: Guid): Promise<Adplan[]> {
                return $.get(`/Advertising/Plans/${communityId}`);
            },
            delete(id: Guid): Promise<Result> {
                return $.ajax({
                    type: "delete",
                    url: `Advertising/Plans/${id}`
                });
            },
            post(communityId: Guid, value: Adsolid): Promise<Guid> {
                return $.ajax({
                    type: "post",
                    url: `Advertising/Plans/${communityId}`,
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(value)
                });
            }
        },
        devices: {
            get(planId: Guid): Promise<Guid> {
                return $.get(`Advertising/Devices/${planId}`);
            }
        },
        issue: {
            post(value: Adissue): Promise<IssueResult> {
                return $.ajax({
                    type: "delete",
                    url: "Advertising/Issue",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify(value)
                });
            }
        }
    };

    static ranger = {
        devices: {
            get(communityId: Guid): Promise<Device[]> {
                return $.get(`Ranger/Gates/${communityId}`);
            }
        },
        events: {
            query(value: QueryEvents): Promise<never> {
                return $.ajax({
                    type: "post",
                    url: `Ranger/QueryEvents/${Iot._webClient.id}`,
                    data: JSON.stringify(value),
                    contentType: "application/json; charset=utf-8"
                });
            }
        },
        logs: {
            query(value: QueryLogs): Promise<never> {
                return $.ajax({
                    type: "post",
                    url: `Ranger/QueryLogs/${Iot._webClient.id}`,
                    data: JSON.stringify(value),
                    contentType: "application/json; charset=utf-8"
                });
            }
        }
    };
}
