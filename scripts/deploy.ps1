<#
    Deploys the built site to the S3 static website bucket.

    Usage:  pnpm run deploy
            pwsh -NoProfile -File scripts/deploy.ps1 -SkipTests

    The bucket is a public static-website endpoint (HTTP only, no CloudFront).
    Credentials come from the named AWS profile below, never from the ambient
    EC2 instance role - see the -Profile default and the identity guard.
#>
[CmdletBinding()]
param(
    [string]$Bucket  = 'surf-property-poc-site',
    [string]$Region  = 'ap-southeast-2',
    [string]$Profile = 'surf-poc-deploy',
    [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

# The AWS CLI lives on the persisted user PATH; shells started before it was
# added inherit a stale environment, so rebuild PATH from the registry.
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
            [Environment]::GetEnvironmentVariable('Path', 'User')

function Invoke-Step($Name, [scriptblock]$Body) {
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Body
    if ($LASTEXITCODE -ne 0) { throw "$Name failed (exit $LASTEXITCODE)" }
}

# Guard: this box has an EC2 instance role that would otherwise be used
# silently if the profile were missing or misspelled.
Write-Host '==> Verifying deploy identity' -ForegroundColor Cyan
$arn = aws sts get-caller-identity --profile $Profile --query Arn --output text
if ($LASTEXITCODE -ne 0) { throw "Could not resolve profile '$Profile'." }
if ($arn -notlike 'arn:aws:iam::*:user/*') {
    throw "Refusing to deploy: profile '$Profile' resolved to '$arn', which is not an IAM user. Check ~/.aws/credentials."
}
Write-Host "    $arn"

if (-not $SkipTests) {
    Invoke-Step 'Running tests'  { pnpm test }
}
Invoke-Step 'Building'           { pnpm build }

if (-not (Test-Path "$repo\dist\index.html")) { throw 'dist/index.html not found - build produced no output.' }

# Pass 1: content-hashed assets first, cached hard. Uploading these before
# index.html means the live page never references a file that is not there yet.
Invoke-Step 'Uploading assets (immutable)' {
    aws s3 sync dist/ "s3://$Bucket/" `
        --delete `
        --exclude 'index.html' `
        --cache-control 'public,max-age=31536000,immutable' `
        --region $Region --profile $Profile
}

# Pass 2: the SPA shell last, never cached, so a deploy is visible immediately.
Invoke-Step 'Uploading index.html (no-cache)' {
    aws s3 cp dist/index.html "s3://$Bucket/index.html" `
        --cache-control 'no-cache,must-revalidate' `
        --content-type 'text/html; charset=utf-8' `
        --region $Region --profile $Profile
}

$url = "http://$Bucket.s3-website-$Region.amazonaws.com"
Write-Host ''
Write-Host "Deployed: $url" -ForegroundColor Green
