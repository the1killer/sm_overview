let SMCellParser;
SMCellParser = (function() {

    const parse = function(json) {
        var cells = new Array();
        var x=0,y=0;
        json.forEach((cell) => {
                var xLookup = cell.x;
                var yLookup = cell.y;
                
                try {
                    if(cell.tileid == undefined) {
                        let id = getTileIDFromGuid(cell.uid);
                        if(id) {
                            cell.tileid = id;
                        }
                    }
                    let pt = getPoiType(cell.tileid);
                    if(pt) {
                        cell.poiType = pt;
                    } else {
                        try {
                            let poi = GUIDPOIS[cell.uid];
                            if(poi) {
                                cell.poiType = poi;
                            }
                        } catch(e) {}
                    }
                } catch (err) {
                    console.log(err)
                    // console.log("tileId not found for "+x+","+y);
                }
                
                try {
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

                try {
                    cell.roads = getCellRoads(cell.flags)
                } catch (err) {
                    console.log(err)
                }

                // console.log("x:"+cellX+", y:"+cellY)
                // console.log(cell);
                cells.push(cell);
                // console.log("push");
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

    function getTileIDFromGuid(uid) {
        let tid = GUIDIDS[uid];
        if(tid) {
            return tid;
        }
        return null;
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

    ////////////////////////////////////////////////////////////////////////////////
    // GUID POIs
    ////////////////////////////////////////////////////////////////////////////////

    var GUIDPOIS = {};
    GUIDPOIS['7d7556b3-0dc7-4b95-9d92-731013b19fc0'] = "POI_HIDEOUT_XL";
    GUIDPOIS['943c232a-a780-4099-bffc-54ce08c184c5'] = "POI_CRASHSITE_AREA";

    GUIDPOIS['013e980d-2425-4275-9c4b-c0eee0dba7f1'] = "POI_CHEMICALPLANT_ROAD"; // ChemicalPlant_Road_64_01
    GUIDPOIS['0556fb22-cacc-4402-8d7c-6cfd6f5d39ce'] = "POI_BURNTFOREST_CAMP_01"; // CampingSpot_BurntForest_64_01
    GUIDPOIS['05b6d448-59fa-4abd-8986-5e331eb49af1'] = "POI_AUTUMNFOREST_CAMP_02"; // CampingSpot_AutumnForest_64_02
    GUIDPOIS['0a028fbe-5580-4abc-b48a-66c6a0f67c8e'] = "POI_FOREST_RUIN_01"; // Ruin_Forest_64_01
    GUIDPOIS['0b12d848-284e-4ffb-9e1f-ddc1de9c42f0'] = "POI_LAKE_RANDOM_01"; // Random_Lake_128_01
    GUIDPOIS['0de47979-bf12-4665-bf58-692b5e129b1c'] = "POI_RUIN_06"; // Ruin_Meadow_64_06
    GUIDPOIS['0e74d86b-b2bb-4f57-87d7-bd51faa5242c'] = "POI_LAKE_RANDOM_03"; // Random_Lake_64_03
    GUIDPOIS['10bac32b-48ac-401a-9d7c-b215fc84aa98'] = "POI_RUIN_MEDIUM_04"; // Ruin_Meadow_128_04
    GUIDPOIS['139ff089-19e7-4c65-b02e-0bcdb30e4600'] = "POI_FOREST_CAMP_07"; // CampingSpot_Forest_64_07
    GUIDPOIS['150b28d3-2c48-40b8-a657-907629c63637'] = "POI_FOREST_CAMP_06"; // CampingSpot_Forest_64_06
    GUIDPOIS['16a6315e-897a-4186-abe9-cdf83470757a'] = "POI_AUTUMNFOREST_CAMP_01"; // CampingSpot_AutumnForest_64_01
    GUIDPOIS['18216217-7c49-40ee-afb3-38d2e9555fb8'] = "POI_RUIN_05"; // Ruin_Meadow_64_05
    GUIDPOIS['190ac485-1f21-4490-abdb-0fb1592ab356'] = "POI_AUTUMNFOREST_RUIN_01"; // Ruin_AutumnForest_64_01
    GUIDPOIS['19f3fd49-1aa9-4aea-9fe5-6be46f73844f'] = "POI_FOREST_RUIN_03"; // Ruin_Forest_64_03
    GUIDPOIS['1f041ba4-4fc1-49ec-bf98-63ad8e1f1b96'] = "POI_RUIN_03"; // Ruin_Meadow_64_03
    GUIDPOIS['240b28e9-e298-4306-8d77-aca4b2581670'] = "POI_RUIN_04"; // Ruin_Meadow_64_04
    GUIDPOIS['2510a9a4-cef5-4888-b5b8-ecfcdf042c6d'] = "POI_LABYRINTH_MEDIUM"; // HayBaleLabyrinth_128_01_NEW
    GUIDPOIS['25b787f7-f1f0-4191-985e-0cbbc22821c8'] = "POI_BURNTFOREST_FARMBOTSCRAPYARD_LARGE"; // FarmbotGraveyard_256_01
    GUIDPOIS['28573376-d18d-4f60-a595-e9b27b41cebd'] = "POI_DESERT_RANDOM"; // Random_Desert_64_02
    GUIDPOIS['2908dd45-9767-4c9a-aa00-871a3a0b04b5'] = "POI_SCHEMATICSTATION"; // SchematicStation_64_01
    GUIDPOIS['2baccd93-fb01-49ba-bbce-f26bd6bba53c'] = "POI_FOREST_CAMP_04"; // CampingSpot_Forest_64_04
    GUIDPOIS['2bd45a6c-9da7-47d3-bc06-06ae127a0f8f'] = "POI_LAKE_RANDOM_02"; // Random_Lake_64_02
    GUIDPOIS['2c36976b-e008-408c-a5b5-1baaaf01df04'] = "POI_MECHANICSTATION_MEDIUM"; // MechanicStation_128_01
    GUIDPOIS['2cc399c0-7f60-4737-8ce9-dfebe1cff997'] = "POI_FOREST_CAMP_03"; // CampingSpot_Forest_64_03
    GUIDPOIS['2ce743d8-8466-4e7e-b1a8-0385617b2549'] = "POI_DESERT_RANDOM_01"; // Random_Desert_64_01
    GUIDPOIS['2eb07292-e901-4c84-add5-78130abb32ef'] = "POI_FIELD_RANDOM_01"; // Random_Field_64_01
    GUIDPOIS['2fc07dd0-482c-4eb5-86a0-2d48ba50fad3'] = "POI_FIELD_RUIN_02"; // Ruin_Field_64_02
    GUIDPOIS['31d05f8f-c1a5-493b-8ff0-91dc9af302e4'] = "POI_RUIN_MEDIUM_03"; // Ruin_Meadow_128_03
    GUIDPOIS['33f54ce4-2287-4d9c-a5b1-a62eeca38127'] = "POI_CAMP_WATERFRONT_01"; // CampingSpot_WaterFront_256_01
    GUIDPOIS['36004765-1886-4e65-9c61-26526ae925e3'] = "POI_LAKE_RUIN_02"; // Ruin_Lake_128_02
    GUIDPOIS['3d581892-c351-4a03-a117-562f2a25f18d'] = "POI_LAKE_RUIN_03"; // Ruin_Lake_128_03
    GUIDPOIS['3d64303d-2a54-40b1-a7f4-57382403b2c1'] = "POI_FIELD_RANDOM_02"; // Random_Field_64_02
    GUIDPOIS['3ef31461-6f4e-4fb5-938d-875fb837d736'] = "POI_MECHANICSTATION_MEDIUM";
    GUIDPOIS['3f35b614-e5da-41b1-ad2c-2959a9ae77d6'] = "POI_WAREHOUSE3_LARGE"; // Warehouse_Exterior_3Floors_256_01_NEW
    GUIDPOIS['3f72fa10-2b48-4a1a-ac65-33d481ce3785'] = "POI_FIELD_RANDOM_03"; // Random_Field_64_03
    GUIDPOIS['3ffa9284-021e-4679-8c61-6c35b04361f4'] = "POI_BUNK_INVESTIGATION_QUEST"; // BunkInvestigationQuest_128_01
    GUIDPOIS['4283ed68-9811-4fc6-91b6-156fda5c444f'] = "POI_WAREHOUSE2_LARGE"; // Warehouse_Exterior_2Floors_256_04_NEW
    GUIDPOIS['457232e5-8233-4dc8-8565-3433405ecd77'] = "POI_WAREHOUSE2_LARGE"; // Warehouse_Exterior_2Floors_256_02_NEW
    GUIDPOIS['465b42d9-4db1-4b10-925b-8d517ad37edb'] = "POI_OILPOOL_DESERT_02"; // OilPool_Desert_64_02
    GUIDPOIS['4df0a671-7c8c-4db7-9a6d-3be6e987731e'] = "POI_CHEMLAKE_MEDIUM"; // ChemicalLake_128_03
    GUIDPOIS['4efb5dcb-6f39-4648-af7c-26433cb31a18'] = "POI_FOREST_RANDOM_04"; // Random_Forest_64_04
    GUIDPOIS['5174bec6-0c87-4a03-abfd-21e88c3d1e8a'] = "POI_KIOSK_01"; // Kiosk_64_01
    GUIDPOIS['51ee58d4-5d91-4914-aa42-d35c4521a23b'] = "POI_BURNTFOREST_RUIN"; // Ruin_BurntForest_64_01
    GUIDPOIS['52e21267-288f-483f-acd9-9e5e84adc4e7'] = "POI_FARMINGPATCH"; // FarmingPatch_64_02
    GUIDPOIS['53320dd6-a8f9-44f3-b39b-1b7b42bfbb7b'] = "POI_LAKE_RANDOM_03"; // Random_Lake_128_03
    GUIDPOIS['560ee0c0-5a35-429d-9533-9b9351d82df5'] = "POI_SCHEMATICSTATION_FOREST"; // SchematicStation_Forest_64_01
    GUIDPOIS['5861d377-b27d-4ba7-9167-2ca064915e81'] = "POI_WAREHOUSE2_LARGE"; // Warehouse_Exterior_2Floors_256_03
    GUIDPOIS['5b2285e1-5d70-4598-8831-619911c22d5a'] = "POI_RUIN_09"; // Ruin_Meadow_64_09
    GUIDPOIS['5d3f7eac-7e13-4529-8627-65b3c9f8d281'] = "POI_RANDOM_MEADOW_03"; // Random_Meadow_64_03
    GUIDPOIS['5e9fa630-76fe-4693-be63-00ecd9acf201'] = "POI_WAREHOUSE4_LARGE"; // Warehouse_Exterior_4Floors_256_Quest
    GUIDPOIS['61e5f92c-54eb-478f-943b-38a32348c713'] = "POI_ChemicalPlant_Field"; // ChemicalPlant_Field_64_01
    GUIDPOIS['61fbf237-7ca1-4310-a70b-85c5c047aa1c'] = "POI_FIELD_RUIN"; // Ruin_Field_64_01
    GUIDPOIS['669a9132-e9c2-4961-a6ad-869044058024'] = "POI_WAREHOUSE4_LARGE"; // Warehouse_Exterior_4Floors_256_01_NEW
    GUIDPOIS['68794ad2-e70f-4f68-8dc1-4b396a927d07'] = "POI_RUIN_01"; // Ruin_Meadow_64_01
    GUIDPOIS['69c5db97-2452-4f95-9ec0-573721249137'] = "POI_KIOSK_02"; // Kiosk_64_02
    GUIDPOIS['6a36603f-c0b0-4a23-98c5-6c4df4a1f254'] = "POI_DESERT_RANDOM_02N"; // Random_Desert_64_02_NEW
    GUIDPOIS['6c103a80-f200-46e3-abb8-2857c36f27cb'] = "POI_FOREST_RANDOM_03"; // Random_Forest_64_03
    GUIDPOIS['6cca7d2f-a07b-4133-9ac3-265715be70f6'] = "POI_FOREST_RUIN_02"; // Ruin_Forest_64_02
    GUIDPOIS['70e2d931-7c97-4290-bdbf-436db8582f71'] = "POI_RUIN_MEDIUM_02"; // Ruin_Meadow_128_02
    GUIDPOIS['71acfa84-5a93-4d71-8263-abff15908985'] = "POI_WAREHOUSE2_LARGE"; // Warehouse_Exterior_2Floors_256_02
    GUIDPOIS['7281c295-9748-496b-bc1e-6efe5f5f2541'] = "POI_ROAD_02"; // Random_Road_64_02
    GUIDPOIS['75adfa70-b50e-428e-a035-580091009aee'] = "POI_CAMP_MEADOW_02"; // CampingSpot_Meadow_64_02
    GUIDPOIS['761f7dca-1931-4efc-ad90-22c970ce9ce4'] = "POI_FARMINGPATCH"; // FarmingPatch_64_01
    GUIDPOIS['7736cd40-0adf-459b-8ffc-d0fa4caa5f59'] = "POI_CRASHEDSHIP_LARGE"; // CrashedShip_256_01
    GUIDPOIS['7ba6fefb-8a07-49b8-b61f-a4d4305ecb47'] = "POI_RUIN_11"; // Ruin_Meadow_64_11
    GUIDPOIS['7d7556b3-0dc7-4b95-9d92-731013b19fc0'] = "POI_HIDEOUT_XL"; // Hideout_512_01
    GUIDPOIS['84b61087-2a16-41ee-b23f-56aa4ff5d056'] = "POI_OILPOOL_DESERT_01"; // OilPool_Desert_64_01
    GUIDPOIS['886a58f4-305e-458b-adff-7da04b161707'] = "POI_LAKE_RANDOM"; // Random_Lake_64_01
    GUIDPOIS['887b1866-009d-430d-923c-53f7f6e21f4c'] = "POI_WAREHOUSE2_LARGE"; // Warehouse_Exterior_2Floors_256_01_NEW
    GUIDPOIS['8a2d4fa6-d97a-46e8-b7de-198b9eb54353'] = "POI_FARMINGPATCH"; // FarmingPatch_64_03
    GUIDPOIS['8d4c4773-a2e5-4fdb-b748-ebed4b8eec5e'] = "POI_RANDOM_MEADOW_02"; // Random_Meadow_64_02
    GUIDPOIS['8e3f35e9-c142-4508-87fd-d48affb22fea'] = "POI_RUIN_10"; // Ruin_Meadow_64_10
    GUIDPOIS['8ff1b531-0988-437b-b261-c002dd6e69fc'] = "POI_DESERT_RANDOM"; // Random_Desert_64_01_NEW
    GUIDPOIS['910e80a5-294d-41a0-930e-6887a6cab9cf'] = "POI_FOREST_RANDOM_01"; // Random_Forest_128_01
    GUIDPOIS['921eeedd-3f10-47a5-aabb-81b65db23b06'] = "POI_FOREST_RUIN_MEDIUM"; // Ruin_Forest_128_01
    GUIDPOIS['943c232a-a780-4099-bffc-54ce08c184c5'] = "POI_CRASHSITE_AREA";
    GUIDPOIS['95da1468-8960-4fa7-9157-b5bc478466a4'] = "POI_RUIN_08"; // Ruin_Meadow_64_08
    GUIDPOIS['9755ee40-7f23-4380-8a63-8055060fd18b'] = "POI_CHEMICALPLANT_FOREST"; // ChemicalPlant_Forest_64_01
    GUIDPOIS['9958e995-8416-4970-945f-181c0c8add04'] = "POI_LAKE_RUIN_01"; // Ruin_Lake_128_01
    GUIDPOIS['9b11721e-3df5-438e-92a3-9ce08c5a8e84'] = "POI_AUTUMNFOREST_CAMP_03"; // CampingSpot_AutumnForest_64_03
    GUIDPOIS['9e5e4d7f-020d-4eec-ad19-ee2b19d6283a'] = "POI_SILODISTRICT_XL"; // SiloDistrict_512_01
    GUIDPOIS['9f3b2d02-a1b2-4717-99b8-83cae87bcb7c'] = "POI_PACKINGSTATIONFRUIT_MEDIUM"; // PackingStation_Fruit_128_01
    GUIDPOIS['a0be1f82-5a6c-4dc6-8a38-c09fbb63c002'] = "POI_KIOSK_DESERT_01"; // Kiosk_Desert_64_01
    GUIDPOIS['a132fdc0-2417-4181-91b6-26176657ea4e'] = "POI_RUIN_07"; // Ruin_Meadow_64_07
    GUIDPOIS['a372e03c-8006-44ab-a8ee-15bffec72dbe'] = "POI_FIELD_RUIN_03"; // Ruin_Field_64_03
    GUIDPOIS['a3b7e066-2530-404e-9c4b-d311f569748c'] = "POI_RUIN_MEDIUM_01"; // Ruin_Meadow_128_01
    GUIDPOIS['adc981bf-6a97-4c97-a303-b0066ccea342'] = "POI_CAMP_MEADOW_03"; // CampingSpot_Meadow_64_03
    GUIDPOIS['ae4cc1ea-6407-4baa-a353-620ee1600306'] = "POI_FOREST_RANDOM_02"; // Random_Forest_64_02
    GUIDPOIS['af25cff8-1700-4842-b6f8-b486558cfefc'] = "POI_ROAD_03"; // Random_Road_64_03
    GUIDPOIS['afa0fd48-9c11-43c0-8519-def13c56eb7f'] = "POI_FOREST_CAMP_01"; // CampingSpot_Forest_64_01
    GUIDPOIS['afc8dacf-a2ec-4bc5-9ffb-166372b5fcd2'] = "POI_WAREHOUSE2_LARGE"; // Warehouse_Exterior_2Floors_256_04
    GUIDPOIS['afe1dcc6-0894-4e95-a439-84463fc2a2e4'] = "POI_AUTUMNFOREST_RUIN_03"; // Ruin_AutumnForest_64_03
    GUIDPOIS['b0355ca4-2aec-4a08-8a4a-ac5ea8542055'] = "POI_CHEMLAKE_MEDIUM"; // ChemicalLake_128_02
    GUIDPOIS['b626a6fa-5930-4196-99dd-bf36f629bd0d'] = "POI_WAREHOUSE4_LARGE"; // Warehouse_Exterior_4Floors_256_01
    GUIDPOIS['ba690f45-5e28-42c6-b539-68a5a91303a9'] = "POI_FOREST_RANDOM_01"; // Random_Forest_64_01
    GUIDPOIS['bd9b7d46-b57e-42cb-a470-3e2371921b5d'] = "POI_CAPSULESCRAPYARD_MEDIUM"; // SleepCapsuleBurial_128_01
    GUIDPOIS['bdd72d25-f3b8-4fb6-bb8b-a033e44223fa'] = "POI_RANDOM_05"; // Random_Meadow_64_05
    GUIDPOIS['bfd3e6e5-bd62-4bb9-8ab5-a12d2d44ffa3'] = "POI_FOREST_CAMP_02"; // CampingSpot_Forest_64_02
    GUIDPOIS['c0261f9b-a288-475a-957a-33e01e964002'] = "POI_BURNTFOREST_RUIN_03"; // Ruin_BurntForest_64_03
    GUIDPOIS['c1af7c32-42e8-471f-93b6-019f2c22ed10'] = "POI_RUINCITY_XL"; // RuinCity_512_01_NEW
    GUIDPOIS['c3bda64c-61c7-4dec-9ae0-c6bb2b7a395d'] = "POI_BURNTFOREST_RUIN_02"; // Ruin_BurntForest_64_02
    GUIDPOIS['c60fb408-5ca6-45eb-98d0-dc9a05ed7a66'] = "POI_OILLAKE_DESERT"; // OilLake_Desert_128_01
    GUIDPOIS['c63fd690-594e-4398-9668-84c9c5527df5'] = "POI_LABYRINTH_MEDIUM"; // HayBaleLabyrinth_128_01
    GUIDPOIS['ca8cce51-4e86-4c38-b2a0-e21facb13229'] = "POI_RUIN_02"; // Ruin_Meadow_64_02
    GUIDPOIS['cbeb1357-2027-4a90-bd03-632ccd4509b5'] = "POI_WAREHOUSE3_LARGE"; // Warehouse_Exterior_3Floors_256_01
    GUIDPOIS['cdaaf827-67c2-4e24-b7a0-6daf2dbd9d30'] = "POI_KIOSK_03"; // Kiosk_64_03
    GUIDPOIS['cf65814d-3bd4-4e26-8ec1-1658202727a4'] = "POI_RANDOM_MEADOW_01"; // Random_Meadow_64_01
    GUIDPOIS['d26c9186-24ea-42fa-a6d3-fc6536bb2725'] = "POI_SCHEMATICSTATION_DESERT"; // SchematicStation_Desert_64_01
    GUIDPOIS['d4e2cbc3-62e1-48c5-8bd1-95ab3f7448ac'] = "POI_RUINCITY_XL"; // RuinCity_512_01
    GUIDPOIS['dc5c1caf-885c-4b9e-a3d7-d2578b04e633'] = "POI_WAREHOUSE2_LARGE"; // Warehouse_Exterior_2Floors_256_03_NEW
    GUIDPOIS['dd8b2c81-c9c5-4314-a069-65fa9cea3024'] = "POI_AUTUMNFOREST_RUIN_02"; // Ruin_AutumnForest_64_02
    GUIDPOIS['ddc41612-20f3-484e-b7eb-c0d510d190be'] = "POI_CAMP_04"; // CampingSpot_Meadow_64_04
    GUIDPOIS['e4fbd2dd-6d4a-4bfa-a311-6ae40fdd0f64'] = "POI_CAMP_01"; // CampingSpot_Meadow_64_01
    GUIDPOIS['e7703a66-88a4-44c3-b99d-b22b8418c28b'] = "POI_CHEMLAKE_MEDIUM"; // ChemicalLake_128_01
    GUIDPOIS['e8dfc039-7879-40cb-8b69-696f88d1cb2c'] = "POI_WAREHOUSE2_LARGE"; // Warehouse_Exterior_2Floors_256_01
    GUIDPOIS['ea30c62b-944a-4763-be94-454cd03fa218'] = "POI_ROAD"; // Random_Road_64_04
    GUIDPOIS['f245182c-5f04-462a-b58f-258ec9ad6992'] = "POI_BURNTFOREST_FARMBOTSCRAPYARD_LARGE"; // FarmbotGraveyard_256_02
    GUIDPOIS['f31d8dd8-982a-4637-b8d8-1b333d966663'] = "POI_RANDOM_MEADOW_04"; // Random_Meadow_64_04
    GUIDPOIS['f32ebca6-dd04-462f-a614-884dcb55ccfe'] = "POI_SCHEMATICSTATION_FIELD"; // SchematicStation_Field_64_01
    GUIDPOIS['f3535095-b884-4596-a432-0aee1b5d742a'] = "POI_ROAD"; // Random_Road_64_01
    GUIDPOIS['f3842158-55ff-4e0e-9bdc-e4e83a4c82f6'] = "POI_LAKE_RANDOM_02"; // Random_Lake_128_02
    GUIDPOIS['f3dda4db-8450-4e9d-a501-ec6dbf14a78a'] = "POI_PACKINGSTATIONVEG_MEDIUM"; // PackingStation_Vegetable_128_01
    GUIDPOIS['f7862697-5c60-412d-8508-2e37e8ec7d16'] = "POI_FOREST_CAMP_05"; // CampingSpot_Forest_64_05
    GUIDPOIS['f9ea368e-9873-4c39-a3e1-7dd1cbba6cd5'] = "POI_RANDOM_MEADOW_01"; // Random_Meadow_128_01
    GUIDPOIS['fd3351f8-9af6-4c58-933d-48185fe2c151'] = "POI_KIOSK_FOREST_01"; // Kiosk_Forest_64_01
    
    GUIDPOIS['ff1f81e2-c68f-4421-ab49-3a68926e3947'] = "POI_CRASHSITE_AREA";
    GUIDPOIS['5deb2830-b52e-40af-91c2-e53aee6c5165'] = "POI_SURVIVALSTARTAREA_BOSSMOUNTAIN_01"; // SurvivalStartArea_BossMountain_01.tile

    GUIDPOIS['a47695ef-2028-44c7-8247-5fcad4e10bf8'] = "POI_QUEST_RUIN_AUTUMNFOREST_01"; // Ruin_AutumnForest_RuinsQuest_128_01

    GUIDPOIS['e70e6ba1-29a3-40a4-9ec3-cc2ed60a69c9'] = "POI_GROWLAB_01"; // Minidungeon_Overworld_Entrance_DungeonQuest_256_01
    GUIDPOIS['d159bbf6-7b87-4073-8da7-c6cc3b85e4b5'] = "POI_GROWLAB_02"; // Minidungeon_Overworld_Entrance_256_07
    GUIDPOIS['312e8d1c-de9c-479d-861a-cace1cb480f7'] = "POI_GROWLAB_03"; // MiniDungeon_Overworld_Entrance_256_03
    GUIDPOIS['8e1538ae-6169-4053-b9ae-d80258c6fb3b'] = "POI_GROWLAB_06"; // Minidungeon_OverworldEntrance_Water_512_01
    GUIDPOIS['b5b956c1-bab0-4bbe-abb0-e0ab8d3f1fab'] = "POI_MINIDUNGEON_OVERWORLD_ENTRANCE_04"; // Minidungeon_Overworld_Entrance_256_04
    

    GUIDPOIS['3d8544c6-6439-4fa4-98f0-ca6d172af467'] = "OVERWORLDTOUNDERGROUND_SMALLELEVATOR"; // OverworldToUnderground_SmallElevator_64_01

    GUIDPOIS['6c57b05d-36c7-46df-ae45-7403f756199d'] = "POI_BUILDERQUEST_TOTEBOTKEY_01"; // BuilderQuest_Totebotkey_64_01
    GUIDPOIS['bb5acabd-562f-449f-bece-5a8351c34b6e'] = "POI_BUILDERQUEST_WOCHOUSE_01"; // BuilderQuest_Wochouse_64_01
    GUIDPOIS['c62ca228-3190-4c09-bd1a-88eb32e0695b'] = "POI_BUILDERQUEST_XYLOPHONE_01"; // BuilderQuest_Xylophone_64_01
    GUIDPOIS['d92fa65f-9eda-4e95-ac60-7cd35af64abf'] = "POI_BUILDERQUEST_BAGUETTE_01"; // BuilderQuest_Baguette_128_01
    GUIDPOIS['4bb32278-6e87-482d-a9e3-3476a45a194b'] = "POI_BUILDERQUEST_BEESUIT_01"; // BuilderQuest_Beesuit_64_01
    GUIDPOIS['84cce463-a967-443f-95ff-9fcdb73262b0'] = "POI_BUILDERQUEST_BIGFAN_01"; // BuilderQuest_Bigfan_64_01
    GUIDPOIS['cd2e757d-249d-49af-979c-14428b41f7ad'] = "POI_BUILDERQUEST_CARDBOARDPOOP_01"; // BuilderQuest_Cardboardpoop_64_01
    GUIDPOIS['86854faa-1d4f-4f2a-bb57-877abb8dfbc3'] = "POI_BUILDERQUEST_CAROUSEL_01"; // BuilderQuest_Carousel_64_01
    GUIDPOIS['e010fb27-2d28-44fb-a8e6-e9f9664850a7'] = "POI_BUILDERQUEST_CATAPULT_01"; // BuilderQuest_Catapult_128_01
    GUIDPOIS['9269286f-6bde-4d6d-ad57-3ef57c88980e'] = "POI_BUILDERQUEST_COMPASS_01"; // BuilderQuest_Compass_64_01
    GUIDPOIS['d5532a26-4450-4bc7-9db9-ff370be3dee9'] = "POI_BUILDERQUEST_CORNHEART_01"; // BuilderQuest_Cornheart_64_01
    GUIDPOIS['6ddf24cb-db84-4534-81a8-a9ce81e83d84'] = "POI_BUILDERQUEST_COZYBED_01"; // BuilderQuest_Cozybed_64_01
    GUIDPOIS['5c34eac0-2870-4978-8f05-7478d6e03baa'] = "POI_BUILDERQUEST_CROWBAR_01"; // BuilderQuest_Crowbar_64_01
    GUIDPOIS['405bb852-e090-4ee5-8a2f-24f2395d5d5f'] = "POI_BUILDERQUEST_GARDEN_01"; // BuilderQuest_Garden_64_01
    GUIDPOIS['eb056a47-8122-4fd5-8f45-fbd96c249997'] = "POI_BUILDERQUEST_MUSICBOX_01"; // BuilderQuest_Musicbox_128_01
    GUIDPOIS['da1275c8-2133-442a-b649-6961a5ddeb7f'] = "POI_BUILDERQUEST_NICEHOUSE_01"; // BuilderQuest_Nicehouse_128_01
    GUIDPOIS['d149b9cf-de7e-4fcd-8e82-69c07214d3af'] = "POI_BUILDERQUEST_POPCORN_01"; // BuilderQuest_Popcorn_64_01
    GUIDPOIS['e732c8c9-4580-4ca9-98fd-dbb79c97a623'] = "POI_BUILDERQUEST_RESOURCECAR_01"; // BuilderQuest_ResourceCar_64_01
    GUIDPOIS['49b86128-327e-457c-98f5-1949bee17c3d'] = "POI_BUILDERQUEST_SAWBLADEARM_01"; // BuilderQuest_Sawbladearm_64_01
    GUIDPOIS['311d997e-b8b0-491d-ac9d-176335e94e97'] = "POI_BUILDERQUEST_SLEDGEHAMMER_01";  // BuilderQuest_Sledgehammer_128_01
    GUIDPOIS['328be143-d67d-4b73-a15a-3df26c106f20'] = "POI_BUILDERQUEST_STEELBRIDGE_01"; // BuilderQuest_Steelbridge_128_01


    ////////////////////////////////////////////////////////////////////////////////
    // Guids to old tile IDs for fixing starting area tiles, maybe more in the future
    ////////////////////////////////////////////////////////////////////////////////

    var GUIDIDS = {};
    GUIDIDS['28c8f354-3919-46e4-a311-6c3ceee5b5d9'] = 10101;
    GUIDIDS['943c232a-a780-4099-bffc-54ce08c184c5'] = 10102;
    GUIDIDS['baf427f1-2bb1-41e8-8868-44fc12af5590'] = 10103;

    GUIDIDS['08f0037b-9233-4fe8-b7e1-c1a0c4a2913b'] = 10301; //POI_SILODISTRICT_XL
    GUIDIDS['c1af7c32-42e8-471f-93b6-019f2c22ed10'] = 10401; //Ruin City XL


    
    GUIDIDS['2510a9a4-cef5-4888-b5b8-ecfcdf042c6d'] = 10801; //POI_LABYRINTH_MEDIUM

    return {
        parse
    }
})();