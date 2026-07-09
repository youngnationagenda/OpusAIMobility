[System.IO.Directory]::GetFiles("\\.\pipe\") | Where-Object { $_ -match "datacloud|antigravity|gravity|gemini" }
