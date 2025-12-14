# Test DeepSeek API Connection
param([Parameter(Mandatory=$true)][string]$ApiKey)

Write-Host "`nTesting DeepSeek API..." -ForegroundColor Cyan

$body = @{
    model = "deepseek-chat"
    messages = @(
        @{ role = "system"; content = "You are a Git commit message generator. Only return the commit message." }
        @{ role = "user"; content = "Generate commit message for: Added function addUser(name, email)" }
    )
    temperature = 0.3
    max_tokens = 100
} | ConvertTo-Json -Depth 10

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ApiKey"
}

try {
    $response = Invoke-RestMethod -Uri "https://api.deepseek.com/chat/completions" -Method Post -Body $body -Headers $headers
    
    if ($response.choices -and $response.choices.Count -gt 0) {
        $message = $response.choices[0].message.content.Trim()
        Write-Host "`n[OK] API connection successful!" -ForegroundColor Green
        Write-Host "Generated: $message" -ForegroundColor White
    }
} catch {
    Write-Host "`n[ERROR] API failed: $($_.Exception.Message)" -ForegroundColor Red
}
