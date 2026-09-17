param(
    [int]$Port = 8080
)

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
    Write-Host "HTTP server running at $prefix"
    $root = $PSScriptRoot

    while ($listener.IsListening) {
        $context = $null
        try {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $urlPath = $request.Url.LocalPath

            if ($urlPath -eq "/save-admin-frame" -and $request.HttpMethod -eq "POST") {
                $reader = New-Object System.IO.StreamReader($request.InputStream)
                $b64 = $reader.ReadToEnd()
                $frameBytes = [System.Convert]::FromBase64String($b64)
                [System.IO.File]::WriteAllBytes((Join-Path $root "assets\new-admin-bg.png"), $frameBytes)
                $respBytes = [System.Text.Encoding]::UTF8.GetBytes("OK")
                $response.StatusCode = 200
                $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
                $response.OutputStream.Close()
                continue
            }

            if ($urlPath -eq "/" -or [string]::IsNullOrWhiteSpace($urlPath)) {
                $urlPath = "/index.html"
            }
            elseif ($urlPath -eq "/admin" -or $urlPath -eq "/admin/" -or $urlPath -eq "/admin-login") {
                $urlPath = "/admin-login.html"
            }
            elseif ($urlPath -eq "/student" -or $urlPath -eq "/student/" -or $urlPath -eq "/student-login") {
                $urlPath = "/index.html"
            }

            $decodedPath = [System.Uri]::UnescapeDataString($urlPath.TrimStart('/'))
            $filePath = [System.IO.Path]::Combine($root, $decodedPath.Replace('/', [System.IO.Path]::DirectorySeparatorChar))

            if ([System.IO.File]::Exists($filePath)) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = switch ($ext) {
                    ".html" { "text/html; charset=utf-8" }
                    ".css"  { "text/css; charset=utf-8" }
                    ".js"   { "application/javascript; charset=utf-8" }
                    ".json" { "application/json; charset=utf-8" }
                    ".png"  { "image/png" }
                    ".jpg"  { "image/jpeg" }
                    ".jpeg" { "image/jpeg" }
                    ".svg"  { "image/svg+xml" }
                    ".ico"  { "image/x-icon" }
                    ".mp4"  { "video/mp4" }
                    ".webm" { "video/webm" }
                    default { "application/octet-stream" }
                }
                $response.ContentType = $contentType
                $response.AddHeader("Accept-Ranges", "bytes")
                $response.AddHeader("Cache-Control", "no-cache")

                $fileInfo = New-Object System.IO.FileInfo($filePath)
                $totalLength = $fileInfo.Length

                $rangeHeader = $request.Headers["Range"]
                if ($rangeHeader -and $rangeHeader.StartsWith("bytes=")) {
                    # Handle Range request (e.g. bytes=0- or bytes=0-1024)
                    $range = $rangeHeader.Substring(6).Split('-')
                    $start = [int64]$range[0]
                    $end = if ($range.Length -gt 1 -and [string]::IsNullOrWhiteSpace($range[1]) -eq $false) { [int64]$range[1] } else { $totalLength - 1 }
                    if ($end -ge $totalLength) { $end = $totalLength - 1 }
                    $length = $end - $start + 1

                    $response.StatusCode = 206
                    $response.AddHeader("Content-Range", "bytes $start-$end/$totalLength")
                    $response.ContentLength64 = $length

                    if ($request.HttpMethod -ne "HEAD") {
                        $fs = [System.IO.File]::OpenRead($filePath)
                        try {
                            $fs.Seek($start, [System.IO.SeekOrigin]::Begin) | Out-Null
                            $buffer = New-Object byte[] 65536
                            $bytesRemaining = $length
                            while ($bytesRemaining -gt 0) {
                                $toRead = [Math]::Min([int64]$buffer.Length, $bytesRemaining)
                                $bytesRead = $fs.Read($buffer, 0, $toRead)
                                if ($bytesRead -le 0) { break }
                                $response.OutputStream.Write($buffer, 0, $bytesRead)
                                $bytesRemaining -= $bytesRead
                            }
                        } finally {
                            $fs.Close()
                        }
                    }
                } else {
                    $response.StatusCode = 200
                    $response.ContentLength64 = $totalLength

                    if ($request.HttpMethod -ne "HEAD") {
                        $fs = [System.IO.File]::OpenRead($filePath)
                        try {
                            $buffer = New-Object byte[] 65536
                            while (($bytesRead = $fs.Read($buffer, 0, $buffer.Length)) -gt 0) {
                                $response.OutputStream.Write($buffer, 0, $bytesRead)
                            }
                        } finally {
                            $fs.Close()
                        }
                    }
                }
            } else {
                $response.StatusCode = 404
                $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $decodedPath")
                $response.ContentType = "text/plain; charset=utf-8"
                $response.ContentLength64 = $buffer.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                }
            }
            $response.OutputStream.Close()
        }
        catch {
            if ($context -and $context.Response) {
                try { $context.Response.OutputStream.Close() } catch {}
            }
        }
    }
}
catch {
    Write-Error $_
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
