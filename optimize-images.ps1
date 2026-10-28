Add-Type -AssemblyName System.Drawing
$encoder = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$quality = New-Object Drawing.Imaging.EncoderParameters(1)
$quality.Param[0] = New-Object Drawing.Imaging.EncoderParameter([Drawing.Imaging.Encoder]::Quality, [long]86)
$assetRoot = Join-Path $PSScriptRoot 'assets/generated'
foreach ($file in Get-ChildItem -LiteralPath $assetRoot -Filter '*.png') {
  $picture = [Drawing.Image]::FromFile($file.FullName)
  try { $picture.Save([IO.Path]::ChangeExtension($file.FullName,'.jpg'), $encoder, $quality) } finally { $picture.Dispose() }
}
$quality.Dispose()
