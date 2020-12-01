/*
sm_overview/makemap.ahk
By The1Killer
License CC BY-NC-SA 4.0
aka you can make changes but you can't commercialize it and you must attribute it to the original author

v1.0.0
*/

#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
#Warn  ; Enable warnings to assist with detecting common errors.
#SingleInstance, Force
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

#Include, drawbox.ahk

overwriteexisting:=false ; false to skip existing files, which makes process resumeable or to easily regenerate bad tiles (after you manually delete the bad images)
quality:=2 ; lower is higher quality, but also slower because more images
smalltest:=false ; set to true to run a 5x5 test, quick way to test your resultion, make sure to clear our your image folder
dirname:=".\html\img" ; NO TRAILING SLASH directory name for images, change if you dont want to overwrite your existing generation

FileCreateDir, %dirname%

; Screenshot Dimension Config
; I created this playing at 2560x1440, change to match the same proportion of your screen
ssX:=780
ssY:=220
ssWidth:=1000
ssHeight:=1000
; for 1080p
ssX:=585
ssY:=165
ssWidth:=750
ssHeight:=750

; map coordinates max are -4000,-3000 to 4000,3000 make sure your jump amount and loops won't exceed this
; Progression calculator thats quick to calculate https://www.math10.com/en/algebra/arithmetic-progression.html#calc

; quality == 1
; requires FOV of 70, generates in about 60 minutes for me
height:=255 
jump:=250
yloop:=23
xloop:=31
y := -2750
startx := -3750
origx := -15
iy := 12

if(quality == 2) { ; requires FOV ov 90, generates in about 35 minutes for me
    height:=250
    jump:=350
    yloop:=18
    xloop:=23
    y:=-2975
    startx:= -3850
    origx := -12
    iy := 9
} else if (quality == 3) {
    height:=350 ; requires FOV of 70, been a while since i tested, probably needs tweaks
    jump:=500
    yloop:=13
    xloop:=17
    y := -3000
    startx := -4000
    origx := -12
    iy := 9
}

if(smalltest == true) {
    xloop:=5
    yloop:=5
    startx:=-2000
    y:=-2000
    origx:=-2
    iy:=2
}


+F2::
    Reload
return

+F1::
    ; Box_Init("FF0000")
    ; Box_Draw(480,220,1000,1000)
    WinActivate, "Scrap Mechanic"
    
    x := startx
    origx := -15
    ix := origx
    iy := 12

    Loop, %yloop% {
        ; Mouse Move to prevent screensaver
        MouseMove, 20, 20, 2, R
        x := startx
        ix := origx
        teleport(x,y)
        Sleep, 3000
        Loop, %xloop% {
            File2 := dirname "\" ix "," iy ".jpg"
            if (overwriteexisting || !FileExist(File2)){
                teleport(x,y)
                Sleep, 4000 ; Change this delay if your machine takes a while to load the tiles after teleporting
                teleport(x,y)
                Send {Alt Down}
                Sleep 50
                Send Z
                Sleep 50
                Send {Alt Up}
                Sleep, 300
                takeScreenshot(ix,iy)
                Sleep, 500
                Send {Alt Down}
                Sleep 50
                Send Z
                Sleep 150
                Send {Alt Up}
                Sleep 50
            }
            ; Sleep, 500
            x := x + jump
            ix := ix + 1
        }
        y := y + jump
        iy := iy - 1
    }
    Sleep, 500

    MsgBox "Map Done!"

return

teleport( x , y) {
    WinGetPos, WinX, WinY, WinWidth, WinHeight, Scrap Mechanic
    WinWidth := WinWidth * 0.0375
    WinHeight := WinHeight * 0.9
    PixelGetColor, color, %WinWidth%, %WinHeight%, RGB
    ; MsgBox The color at %WinWidth%,%WinHeight% is %color%
    if (color != 0xFFFFC0) {
        ; MsgBox, The color at %WinWidth%,%WinHeight% is %color%
        Send {Alt Down}
        Sleep 50
        Send Z
        Sleep 50
        Send {Alt Up}
    }
    global height
    Send, {Enter}
    Send, /tp %x%,%y%,%height%
    Send, {Enter}
}

takeScreenshot(xVal:=0,yVal:=0) {
    global dirname,ssX,ssY,ssWidth,ssHeight
   GDIP("Startup")
    ; img := hWnd_to_hBmp(WinExist("Scrap Mechanic"),False,[500,0,1440,1440])
    img := hWnd_to_hBmp(WinExist("Scrap Mechanic"),False,[ssX,ssY,ssWidth,ssHeight])
    File := dirname "\" xVal "," yVal ".jpg"
    SavePicture(img, File)
    DllCall("DeleteObject", "Ptr", img)
    GDIP("Shutdown") 
}

