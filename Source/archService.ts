type FlatCompletion = (flat: FlatData) => FlatData
type UnitCompletion = (unit: UnitX) => FlatCompletion
type BlockCompletion = (block: BlockX) => UnitCompletion
interface Flatten {
    [id: string]: {
        block: BlockX;
        unit: UnitX;
        flat: FlatData;
    }
}


class ArchService {
    flatTable: Flatten = {};

    communityX: CommunityX;

    static mapUnit(completion: UnitCompletion): ((data: UnitData) => UnitX) {
        return (data: UnitData) => {
            const flats = data.apartments;
            const unitX: any = {
                id: data.id,
                name: data.name,
            };
            unitX.items = Helper.arrToDic(flats, completion(unitX));
            return unitX;
        }
    }

    static mapBlock(completion: BlockCompletion): (data: BlockData) => BlockX {
        return (data: BlockData) => {
            const blockX: any = {
                id: data.id,
                name: data.name,
            }
            blockX.items = Helper.arrToDic(data.units, ArchService.mapUnit(completion(blockX)));
            return blockX;
        }
    }

    static ofDoc(data: CommunityData): ArchService {
        const arch = new ArchService();
        const completion: BlockCompletion = block => {
            return unit => {
                return flat => {
                    arch.flatTable[flat.guid] = {
                        block: block,
                        unit: unit,
                        flat: flat
                    }
                    return flat;
                }
            }
        }
        const x: any = {
            guid: data.guid,
            name: data.name,
        };
        x.items = Helper.arrToDic(data.buildings, ArchService.mapBlock(completion));
        arch.communityX = <CommunityX>x;
        return arch;
    }
}

