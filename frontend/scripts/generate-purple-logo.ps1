Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
    param([float]$X,[float]$Y,[float]$Width,[float]$Height,[float]$Radius)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $Radius * 2
    $rect = New-Object System.Drawing.RectangleF($X,$Y,$Width,$Height)
    $arc = New-Object System.Drawing.RectangleF($rect.X,$rect.Y,$d,$d)
    $path.AddArc($arc,180,90)
    $arc.X = $rect.Right - $d; $path.AddArc($arc,270,90)
    $arc.Y = $rect.Bottom - $d; $path.AddArc($arc,0,90)
    $arc.X = $rect.Left; $path.AddArc($arc,90,90)
    $path.CloseFigure()
    return $path
}

$imagesDir = "./assets/images"
if (-not (Test-Path $imagesDir)) { New-Item -ItemType Directory -Path $imagesDir | Out-Null }

# Purple square app logo
$size = 1024
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$bgRect = New-Object System.Drawing.Rectangle(0,0,$size,$size)
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect,[System.Drawing.Color]::FromArgb(109,40,217),[System.Drawing.Color]::FromArgb(124,58,237),45)
$g.FillRectangle($bg,$bgRect)

$glowA = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45,255,255,255))
$glowB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34,237,233,254))
$g.FillEllipse($glowA, 740, 70, 220, 220)
$g.FillEllipse($glowB, 70, 740, 240, 240)

# Wallet card mark
$card = New-RoundedRectPath -X 190 -Y 230 -Width 640 -Height 560 -Radius 130
$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(236,250,245,255))
$g.FillPath($cardBrush,$card)

$flap = New-RoundedRectPath -X 250 -Y 290 -Width 520 -Height 170 -Radius 70
$flapBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245,255,255,255))
$g.FillPath($flapBrush,$flap)

$slotPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(109,40,217),32)
$slotPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$slotPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($slotPen, 360, 380, 620, 380)

$coinBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(124,58,237))
$g.FillEllipse($coinBrush, 610, 540, 120, 120)

$logoPath = Join-Path $imagesDir "finbit-purple-logo.png"
$bmp.Save($logoPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Purple splash image
$sw = 1284; $sh = 2778
$splash = New-Object System.Drawing.Bitmap($sw,$sh)
$sg = [System.Drawing.Graphics]::FromImage($splash)
$sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$sg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$sRect = New-Object System.Drawing.Rectangle(0,0,$sw,$sh)
$sBg = New-Object System.Drawing.Drawing2D.LinearGradientBrush($sRect,[System.Drawing.Color]::FromArgb(91,33,182),[System.Drawing.Color]::FromArgb(109,40,217),90)
$sg.FillRectangle($sBg,$sRect)

$blob1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(42,255,255,255))
$blob2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34,221,214,254))
$sg.FillEllipse($blob1,-120,2080,560,560)
$sg.FillEllipse($blob2,980,130,380,380)

$logoImg = [System.Drawing.Image]::FromFile($logoPath)
$logoSize = 500
$logoX = [int](($sw - $logoSize)/2)
$logoY = [int](($sh - $logoSize)/2) - 180
$sg.DrawImage($logoImg,$logoX,$logoY,$logoSize,$logoSize)

$titleFont = New-Object System.Drawing.Font("Segoe UI Semibold", 82, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248,245,255))
$sBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(214,226,216,255))

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$sg.DrawString("FINBIT",$titleFont,$tBrush,($sw/2),($logoY+$logoSize+130),$sf)
$sg.DrawString("Smart Finance Tracker",$subFont,$sBrush,($sw/2),($logoY+$logoSize+230),$sf)

$splashPath = Join-Path $imagesDir "finbit-purple-splash.png"
$splash.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Keep common names aligned with purple logo
Copy-Item $logoPath "./assets/images/icon.png" -Force
Copy-Item $logoPath "./assets/images/android-icon-foreground.png" -Force
Copy-Item $logoPath "./assets/images/splash-icon.png" -Force

$logoImg.Dispose(); $sg.Dispose(); $splash.Dispose(); $sBg.Dispose(); $blob1.Dispose(); $blob2.Dispose(); $titleFont.Dispose(); $subFont.Dispose(); $tBrush.Dispose(); $sBrush.Dispose(); $sf.Dispose()
$g.Dispose(); $bmp.Dispose(); $bg.Dispose(); $glowA.Dispose(); $glowB.Dispose(); $card.Dispose(); $cardBrush.Dispose(); $flap.Dispose(); $flapBrush.Dispose(); $slotPen.Dispose(); $coinBrush.Dispose()
Write-Output "PURPLE_LOGO_GENERATED"
