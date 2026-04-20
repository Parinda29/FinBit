Add-Type -AssemblyName System.Drawing

function New-RoundedRectPath {
    param(
        [float]$X,
        [float]$Y,
        [float]$Width,
        [float]$Height,
        [float]$Radius
    )
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $Radius * 2
    $rect = New-Object System.Drawing.RectangleF($X, $Y, $Width, $Height)
    $arc = New-Object System.Drawing.RectangleF($rect.X, $rect.Y, $diameter, $diameter)
    $path.AddArc($arc, 180, 90)
    $arc.X = $rect.Right - $diameter
    $path.AddArc($arc, 270, 90)
    $arc.Y = $rect.Bottom - $diameter
    $path.AddArc($arc, 0, 90)
    $arc.X = $rect.Left
    $path.AddArc($arc, 90, 90)
    $path.CloseFigure()
    return $path
}

$imagesDir = "./assets/images"
if (-not (Test-Path $imagesDir)) { New-Item -ItemType Directory -Path $imagesDir | Out-Null }

# 1) Modern square app logo (1024x1024)
$size = 1024
$bmp = New-Object System.Drawing.Bitmap($size, $size)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$bgRect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
$bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($bgRect, [System.Drawing.Color]::FromArgb(18, 60, 120), [System.Drawing.Color]::FromArgb(20, 180, 160), 45)
$g.FillRectangle($bgBrush, $bgRect)

# Accent glow circles
$accent1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(65, 255, 255, 255))
$accent2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 255, 255, 255))
$g.FillEllipse($accent1, 740, 60, 220, 220)
$g.FillEllipse($accent2, 60, 740, 260, 260)

# Glass card shape
$cardPath = New-RoundedRectPath -X 180 -Y 180 -Width 664 -Height 664 -Radius 120
$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 250, 252, 255))
$g.FillPath($cardBrush, $cardPath)

# Stylized F mark
$fPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 73, 130), 68)
$fPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$fPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLine($fPen, 355, 350, 355, 690)
$g.DrawLine($fPen, 355, 350, 650, 350)
$g.DrawLine($fPen, 355, 510, 585, 510)

# Tiny chart bars for fintech identity
$barBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(20, 180, 160))
$g.FillRectangle($barBrush, 535, 610, 42, 90)
$g.FillRectangle($barBrush, 595, 570, 42, 130)
$g.FillRectangle($barBrush, 655, 530, 42, 170)

$logoPath = Join-Path $imagesDir "finbit-modern-logo.png"
$bmp.Save($logoPath, [System.Drawing.Imaging.ImageFormat]::Png)

# 2) Modern splash image (1284x2778)
$sw = 1284
$sh = 2778
$splash = New-Object System.Drawing.Bitmap($sw, $sh)
$sg = [System.Drawing.Graphics]::FromImage($splash)
$sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$sg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$sRect = New-Object System.Drawing.Rectangle(0, 0, $sw, $sh)
$sBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($sRect, [System.Drawing.Color]::FromArgb(7, 25, 48), [System.Drawing.Color]::FromArgb(12, 96, 125), 90)
$sg.FillRectangle($sBrush, $sRect)

# soft blobs
$blob1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(45, 115, 255, 230))
$blob2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(40, 142, 255, 255))
$sg.FillEllipse($blob1, -140, 2040, 520, 520)
$sg.FillEllipse($blob2, 980, 120, 380, 380)

# place centered app logo
$logoImg = [System.Drawing.Image]::FromFile($logoPath)
$logoSize = 500
$logoX = [int](($sw - $logoSize) / 2)
$logoY = [int](($sh - $logoSize) / 2) - 180
$sg.DrawImage($logoImg, $logoX, $logoY, $logoSize, $logoSize)

# brand text
$fontFamily = New-Object System.Drawing.FontFamily("Segoe UI Semibold")
$titleFont = New-Object System.Drawing.Font($fontFamily, 82, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = New-Object System.Drawing.Font("Segoe UI", 34, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 252, 255))
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 228, 242))

$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center

$sg.DrawString("FINBIT", $titleFont, $textBrush, ($sw / 2), ($logoY + $logoSize + 130), $sf)
$sg.DrawString("Track smarter. Spend wiser.", $subFont, $subBrush, ($sw / 2), ($logoY + $logoSize + 230), $sf)

$splashPath = Join-Path $imagesDir "finbit-modern-splash.png"
$splash.Save($splashPath, [System.Drawing.Imaging.ImageFormat]::Png)

# also overwrite existing splash/icon assets to ensure no Expo placeholder survives
Copy-Item $logoPath "./assets/images/icon.png" -Force
Copy-Item $logoPath "./assets/images/android-icon-foreground.png" -Force
Copy-Item $logoPath "./assets/images/splash-icon.png" -Force

# cleanup
$logoImg.Dispose()
$sg.Dispose(); $splash.Dispose(); $sBrush.Dispose(); $blob1.Dispose(); $blob2.Dispose(); $titleFont.Dispose(); $subFont.Dispose(); $textBrush.Dispose(); $subBrush.Dispose(); $sf.Dispose()
$g.Dispose(); $bmp.Dispose(); $bgBrush.Dispose(); $accent1.Dispose(); $accent2.Dispose(); $cardPath.Dispose(); $cardBrush.Dispose(); $fPen.Dispose(); $barBrush.Dispose(); $fontFamily.Dispose()
Write-Output "MODERN_LOGO_GENERATED"
