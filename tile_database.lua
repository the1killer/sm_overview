
----------------------------------------------------------------------------------------------------
-- Tile database
----------------------------------------------------------------------------------------------------

local f_idToTilePath = {}
local legacyIds = {} -- Added by Arkanorian for use in 0.6.0
local f_legacyIdUpgradeList = {}

----------------------------------------------------------------------------------------------------

function UpgradeCellData( cellData )

	sm.log.info( "UpgradeCellData - version: "..tostring( cellData.version or 1 ) )
	local upgraded = false
	-- 1 to 2
	if ( cellData.version or 1 ) < 2 then
		cellData.xOffset = cellData.tileOffsetX 		-- rename offset x table
		cellData.tileOffsetX = nil

		cellData.yOffset = cellData.tileOffsetY 		-- rename offset y table
		cellData.tileOffsetY = nil

		if cellData.uid == nil then
			cellData.uid = {}							-- add uid table
		end

		for cellY = cellData.bounds.yMin, cellData.bounds.yMax do
			if cellData.uid[cellY] == nil then
				cellData.uid[cellY] = {}				-- add uid table
			end

			for cellX = cellData.bounds.xMin, cellData.bounds.xMax do
				if cellData.uid[cellY][cellX] == nil then
					cellData.uid[cellY][cellX] = {}		-- add uid table
				end
				local id = cellData.tileId[cellY][cellX]
				local uid = GetLegacyUpgrade( id )
				if not sm.uuid.isNil( uid ) then
					cellData.uid[cellY][cellX] = uid -- (int) tileId -> (uuid) uid
				else
					cellData.uid[cellY][cellX] = sm.uuid.getNil()
				end
			end
		end
		cellData.version = 2
		upgraded = true
	end
	if upgraded then sm.log.info( "	- Upgraded to version "..tostring( cellData.version ) ) else sm.log.info( "	- No upgrade needed" ) end
	return upgraded
end

----------------------------------------------------------------------------------------------------

function GetPath( uid )
	if not f_idToTilePath[tostring( uid )] then
		return nil
	end
	return f_idToTilePath[tostring( uid )].path
end

function GetSize( uid )
	if not f_idToTilePath[tostring( uid )] then
		return nil
	end
	return f_idToTilePath[tostring( uid )].size
end

function GetTerrainType( uid )
	if not f_idToTilePath[tostring( uid )] then
		return nil
	end
	return f_idToTilePath[tostring( uid )].terrainType
end

function GetPoiType( uid )
	if not f_idToTilePath[tostring( uid )] then
		return nil
	end
	return f_idToTilePath[tostring( uid )].poiType
end

-- Added by Arkanorian for use in 0.6.0
function GetLegacyID( uid )
	if not legacyIds[tostring( uid )] then
		return nil
	end
	return legacyIds[tostring( uid )]
end
----------------------------------------------------------------------------------------------------

function AddTile( legacyId, path, terrainType, poiType )
	terrainType = terrainType or 1

	local uid = sm.terrainTile.getTileUuid( path )
	local size = sm.terrainTile.getSize( path )

	if f_idToTilePath[tostring( uid )] == nil then
		f_idToTilePath[tostring( uid )] = { path = path, size = size, terrainType = terrainType, poiType = poiType }
	end
	if legacyId then
		AddLegacyUpgrade( legacyId, uid )
		legacyIds[tostring( uid )] = legacyId -- Added by Arkanorian for use in 0.6.0
	end
	return uid
end

----------------------------------------------------------------------------------------------------

function AddLegacyUpgrade( legacyId, uid )
	f_legacyIdUpgradeList[legacyId] = uid
end

function GetLegacyUpgrade( legacyId )
	return f_legacyIdUpgradeList[legacyId]
end

----------------------------------------------------------------------------------------------------
