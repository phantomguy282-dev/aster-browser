Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 256,256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(18,22,35))
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(176,159,255))
$points = @([System.Drawing.Point]::new(128,27),[System.Drawing.Point]::new(150,103),[System.Drawing.Point]::new(229,128),[System.Drawing.Point]::new(150,151),[System.Drawing.Point]::new(128,229),[System.Drawing.Point]::new(104,151),[System.Drawing.Point]::new(27,128),[System.Drawing.Point]::new(104,103))
$g.FillPolygon($brush,$points)
$g.FillEllipse([System.Drawing.Brushes]::White,114,114,28,28)
$bmp.Save((Join-Path $PWD 'assets\aster.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$stream=[System.IO.File]::Create((Join-Path $PWD 'assets\aster.ico'))
$ico=[System.Drawing.Icon]::FromHandle($bmp.GetHicon());$ico.Save($stream);$stream.Close();$g.Dispose();$bmp.Dispose()
