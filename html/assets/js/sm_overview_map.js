//
// SM Overview Map
// v1.0.0
//
let SMOverviewMap;
SMOverviewMap = (function() {
    var celljson = "";
    var celldata = [];
    var cells = {};
    var map;
    var clickmarker;

    var minZoom = 0
    var maxZoom = 5
    var gridSize = 64

    // A quick extension to allow image layer rotation.
    L.RotateImageLayer = L.ImageOverlay.extend({
        options: {rotation: 0},
        _animateZoom: function(e){
            L.ImageOverlay.prototype._animateZoom.call(this, e);
            var img = this._image;
            img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
        },
        _reset: function(){
            L.ImageOverlay.prototype._reset.call(this);
            var img = this._image;
            img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
        }
    });
    L.rotateImageLayer = function(url, bounds, options) {
        return new L.RotateImageLayer(url, bounds, options);
    };
    
    L.TileLayer.OffsetTileLayer = L.TileLayer.extend({
        _getTilePos: function (coords) {
            var pos = L.TileLayer.prototype._getTilePos.call(this, coords);
            if(coords.z <= 1) {
                return pos.subtract([200, 420]);
            } else if(coords.z == 2){
                return pos.subtract([1200, 1400]);
            } else {
                return pos;
            }
        }
    });

    var markerIcon = L.icon({
        iconUrl: './assets/img/marker.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        // iconSize: [38,84],
        iconSize: [20,44],
        iconAnchor: [9,44],
        popupAnchor: [0,-50]
    })

    L.tileLayer.offsetTileLayer = function(opts) {
        return new L.TileLayer.OffsetTileLayer(opts);
    };

    // var tileLayer = L.tileLayer.offsetTileLayer('./img/{x},{y}.jpg', {
    //     noWrap: true,
    //     maxNativeZoom: 1,
    //     minNativeZoom: 1,
    //     tileSize:250,
    //     className: "imgTileLayer"
    //     // tileSize: 1000
    // }).addTo(map)

    let loadFile = async function(file, callback) {
        $.getJSON(file, function() {
        }).done(function(d) {
            if(typeof callback === 'function') {
                callback(d);
            } else {
                return d;
            }
        }).fail(function(d, e, f) {
            console.warn(file + " had a problem loading. Sorry!");
            console.warn(d, e, f);
        }).always(function() {
        });
    };
    let xy = function(x, y) {
        let n = L.latLng;
        return L.Util.isArray(x) ? n(x[1], x[0]) : n(y, x)
    }

    let loadCells = function(json) {
        celljson = json;
        celldata = SMCellParser.parse(json)

        // var lakeTypes = {}
        var poiCoords = [];
        // var cells = {};
        var stats = "";
        var typeCounts = [];
        var poiCounts = [];
        celldata.forEach((cell) => {
            if(cells[cell.x] == undefined) {
                cells[cell.x] = {};
            }
            cells[cell.x][cell.y] = cell;
            if(cell.poiType) {
                poiCoords.push([cell.x,cell.y]);
            }
            if(typeCounts[cell.type] == undefined) {
                typeCounts[cell.type] = 0;
            }
            typeCounts[cell.type] += 1;
            // if(cell.type == 'LAKE') {
            //     var id = cell.tileid;
            //     if(lakeTypes[id] == undefined) {
            //         lakeTypes[id] = 1;
            //     } else {
            //         lakeTypes[id] = lakeTypes[id] + 1;
            //     }
            // }
        })
        stats += `Map Seed: ${celldata[0].seed}<br/>`
        stats += `<div class="stat-title">Cell Types:</div><table>`

        var sortedKeys = Object.keys(typeCounts).sort(function(a,b) {
            return ( typeCounts[a] > typeCounts[b] ) ? -1 : 1;
        })
        sortedKeys.forEach((t) => {
            var name = t;
            if(name == "NONE") {name = "NONE (Road/Cliff)"}
            stats += `<tr><td>${name}:</td><td>${typeCounts[t]} (${Math.floor((typeCounts[t] / celldata.length) * 100)}%)</td></tr>`
        })
        stats += "</table>"
        // console.log(JSON.stringify(lakeTypes))

        var poisSum = 0;
        poiCoords.forEach((coord) => {
            let x=coord[0],y=coord[1];
            let cell = cells[x][y];
            if(cell.poiType && cell.foundPoi == undefined) {
                if(poiCounts[cell.poiType] == undefined) {
                    poiCounts[cell.poiType] = 0;
                }
                // if(cell.poiType != "POI_CRASHSITE_AREA") {
                    poiCounts[cell.poiType] += 1;
                    poisSum += 1;
                // }

                let size = POI_SIZES[cell.poiType]
                if(size != undefined) {
                    // console.log(`found ${cell.poiType} at ${x},${y} with size ${size} with tile id ${cell.tileid}`)
                    let mod = (gridSize / 2)
                    let startx =  mod * x;
                    let starty = ( mod * y ) - mod;
                    let endx = startx + ((size) * mod)
                    let endy = starty + ((size) * mod)
                    let poiUrl = getPoiUrl(cell.poiType,cell.tileid,x,y);
                    if(!poiUrl) {
                        if(cell.type != "LAKE" && cell.poiType != "POI_CRASHSITE_AREA") {
                            console.log(`Missing POI Image at ${x},${y} for id ${cell.tileid} ${cell.poiType}`)
                        }
                    }
                    if(poiUrl != undefined) {
                        let rotation=0;
                        switch(cell.rotation) {
                            case 0:
                                rotation=0;
                            break;
                            case 1:
                                rotation=270;
                                // startx += mod * size
                                starty -= mod * size
                                // endx += mod * size
                                endy -= mod * size
                            break;
                            case 2:
                                rotation=180;
                                startx += mod * size
                                starty -= mod * size
                                endx += mod * size
                                endy -= mod * size
                            break;
                            case 3:
                                rotation=90;
                                startx += mod * size
                                // starty += mod * size
                                endx += mod * size
                                // endy += mod * size
                            break;
                        }
                        let poiBounds = [xy(startx, starty), xy(endx, endy)];
                        L.rotateImageLayer(poiUrl, poiBounds, {/*opacity: 0.85,*/ pane:'poiPane',rotation:rotation}).addTo(map).bringToFront();
                    }
                    //Mark all cells for this POI so we dont process them further
                    for(var ix=0;ix<size;ix++) {
                        for(var iy=0;iy<size;iy++) {
                            let poicell = cells[x+ix][y+iy]
                            if(x+ix == -36 && y+iy == -39) {
                                //exception for overlapping cells in starting area
                            } else {
                                poicell.foundPoi = true;
                                if(poiUrl != undefined) {
                                    poicell.poiurlfound = true;
                                }
                            }
                        }
                    }
                }
            }
        })

        var sortedKeys = Object.keys(poiCounts).sort(function(a,b) {
            return ( poiCounts[a] > poiCounts[b] ) ? -1 : 1;
        })

        stats += `<div class="stat-title">POI Types: </div><table>`
        sortedKeys.forEach((t) => {
            stats += `<tr><td>${t}:</td><td>${poiCounts[t]} (${Math.floor((poiCounts[t] / poisSum) * 100)}%)</td></tr>`
        })
        stats += "</table><br/><br/>"

        document.getElementById("stats-content").innerHTML = stats;
        document.getElementById("stats-toggle").addEventListener('click',function(event){
            var content = document.getElementById("stats-content")
            if(content.classList.contains('collapsed')) {
                content.classList.remove("collapsed")
                document.getElementById("stats").classList.add("scroll-y")
            } else {
                content.classList.add("collapsed")
                document.getElementById("stats").classList.remove("scroll-y")
            }
            event.preventDefault();
        })
        
        L.GridLayer.DebugCoords = L.GridLayer.extend({
            createTile: function (coords) {
                var x = coords.x;
                var y = coords.y;
                var tile = document.createElement('div');
                tile.classList.add("cell")
                var inner = document.createElement('div');
                inner.classList.add("innercell")
                // inner.innerHTML = [x, y * -1].join(', ');
                tile.appendChild(inner);

                //temp while matching grid to img
                // x -= 3;
                // y -= 6;

                // tile.innerHTML = [x, y].join(', ');
                var div = document.createElement('div');
                inner.appendChild(div)
                try {
                    var cell = cells[x][y * -1];
                    // var cell = cells[x][y];
                    // inner.innerHTML += "<br/><small>"+[cell.xidx, cell.yidx].join(', ')+"</small>";
                    // div.innerHTML = cell.type;
                    tile.classList.add(cell.type.toLowerCase())
                    if(cell.poiType && cell.type == 'LAKE') {
                        div.innerHTML += "<br/><span class='poilabel'>"+cell.poiType+"</span>"
                        // div.innerHTML += "<div class='tileid'>"+cell.tileid+"</div>"
                    }
                    // div.innerHTML += "<div class='rotLabel'>R:"+cell.rotation+"</div>"
                    // div.innerHTML += "<div class='tileid'>"+cell.tileid+"</div>"

                    var turl = getTileURL(cell.tileid,cell.x,cell.y);
                    if(!turl) {
                        if(cell.type != "LAKE" && POI_SIZES[cell.poiType] == undefined) {
                            console.log(`Missing tile at ${x},${y*-1} for id ${cell.tileid} ${cell.type}`)
                        }
                        if(cell.poiurlfound == true) {
                            tile.classList.remove(cell.type.toLowerCase())
                        }
                    }
                    if(turl) {
                        tile.classList.remove(cell.type.toLowerCase())
                        var img = document.createElement('img');
                        img.src = turl
                        img.classList.add('tileimg')
                        inner.appendChild(img);
                        if(cell.rotation != 0) {
                            img.classList.add('rot-' + cell.rotation)
                        }
                    } else
                    if(cell.roads.length > 0) {
                        var split = cell.roads.split('');
                        split.forEach((dir) => {
                            var road = document.createElement('div');
                            road.classList.add("road-"+dir)
                            // road.innerHTML = dir;
                            inner.appendChild(road)
                            var roadlines = document.createElement('div');
                            roadlines.classList.add("roadline");
                            road.appendChild(roadlines);
                        })
                        tile.classList.remove("none");
                        tile.classList.add("meadow")
                    }
                } catch(error) {
                    // console.log(error)
                }
                // tile.style.outline = '1px solid black';
                return tile;
            }
        });

        L.gridLayer.debugCoords = function(opts) {
            return new L.GridLayer.DebugCoords(opts);
        };

        var myGridLayer = L.gridLayer.debugCoords({
            noWrap: true,
            maxNativeZoom: 1,
            minNativeZoom: 1,
            tileSize: gridSize,
            // opacity: 0.75,
            keepBuffer: 1,
            // bounds: [[-72,-55],[-71,55]],
            className: "gridLayer"
        })
        map.addLayer( myGridLayer);

        // L.control.layers({"Grid": myGridLayer}, {"Img":tileLayer}).addTo(map);
    };

    let init = function(inputjson) {
        // create the map
        map = L.map("map", {
            crs: L.CRS.Simple,
            minZoom: minZoom,
            maxZoom: maxZoom,
            zoomSnap: 0.5,
            zoomDelta: 0.5,
            wheelPxPerZoomLevel: 120
        })
        map.attributionControl.addAttribution("<a target='_new' href='https://github.com/the1killer/sm_overview'>sm_overview By The1Killer</a>")

        map.createPane('poiPane').style.zIndex = 300;

        try {
            var hash = new L.Hash(map);
            if(window.location.hash == null || window.location.hash == "") {
                map.setView([-848,-858],1);
            }
        } catch (error) {
            map.setView([-848,-858],1);
        }

        if(inputjson) {
            loadCells(JSON.parse(inputjson));
        } else {
        loadFile("./assets/json/cells.json",loadCells);
        }

        map.on('click', function(e) {
            // console.log(JSON.stringify(e));
            // console.log(getTileURL(e.latlng.lat, e.latlng.lng, map.getZoom()));
            let xscalar = 2;
            let yscalar = 2;
            let x = Math.floor(e.latlng.lng * xscalar);
            let y = Math.floor(e.latlng.lat * yscalar) + 64;
            
            console.log("lnglat:     ", Math.floor(e.latlng.lng),Math.floor(e.latlng.lat));
            console.log("scaled ll:  ", x,y);
            if(clickmarker) {
                clickmarker.remove();
            }
            clickmarker = L.marker([e.latlng.lat, e.latlng.lng], {icon: markerIcon}).addTo(map);
            // clickmarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
            clickmarker.bindPopup(contentForMarker(x,y))
            clickmarker.openPopup();
            // console.log("layer point:", Math.floor(e.layerPoint.x),Math.floor(e.layerPoint.y));
        });
    }

    function contentForMarker(x,y) {
        let cellX = Math.floor( x / 64)
        let cellY = Math.floor( y / 64)
        let cell = cells[cellX][cellY];
        var ctype = cell.type
        if(ctype == "NONE") {
            ctype = "NONE (Road/Cliff)"
        }
        let poi = cell.poiType;
        var content = `Coords: ${x},${y}<br/>
        Cell: ${cellX},${cellY}<br/>
        Type: ${ctype}<br/>
        TileID: ${cell.tileid}<br/>
        Rotation: ${cell.rotation}`
        if(poi) {
            content += `<br/>POI: ${poi}`
        }

        return content;
    }

    // // .toRad() fix
    // // from: http://stackoverflow.com/q/5260423/1418878
    // if (typeof(Number.prototype.toRad) === "undefined") {
    //     Number.prototype.toRad = function() {
    //         return this * Math.PI / 180;
    //     }
    // }

    // function getTileURL(lat, lon, zoom) {
    //     var xtile = parseInt(Math.floor( (lon + 180) / 360 * (1<<zoom) ));
    //     var ytile = parseInt(Math.floor( (1 - Math.log(Math.tan(lat.toRad()) + 1 / Math.cos(lat.toRad())) / Math.PI) / 2 * (1<<zoom) ));
    //     return "" + zoom + "/" + xtile + "/" + ytile;
    // }
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
            1001001,1001002,1001101,1001301,1001401,1001501,1001701,1001702,1002101,1002102,1002103,1002201,1002301,1002501,1002502,1002503,1002601,1002602,1002701,1002901,
            1003001,1003101,1003501,1003701,1004701,1005301,1005501,1005701,1005801,1005901,1006101,1006201,1006301,
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
        "POI_BUILDAREA_MEDIUM":2,
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

    function getMap(){ return map;}

    function getClickMarker(){ return clickmarker;}

    return {
        init,
        getMap,
        getClickMarker
    }
})();