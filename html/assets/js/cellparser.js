let SMCellParser;
SMCellParser = (function() {

    const parse = function(json) {
        var cells = new Array();
        var x=0,y=0;
        json.forEach((cell) => {
                // var cellX = coord.cx,cellY = coord.cy;
                // var x = coord.x,y = coord.y;
                // var cell = {};
                // cell.x = cellX;
                // cell.y = cellY;
                // cell.xidx = x;
                // cell.yidx = y;

                // if(y%10 == 0) {
                //     console.log(cellX,cellY,x,y);
                // }
                
                // var xLookup = cellX;
                // var yLookup = cellY;
                var xLookup = cell.x;
                var yLookup = cell.y;
                // if(xLookup < 0) {
                //     xLookup = x;
                //     // xLookup = spanX - xLookup;
                // }
                // if(yLookup < 0) {
                //     yLookup = y;
                //     // yLookup = spanY - yLookup;
                // }

                try {
                    // cell.tileId = json.tileId[yLookup][xLookup];
                    let pt = getPoiType(cell.tileid);
                    if(pt) {
                        cell.poiType = pt;
                    }
                } catch (err) {
                    console.log(err)
                    // console.log("tileId not found for "+x+","+y);
                }
                // try {
                //     cell.cellDebug = json.cellDebug[yLookup][xLookup];
                // } catch (err) {
                //     // console.log("cellDebug not found for "+x+","+y);
                // }
                try {
                    // cell.flags = json.flags[yLookup][xLookup];
                    var ctype = getCellType(cell.flags)
                    cell.type = TypeTags[ctype];
                    // if cellX >= -46 and cellX < -46 + 20 and cellY >= -46 and cellY < -46 + 16 then
                    //     tags[#tags + 1] = "STARTAREA"
                    // end
                } catch (err) {
                    // console.log("flags not found for "+x+","+y);
                    // console.log(err);
                    // exit();
                }
                // try {
                //     cell.rotation = json.rotation[yLookup][xLookup];
                // } catch (err) {
                //     // console.log("rotation not found for "+x+","+y);
                // }
                // try {
                //     cell.elevation = json.elevation[yLookup][xLookup];
                // } catch (err) {
                //     // console.log("elevation not found for "+x+","+y);
                // }
                // try {
                //     cell.cornerDebug = json.cornerDebug[yLookup][xLookup];
                // } catch (err) {
                //     // console.log("cornerDebug not found for "+x+","+y);
                // }
                // try {
                //     cell.tileOffsetX = json.tileOffsetX[yLookup][xLookup];
                // } catch (err) {
                //     // console.log("tileOffsetX not found for "+x+","+y);
                // }
                // try {
                //     cell.tileOffsetY = json.tileOffsetY[yLookup][xLookup];
                // } catch (err) {
                //     // console.log("tileOffsetY not found for "+x+","+y);
                // }
                try {
                    cell.roads = getCellRoads(cell.flags)
                } catch (err) {
                    console.log(err)
                }

                // console.log("x:"+cellX+", y:"+cellY)
                // console.log(cell);
                cells.push(cell);
                // console.log("push");
                // x+=1;
                // break;
                // y+=1;
            // }
            // })
            // y=0
            // x+=1;

            // x=0;
            // y+=1;
            // break;
        // }
        })

        console.log("cell count: "+cells.length);

        return cells;
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

    

    return {
        parse
    }
})();