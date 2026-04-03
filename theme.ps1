$files = @("Preview.jsx", "Quiz.jsx", "Host.jsx", "Join.jsx", "App.jsx", "Upload.jsx")
foreach ($f in $files) {
    $path = "frontend/src/$f"
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        $content = $content -replace '(?i)#f8f9fa', '#202135' `
                            -replace '(?i)#0a0a0f', '#202135' `
                            -replace '(?i)#333333', '#F9FAFB' `
                            -replace '(?i)#f0ede8', '#F9FAFB' `
                            -replace '(?i)#ffffff', '#2D2E47' `
                            -replace '(?i)#fff(?![a-f0-9])', '#2D2E47' `
                            -replace '(?i)#12121c', '#2D2E47' `
                            -replace '(?i)#e0e0e0', '#414361' `
                            -replace '(?i)#2e2e42', '#414361' `
                            -replace '(?i)#3d3d5c', '#414361' `
                            -replace '(?i)#f0f0f0', '#353650' `
                            -replace '(?i)#181825', '#353650' `
                            -replace '(?i)#777777', '#A0A5B5' `
                            -replace '(?i)#8e8ea0', '#A0A5B5' `
                            -replace '(?i)#6b6b7e', '#A0A5B5' `
                            -replace '(?i)#4285F4', '#00D2D3' `
                            -replace '(?i)#7c6fff', '#00D2D3' `
                            -replace '(?i)#EA4335', '#FF6B6B' `
                            -replace '(?i)#ff4d4f', '#FF6B6B' `
                            -replace '(?i)#16162a', '#2D2E47'
        Set-Content -Path $path -Value $content
        Write-Host ("Updated " + $f)
    }
}
