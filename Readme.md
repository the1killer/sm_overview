<img src="https://i.imgur.com/orwkU5q.png" style="max-width:75%">

# Introduction
This quickly outputs the world data of your scrap mechanic save game to a json file for display via leafletJS from pre-screenshotted tiles. Not quite as beautiful as my [older screenshot method], but SOOOOOoooooo much quicker. This method is somewhat future proof as well. New tiles will still be displayed just blank, but updates should only require a new download of the missing tiles images.

# Example
https://the1killer.github.io/scrapmechanictilemap/

# INSTRUCTIONS

!!!! BACKUP YOUR SAVE, not responsible for any issues !!!!

1. **Really backup your save!**
1. Download this repoistory, green "Code" button on the top right, or [Download Link]
1. Open terrain_overworld.lua from the downloaded files.
1. Copy lines 73-98, `local cells` *...to...* `cells = nil   end`
1. Open terrain_overworld.lua in your game files, e.x. C:\Program Files (x86)\Steam\steamapps\common\Scrap Mechanic\Survival\Scripts\game\terrain\terrain_overworld.lua
1. Paste the lines into the game's terrain_overworld.lua, approx **line 71**, after `updateLocationStorage()`
1. Load your save game.
1. Copy **cells.json** from your game files C:\Program Files (x86)\Steam\steamapps\common\Scrap Mechanic\Survival\ to the **html\assets\json directory** in the downloads.
1. <u>**If hosting on a webserver**</u>
    1. Copy all the files under **html/** to your webserver and open index.html and good to go.
1. <u>**If viewing locally**</u>
    1. Open **cells.json**, select all text (ctrl-a), copy all text
    1. Open **html/index.html**, on line 26 `SMOverviewMap.init();` add two back ticks( ` ) inside the parentheses
    1. Paste the text from cell.json inbetween the backticks. becomes `SMOverviewMap.init(`\``[[{......`\``);`
    1. Open **html/index.html** to view your map
1. If you wish, remove or comment (--) the added lines in terrain_overworld.lua to improve game loading times


## Some things to note
- Terrain height not really shown.
- Game updates will remove the lua changes, requiring you to re-add them
- How to setup your own free [GitHub website]
- I think there could be some missing road/cliff tiles as there are many possibilties on how they mesh with eachother. Create an issue with your map seed and I can try to capture them.


# Changelog
- v1.0.0
    - Initial Release

# Donation
If you love this project and want to see more features give the developer a cup of coffee!
<form action="https://www.paypal.com/donate" method="post" target="_top">
<input type="hidden" name="cmd" value="_donations" />
<input type="hidden" name="business" value="7JF52HNLJNHFE" />
<input type="hidden" name="item_name" value="SM Overview Donations" />
<input type="hidden" name="currency_code" value="USD" />
<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
<img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
</form>


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
[Download Link]: https://github.com/the1killer/sm_overview/archive/main.zip
[older screenshot method]: https://github.com/the1killer/sm_overview_ahk