hWnd_to_hBmp( hWnd:=-1, Client:=0, A:="", C:="" ) {      ; By SKAN C/M on D295|D299 @ bit.ly/2lyG0sN

; Capture fullscreen, Window, Control or user defined area of these

  A      := IsObject(A) ? A : StrLen(A) ? StrSplit( A, ",", A_Space ) : {},     A.tBM := 0
  Client := ( ( A.FS := hWnd=-1 ) ? False : !!Client ), A.DrawCursor := "DrawCursor"
  hWnd   := ( A.FS ? DllCall( "GetDesktopWindow", "UPtr" ) : WinExist( "ahk_id" . hWnd ) )

  A.SetCapacity( "WINDOWINFO", 62 ),  A.Ptr := A.GetAddress( "WINDOWINFO" ) 
  A.RECT := NumPut( 62, A.Ptr, "UInt" ) + ( Client*16 )  

  If  ( DllCall( "GetWindowInfo",   "Ptr",hWnd, "Ptr",A.Ptr )
    &&  DllCall( "IsWindowVisible", "Ptr",hWnd )
    &&  DllCall( "IsIconic",        "Ptr",hWnd ) = 0 ) 
    {
        A.L := NumGet( A.RECT+ 0, "Int" ),     A.X := ( A.1 <> "" ? A.1 : (A.FS ? A.L : 0) )  
        A.T := NumGet( A.RECT+ 4, "Int" ),     A.Y := ( A.2 <> "" ? A.2 : (A.FS ? A.T : 0 )) 
        A.R := NumGet( A.RECT+ 8, "Int" ),     A.W := ( A.3  >  0 ? A.3 : (A.R - A.L - Round(A.1)) ) 
        A.B := NumGet( A.RECT+12, "Int" ),     A.H := ( A.4  >  0 ? A.4 : (A.B - A.T - Round(A.2)) )
        
        A.sDC := DllCall( Client ? "GetDC" : "GetWindowDC", "Ptr",hWnd, "UPtr" )
        A.mDC := DllCall( "CreateCompatibleDC", "Ptr",A.sDC, "UPtr")
        A.tBM := DllCall( "CreateCompatibleBitmap", "Ptr",A.sDC, "Int",A.W, "Int",A.H, "UPtr" )

        DllCall( "SaveDC", "Ptr",A.mDC )
        DllCall( "SelectObject", "Ptr",A.mDC, "Ptr",A.tBM )
        DllCall( "BitBlt",       "Ptr",A.mDC, "Int",0,   "Int",0, "Int",A.W, "Int",A.H
                               , "Ptr",A.sDC, "Int",A.X, "Int",A.Y, "UInt",0x40CC0020 )  

        A.R := ( IsObject(C) || StrLen(C) ) && IsFunc( A.DrawCursor ) ? A.DrawCursor( A.mDC, C ) : 0
        DllCall( "RestoreDC", "Ptr",A.mDC, "Int",-1 )
        DllCall( "DeleteDC",  "Ptr",A.mDC )   
        DllCall( "ReleaseDC", "Ptr",hWnd, "Ptr",A.sDC )
    }        
Return A.tBM
}

SavePicture(hBM, sFile) {                                            ; By SKAN on D293 @ bit.ly/2krOIc9
Local V,  pBM := VarSetCapacity(V,16,0)>>8,  Ext := LTrim(SubStr(sFile,-3),"."),  E := [0,0,0,0]
Local Enc := 0x557CF400 | Round({"bmp":0, "jpg":1,"jpeg":1,"gif":2,"tif":5,"tiff":5,"png":6}[Ext])
  E[1] := DllCall("gdi32\GetObjectType", "Ptr",hBM ) <> 7
  E[2] := E[1] ? 0 : DllCall("gdiplus\GdipCreateBitmapFromHBITMAP", "Ptr",hBM, "UInt",0, "PtrP",pBM)
  NumPut(0x2EF31EF8,NumPut(0x0000739A,NumPut(0x11D31A04,NumPut(Enc+0,V,"UInt"),"UInt"),"UInt"),"UInt")
  E[3] := pBM ? DllCall("gdiplus\GdipSaveImageToFile", "Ptr",pBM, "WStr",sFile, "Ptr",&V, "UInt",0) : 1
  E[4] := pBM ? DllCall("gdiplus\GdipDisposeImage", "Ptr",pBM) : 1
Return E[1] ? 0 : E[2] ? -1 : E[3] ? -2 : E[4] ? -3 : 1  
}

GDIP(C:="Startup") {                                      ; By SKAN on D293 @ bit.ly/2krOIc9
  Static SI:=Chr(!(VarSetCapacity(Si,24,0)>>16)), pToken:=0, hMod:=0, Res:=0, AOK:=0
  If (AOK := (C="Startup" and pToken=0) Or (C<>"Startup" and pToken<>0))  {
      If (C="Startup") {
               hMod := DllCall("LoadLibrary", "Str","gdiplus.dll", "Ptr")
               Res  := DllCall("gdiplus\GdiplusStartup", "PtrP",pToken, "Ptr",&SI, "UInt",0)
      } Else { 
               Res  := DllCall("gdiplus\GdiplusShutdown", "Ptr",pToken)
               DllCall("FreeLibrary", "Ptr",hMod),   hMod:=0,   pToken:=0
   }}  
Return (AOK ? !Res : Res:=0)    
}