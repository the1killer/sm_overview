const fs = require('fs');

let path = './html/';
let filename = path+"assets/json/cells.json";

let SMCellParser;
SMCellParser = (function() {

    const parse = function() {
        let filedata = fs.readFileSync(filename);
        let json = JSON.parse(filedata);
        var cells = new Array();
        var x=0,y=0;
        json.forEach((cell) => {
                try {
                    let pt = getPoiType(cell.tileid);
                    if(pt) {
                        cell.poiType = pt;
                    }
                } catch (err) {
                    console.log(err)
                    // console.log("tileId not found for "+x+","+y);
                }
                try {
                    var ctype = getCellType(cell.flags)
                    cell.type = TypeTags[ctype];
                } catch (err) {
                    // console.log("flags not found for "+x+","+y);
                    // console.log(err);
                    // exit();
                }
                try {
                    var roads = getCellRoads(cell.flags)
                    if(roads != undefined) {
                        cell.roads = roads;
                    }
                } catch (err) {
                    console.log(err)
                }
                cells.push(cell);
        })

        cells.forEach((cell)=>{
            var turl = getTileURL(cell.tileid,cell.x,cell.y);
            var purl = getPoiUrl(cell.poiType,cell.tileid,cell.x,cell.y);
            if(cell.type != 'LAKE' && (turl == undefined && purl == undefined) && cell.poiType != "POI_CRASHSITE_AREA") {
                console.warn(`Missing image at ${cell.x},${cell.y} for id ${cell.tileid} ${cell.type} ${cell.poiType || ''}`)
            }
        });

        console.log("cell count: "+cells.length);

        // return cells;
    }

    function getCellType( flags ) {
        // if insideCellBounds( cellX, cellY ) then
            return (flags & MASK_TERRAINTYPE) >> SHIFT_TERRAINTYPE
        // end
        // return 0
    }

    function getPoiType( id ) {
        var poiType = Math.floor( id / 100 )
        if (poiType < 10000) {
            return POIS[poiType]
        }
        return null
    }

    function getCellRoads(flags) {
        let roadflags = flags & MASK_ROADS;
        let roads = "";
        if(roadflags & FLAG_ROAD_N) {
            roads += "N"
        }
        if(roadflags & FLAG_ROAD_S) {
            roads += "S"
        }
        if(roadflags & FLAG_ROAD_E) {
            roads += "E"
        }
        if(roadflags & FLAG_ROAD_W) {
            roads += "W"
        }
        if (roads != "") {
            return roads;
        }
    }

    // ////////////////////////////////////////////////////////////////////////////////
    // // Cell type constants
    // ////////////////////////////////////////////////////////////////////////////////

    const TYPE_MEADOW = 1
    const TYPE_FOREST = 2
    const TYPE_DESERT = 3 //TODO: Ravine. A desert cliff type of thing.
    const TYPE_FIELD = 4
    const TYPE_BURNTFOREST = 5
    const TYPE_AUTUMNFOREST = 6
    const TYPE_MOUNTAIN = 7
    const TYPE_LAKE = 8

    const DEBUG_R = 243
    const DEBUG_G = 244
    const DEBUG_B = 245
    const DEBUG_C = 246
    const DEBUG_M = 247
    const DEBUG_Y = 248
    const DEBUG_BLACK = 249
    const DEBUG_ORANGE = 250
    const DEBUG_PINK = 251
    const DEBUG_LIME = 252
    const DEBUG_SPING = 253
    const DEBUG_PURPLE = 254
    const DEBUG_LAKE = 255

    var TypeTags = ["NONE", "MEADOW", "FOREST", "DESERT", "FIELD", "BURNTFOREST", "AUTUMNFOREST", "MOUNTAIN", "LAKE"]

    // ////////////////////////////////////////////////////////////////////////////////////////////////////
    // // Constants
    // ////////////////////////////////////////////////////////////////////////////////////////////////////

    const CELL_SIZE = 64

    const MASK_CLIFF = 0x00ff
    const MASK_ROADS = 0x0f00
    const MASK_ROADCLIFF = 0x0fff
    const MASK_TERRAINTYPE = 0xf000
    const MASK_FLAT = 0x10000

    const FLAG_ROAD_E = 0x0100
    const FLAG_ROAD_N = 0x0200
    const FLAG_ROAD_W = 0x0400
    const FLAG_ROAD_S = 0x0800

    const MASK_ROADS_SN = FLAG_ROAD_S|FLAG_ROAD_N
    const MASK_ROADS_WE = FLAG_ROAD_W|FLAG_ROAD_E

    const SHIFT_TERRAINTYPE = 12

    ////////////////////////////////////////////////////////////////////////////////


    ////////////////////////////////////////////////////////////////////////////////

    // No type = MEADOW
    // No size = SMALL

    // Unique (MEADOW)
    var POIS = {};
    POIS[101] = "POI_CRASHSITE_AREA" //predefined area
    POIS[102] = "POI_HIDEOUT_XL"
    POIS[103] = "POI_SILODISTRICT_XL"
    POIS[104] = "POI_RUINCITY_XL" //roads
    POIS[105] = "POI_CRASHEDSHIP_LARGE"
    POIS[106] = "POI_CAMP_LARGE"
    POIS[107] = "POI_CAPSULESCRAPYARD_MEDIUM"
    POIS[108] = "POI_LABYRINTH_MEDIUM"

    // Special (MEADOW)
    POIS[109] = "POI_MECHANICSTATION_MEDIUM" // roads
    POIS[110] = "POI_PACKINGSTATIONVEG_MEDIUM" // roads
    POIS[111] = "POI_PACKINGSTATIONFRUIT_MEDIUM" // roads

    // Large Random
    POIS[112] = "POI_WAREHOUSE2_LARGE" // 2 floors, roads
    POIS[113] = "POI_WAREHOUSE3_LARGE" // 3 floors, roads
    POIS[114] = "POI_WAREHOUSE4_LARGE" // 4 floors, roads
    POIS[501] = "POI_BURNTFOREST_FARMBOTSCRAPYARD_LARGE" // burnt forest center


    // Small Random
    POIS[115] = "POI_ROAD" // meadow with roads

    POIS[116] = "POI_CAMP"
    POIS[117] = "POI_RUIN"
    POIS[118] = "POI_RANDOM"

    POIS[201] = "POI_FOREST_CAMP"
    POIS[202] = "POI_FOREST_RUIN"
    POIS[203] = "POI_FOREST_RANDOM"

    POIS[301] = "POI_DESERT_RANDOM"

    POIS[119] = "POI_FARMINGPATCH" // meadow adjacent to field
    POIS[401] = "POI_FIELD_RUIN"
    POIS[402] = "POI_FIELD_RANDOM"

    POIS[502] = "POI_BURNTFOREST_CAMP"
    POIS[503] = "POI_BURNTFOREST_RUIN"
    POIS[504] = "POI_BURNTFOREST_RANDOM"

    POIS[601] = "POI_AUTUMNFOREST_CAMP"
    POIS[602] = "POI_AUTUMNFOREST_RUIN"
    POIS[603] = "POI_AUTUMNFOREST_RANDOM"

    POIS[801] = "POI_LAKE_RANDOM"

    // Medium Random
    POIS[120] = "POI_RUIN_MEDIUM"
    POIS[121] = "POI_CHEMLAKE_MEDIUM"
    POIS[122] = "POI_BUILDAREA_MEDIUM"

    POIS[204] = "POI_FOREST_RUIN_MEDIUM"

    POIS[802] = "POI_LAKE_UNDERWATER_MEDIUM"


    POIS[1] = "POI_RANDOM_PLACEHOLDER"
    POIS[99] = "POI_TEST"


    function getTileURL(tileid,x,y) {
        var tiles = [
            10105,10106,10107,10108,
            11501,11502,11503,11504,11505,11506,11507,
            11601,
            11701,11702,11703,11704,
            11801,11802,11803,11804,11805,11806,11807,11808,11809,
            11901,11902,11903,
            20101,20102,20103,20104,20105,20106,20107,
            20301,20302,20303,20304,20305,20306,20307,
            30101,30102,
            40101,40201,40202,40203,
            50201,
            50301,
            50402,
            60101,60102,60103,
            60201,
            60301,60302,60303,60304,
            80103,
            1000001,1000002,1000003,1000004,1000005,1000006,1000007,1000008,1000009,1000010,1000011,1000012,1000013,1000014,1000015,1000016,1000017,1000018,1000019,1000020,1000021,1000022,1000023,1000024,1000025,1000026,1000027,1000028,1000029,
            1000101,1000102,1000103,1000105,1000106,1000107,1000104,1000201,1000202,1000301,
            1000501,1000502,1000503,1000504,1000505,1000506,1000507,1000508,1000509,
            1000601,1000602,
            1000701,
            1000901,1000902,
            1001001,1001002,1001101,1001301,1001401,1001501,1001701,1001702,1002101,1002102,1002103,1002201,1002301,1002501,1002502,1002503,1002601,1002602,1002701,
            1003001,1003101,1003701,1004701,1005301,1005501,1005701,1005801,1005901,1006101,1006201,1006301,
            1004101,1004102,1004201,1004301,
            1025601,1128402,
            1076801,1076802,1076803,1076804,1076805,1076806,1076807,1076808,1076809,1076810,1076811,1076812,1076813,1076814,
            1076901,
            1077201,1077301,1078401,1078801,1078901,
            1083201,1083701,1084801,1084901,
            1128001,1128002,1128003,1128004,1128005,1128006,1128007,1128008,1128009,1128010,1128011,1128012,1128013,1128014,1128015,1128016,1128501,
            1128101,1128401,1130001,1130101,1134901,1179201,1083301,
            1384001,1384002,
            2000101,2000102,2000103,2000104,2000105,2000301,2000302,2000303,2000304,2000305,2000501,2000701,2001501,2001502,2001503,
            3000101,3000301,3000302,3000701,3000501,3001501,3001502,3001503,3001504,3001505,3001506,
            4000101,4000301,4000501,4000701,4001501,4001502,4001503,4001504,4001505,4001506,4001507,
            5000101,5000102,5000103,5000301,5000302,5000303,5000501,5000701,5000702,5000703,5001501,5001502,
            6000101,6000102,6000103,6000104,6000105,
            6000301,6000302,6000303,6000304,6000305,
            6000501,
            6000701,
            6001501,6001502,
            8000101,8000102,8000103,8000104,8000105,8000106,8000107,8000108,8000109,8000110,8000111,
            8000301,8000302,8000303,8000304,8000305,8000306,8000307,8000308,8000309,8000310,8000311,8000312,8000313,8000314,
            8000501,
            8000701,8000702,8000703,8000704,8000705,8000706
        ];
        if(tiles.includes(tileid)) {
            return `./assets/img/tiles/${tileid}.jpg`
        }
        // if(tileid > 8000000) {
        //     return './assets/img/lake_generic.jpg'
        // }
        if(x == -37 && y == -39) {
            return './assets/img/start_crashsite_-37_-39.jpg';
        } else if(x == -37 && y == -39) {
            return './assets/img/start_crashsite_-37_-39.jpg';
        } else if(x == -37 && y == -40) {
            return './assets/img/start_crashsite_-37_-40.jpg';
        } else if(x == -36 && y == -40) {
            return './assets/img/start_crashsite_-36_-40.jpg';
        } else if(x == -36 && y == -41) {
            return './assets/img/start_crashsite_-36_-41.jpg';
        }
    }

    var POI_SIZES = {
        // "POI_ROAD":1,
        "POI_CRASHSITE_AREA":2,
        "POI_MECHANICSTATION_MEDIUM":2,
        "POI_LABYRINTH_MEDIUM":2,
        "POI_CHEMLAKE_MEDIUM":2,
        "POI_RUIN_MEDIUM":2,
        "POI_FOREST_RUIN_MEDIUM":2,
        "POI_CAPSULESCRAPYARD_MEDIUM":2,
        "POI_PACKINGSTATIONVEG_MEDIUM": 2,
        "POI_PACKINGSTATIONFRUIT_MEDIUM": 2,
        "POI_LAKE_UNDERWATER_MEDIUM": 2,
        "POI_CAMP_LARGE":4,
        "POI_CRASHEDSHIP_LARGE":4,
        "POI_BURNTFOREST_FARMBOTSCRAPYARD_LARGE":4,
        "POI_WAREHOUSE2_LARGE":4,
        "POI_WAREHOUSE3_LARGE":4,
        "POI_WAREHOUSE4_LARGE":4,
        "POI_HIDEOUT_XL":8,
        "POI_RUINCITY_XL": 8,
        "POI_SILODISTRICT_XL": 8
    };

    function getPoiUrl(poiType,tileid,x,y) {
        switch(poiType) {
            case 'POI_MECHANICSTATION_MEDIUM':
                return './assets/img/mechanic_station.png'
            break;
            case 'POI_HIDEOUT_XL':
                return './assets/img/hideout.png'
            break;
            case 'POI_CAMP_LARGE':
                return './assets/img/camp_large.jpg'
            break;
            case 'POI_WAREHOUSE4_LARGE':
                return './assets/img/warehouse4.png'
            break;
            case 'POI_WAREHOUSE3_LARGE':
                return './assets/img/warehouse3_large.png'
            break;
            case 'POI_WAREHOUSE2_LARGE':
                return './assets/img/warehouse2.jpg'
            break;
            case 'POI_SILODISTRICT_XL':
                return './assets/img/silodistrict.jpg'
            break;
            case 'POI_RUINCITY_XL':
                return './assets/img/scrapcity.jpg'
            break;
            case 'POI_PACKINGSTATIONVEG_MEDIUM':
                return './assets/img/packing_veg.jpg'
            break;
            case 'POI_PACKINGSTATIONFRUIT_MEDIUM':
                return './assets/img/packing_fruit.jpg'
            break;
            case 'POI_CHEMLAKE_MEDIUM':
                if(tileid == 12103) {
                    return './assets/img/chemlake_medium_3.jpg'
                } else if(tileid == 12102) {
                    return './assets/img/chemlake_medium_2.jpg'
                }
                return './assets/img/chemlake_medium_1.jpg'
            break;
            case 'POI_RUIN_MEDIUM':
                if(tileid == 12003) {
                    return './assets/img/ruin_medium_3.jpg'
                }
                return './assets/img/ruin_medium_4.jpg'
            break;
            case 'POI_FOREST_RUIN_MEDIUM':
                if(tileid == 20402) {
                    return './assets/img/forest_ruin_medium_2.jpg'
                }
                return './assets/img/forest_ruin_medium_1.jpg'
            break;
            case 'POI_LAKE_UNDERWATER_MEDIUM':
                if(tileid == 80203) {
                    return './assets/img/underwater_med_3.jpg'
                } else 
                if(tileid == 80204 || tileid == 80202) {
                    return './assets/img/underwater_med_4.jpg'
                }
                // return './assets/img/underwater_med_3.jpg'
            break;
            case 'POI_CRASHSITE_AREA':
                if(tileid == 10103) {
                    return './assets/img/start_crashsite3.jpg'
                } else if(tileid == 10102) {
                    return './assets/img/start_crashsite2.jpg'
                } else if (tileid == 10101 && x == -38 && y == -42) {
                    return './assets/img/start_crashsite1.jpg'
                }
            break;
            case 'POI_CAPSULESCRAPYARD_MEDIUM':
                    return './assets/img/capsule_scrapyard.jpg'
            break;
            case 'POI_BURNTFOREST_FARMBOTSCRAPYARD_LARGE':
                    return './assets/img/burntforest_farmbot_scrapyard.jpg'
            break;
            case 'POI_CRASHEDSHIP_LARGE':
                    return './assets/img/crashed_ship.jpg'
            break;
            case 'POI_LABYRINTH_MEDIUM':
                    return './assets/img/labyrinth.jpg'
            break;
            case 'POI_BUILDAREA_MEDIUM':
                    return './assets/img/buildarea.jpg'
            break;
        }
    }
    

    return {
        parse
    }
})();

SMCellParser.parse();