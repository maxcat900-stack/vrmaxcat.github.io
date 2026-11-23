param([int]$Port = 8080)
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "VR forest: http://localhost:$Port/a.html   (Ctrl+C to stop)"

$types = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.json' = 'application/json'
  '.png'  = 'image/png'
  '.jpg'  = 'image/jpeg'
  '.svg'  = 'image/svg+xml'
  '.ico'  = 'image/x-icon'
}
$rootFull = [IO.Path]::GetFullPath($root)

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $res = $ctx.Response
    $path = $ctx.Request.Url.AbsolutePath
    if ($path -eq '/') { $path = '/a.html' }
    $fp = $null
    try { $fp = [IO.Path]::GetFullPath((Join-Path $root ($path.TrimStart('/').Replace('/', '\')))) } catch {}
    if (-not $fp -or -not $fp.StartsWith($rootFull, [StringComparison]::OrdinalIgnoreCase) -or
        -not (Test-Path -LiteralPath $fp -PathType Leaf)) {
      $bytes = [Text.Encoding]::UTF8.GetBytes('404 not found')
      $res.StatusCode = 404
      $res.ContentType = 'text/plain; charset=utf-8'
    } else {
      $ext = [IO.Path]::GetExtension($fp).ToLowerInvariant()
      $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      $bytes = [IO.File]::ReadAllBytes($fp)
      $res.StatusCode = 200
    }
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
    $res.Close()
  }
} finally {
  $listener.Stop()
}
