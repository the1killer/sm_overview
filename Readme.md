<img src="https://i.imgur.com/orwkU5q.png" style="max-width:75%">

# Example
https://the1killer.github.io/scrapmechanicmap/

# INSTRUCTIONS

!!!! BACKUP YOUR SAVE, not responsible for any issues !!!!

1. **Really backup your save!**
1. Install [AutoHotKey]
1. Enable dev mode in SurvivalGame.lua, change `if g_survivalDev then`  to  `if true then` around line 84 after function **SurvivalGame.client_onCreate**
1. Add /tp command to SurvivalGame.lua:
    - add /tp to list of chat commands ~line 130
    - add /tp handler ~line 529, before block of commands starting with **elseif params[1] == "/clearpathnodes**
1. Reload save if already in game.
1. Set FOV to 90, see makemap.ahk for other quality settings (alternates for FOV 70 and 90)
1. Make sure Geforce Experience hotkey is **NOT alt+z**, this is so we can hide in game UI
1. Make sure you have nothing in your toolbar 0 slot or 5 slot.... 
    - Sometimes the tp command hits 5 even though command is sent fine
1. Make sure **/god** is on for godmode incase of falling and stops hunger/thirst
1. Make sure you use **/day** to set 12:00 time and no time progression for best looking terrain. If you want night you could do /timeofday 1 and /timeprogress off
1. Double click makemap.ahk script to load the script
1. Press 5 or 0 or any other empty slot on your toolbar to remove tool from view
1. Hit Shit+F1 to start the script, Dont touch your mouse and keyboard until its done
1. Will show a popup "Map Done!" when its finished


## Some things to note
- Shift + F2 to reload the script if you make changes, or to stop it while generating
- Terrain height especially along edges of images will cause lines to not match up
- I reccomended you restart your game between map generations, seems to be a memory leak and FPS slow down.
- Game updates will remove the lua changes, requiring you to re-add them
- Sometimes the teleport will get stuck in a loop if your body goes into ragdoll
- If your machine takes a while to render the tiles after teleport change the delay on line ~101  `Sleep, 4000`
- How to setup your own free [GitHub website]


# Changelog
- v1.0.0
    - Initial Release
    - Support for quality 1,2 on 1080p and 1440p


<br/>
<br/>
<br/>
<br/>
<br/>
<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License</a>.

Scrap Mechanic is property of Axolot Games AB, I have no affiliation with them.

[//]: # (Links)
[AutoHotKey]: https://www.autohotkey.com/
[GitHub website]: https://pages.github.com/