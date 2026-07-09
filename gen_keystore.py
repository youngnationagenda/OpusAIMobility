"""
Generate Android release keystore for OpusAIMobility
Produces: opusaimobility-release.jks (PKCS12 format, Android compatible)
"""

import os, base64, json, datetime
from pathlib import Path
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12

# ** Config ********************************************************************
KEY_ALIAS        = "opusaimobility"
STORE_PASSWORD   = "OpusAI2026@Keystore!"
KEY_PASSWORD     = "OpusAI2026@Key!"
OUT_DIR          = Path(__file__).parent
JKS_PATH         = OUT_DIR / "opusaimobility-release.jks"
B64_PATH         = OUT_DIR / "keystore.b64"
META_PATH        = OUT_DIR / "keystore-meta.json"

# ** Generate RSA 2048-bit private key ****************************************
print("[*] Generating RSA 2048-bit private key...")
private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

# ** Build X.509 certificate (10000 day validity) *****************************
print("** Building X.509 certificate...")
subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COMMON_NAME,             "OpusAIMobility"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME,       "YNA"),
    x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME,"Mobile"),
    x509.NameAttribute(NameOID.LOCALITY_NAME,           "Nairobi"),
    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME,  "Nairobi"),
    x509.NameAttribute(NameOID.COUNTRY_NAME,            "KE"),
])

now = datetime.datetime.now(datetime.timezone.utc)
cert = (
    x509.CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(private_key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(now)
    .not_valid_after(now + datetime.timedelta(days=10000))
    .add_extension(
        x509.BasicConstraints(ca=True, path_length=None),
        critical=True,
    )
    .add_extension(
        x509.SubjectKeyIdentifier.from_public_key(private_key.public_key()),
        critical=False,
    )
    .sign(private_key, hashes.SHA256())
)

# ** Serialize to PKCS12 (.jks / .p12) ****************************************
print("** Serializing PKCS12 keystore...")
p12_bytes = pkcs12.serialize_key_and_certificates(
    name=KEY_ALIAS.encode(),
    key=private_key,
    cert=cert,
    cas=None,
    encryption_algorithm=serialization.BestAvailableEncryption(STORE_PASSWORD.encode()),
)

# Write keystore file
JKS_PATH.write_bytes(p12_bytes)
print(f"[+] Keystore written: {JKS_PATH}  ({len(p12_bytes):,} bytes)")

# ** Base64 encode for GitHub Secret ******************************************
b64_str = base64.b64encode(p12_bytes).decode()
B64_PATH.write_text(b64_str)
print(f"[+] Base64 written:   {B64_PATH}  ({len(b64_str):,} chars)")

# ** Write metadata (for GitHub Secrets reference) ****************************
meta = {
    "keyAlias":         KEY_ALIAS,
    "storePassword":    STORE_PASSWORD,
    "keyPassword":      KEY_PASSWORD,
    "keystoreFile":     str(JKS_PATH),
    "base64File":       str(B64_PATH),
    "certSubject":      "CN=OpusAIMobility, OU=Mobile, O=YNA, L=Nairobi, ST=Nairobi, C=KE",
    "validityDays":     10000,
    "keySize":          2048,
    "algorithm":        "RSA",
    "signatureAlg":     "SHA256withRSA",
    "notBefore":        now.isoformat(),
    "notAfter":         (now + datetime.timedelta(days=10000)).isoformat(),
    "githubSecrets": {
        "KEYSTORE_FILE":     "Contents of keystore.b64",
        "KEYSTORE_PASSWORD": STORE_PASSWORD,
        "KEY_ALIAS":         KEY_ALIAS,
        "KEY_PASSWORD":      KEY_PASSWORD,
    }
}
META_PATH.write_text(json.dumps(meta, indent=2))
print(f"[+] Metadata written: {META_PATH}")

# ** Store in AWS Secrets Manager **********************************************
print("\n** Storing in AWS Secrets Manager...")
import subprocess, sys

secret_payload = json.dumps({
    "keystoreBase64":  b64_str,
    "storePassword":   STORE_PASSWORD,
    "keyPassword":     KEY_PASSWORD,
    "keyAlias":        KEY_ALIAS,
    "algorithm":       "RSA2048-SHA256",
    "generatedAt":     now.isoformat(),
    "validUntil":      (now + datetime.timedelta(days=10000)).isoformat(),
})

r = subprocess.run([
    "aws", "secretsmanager", "create-secret",
    "--name", "opusaimobility/android-keystore",
    "--description", "Android release keystore for com.terraai.aimobility (TERRA-094)",
    "--secret-string", secret_payload,
    "--output", "json"
], capture_output=True, text=True)

if r.returncode == 0:
    arn = json.loads(r.stdout).get("ARN", "")
    print(f"[+] Secrets Manager: opusaimobility/android-keystore")
    print(f"   ARN: {arn}")
else:
    print(f"[!]*  Secrets Manager: {r.stderr.strip()[:150]}")

# ** Summary *******************************************************************
print("\n" + "="*60)
print("** KEYSTORE GENERATION COMPLETE")
print("="*60)
print(f"\nFiles:")
print(f"  Keystore (.jks/.p12): {JKS_PATH}")
print(f"  Base64 for CI:        {B64_PATH}")
print(f"  Metadata:             {META_PATH}")
print(f"\nGitHub Secrets to add at:")
print(f"  https://github.com/youngnationagenda/OpusAIMobility/settings/secrets/actions")
print(f"\n  KEYSTORE_FILE     = <contents of keystore.b64>")
print(f"  KEYSTORE_PASSWORD = {STORE_PASSWORD}")
print(f"  KEY_ALIAS         = {KEY_ALIAS}")
print(f"  KEY_PASSWORD      = {KEY_PASSWORD}")
print(f"\nAWS Secrets Manager: opusaimobility/android-keystore")
print(f"  (contains all 4 values * retrieve anytime with aws secretsmanager get-secret-value)")
