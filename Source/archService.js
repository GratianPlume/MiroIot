var ArchService = (function () {
    function ArchService() {
        this.flatTable = {};
    }
    ArchService.mapUnit = function (completion) {
        return function (data) {
            var flats = data.apartments;
            var unitX = {
                id: data.id,
                name: data.name,
            };
            unitX.items = Helper.arrToDic(flats, completion(unitX));
            return unitX;
        };
    };
    ArchService.mapBlock = function (completion) {
        return function (data) {
            var blockX = {
                id: data.id,
                name: data.name,
            };
            blockX.items = Helper.arrToDic(data.units, ArchService.mapUnit(completion(blockX)));
            return blockX;
        };
    };
    ArchService.ofDoc = function (data) {
        var arch = new ArchService();
        var completion = function (block) {
            return function (unit) {
                return function (flat) {
                    arch.flatTable[flat.guid] = {
                        block: block,
                        unit: unit,
                        flat: flat
                    };
                    return flat;
                };
            };
        };
        var x = {
            guid: data.guid,
            name: data.name,
        };
        x.items = Helper.arrToDic(data.buildings, ArchService.mapBlock(completion));
        arch.communityX = x;
        return arch;
    };
    return ArchService;
}());
//# sourceMappingURL=archService.js.map