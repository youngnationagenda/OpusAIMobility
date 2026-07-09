# 🌍 TerraAI — AI Mobility Platform

TerraAI is a full-stack mobility platform powered by AI, built on AWS serverless infrastructure. It includes a customer mobile app (Android), vendor/admin web portals, a PHP REST API, and AWS Lambda microservices.

---

## 📁 Project Structure

| Folder | Description |
|---|---|
| `Admin panel/` | Web-based admin & restaurant management portal (PHP) |
| `Android source code/` | Android customer app (Java/Kotlin) |
| `aws/` | AWS Lambda functions, setup scripts, API Gateway configs |
| `PHP API/` | CakePHP-based mobile REST API |
| `Debug APK/` | Pre-built debug APK for testing |
| `documentation/` | Project documentation |

---

## 🚀 Deployment

This repo uses **GitHub Actions** for CI/CD self-deployment to AWS.

### Workflows
- **`deploy-aws.yml`** — Deploys Lambda functions & admin panel to AWS on push to `main`

### Prerequisites (GitHub Secrets)
Set the following in your repo's **Settings → Secrets and variables → Actions**:

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |

---

## 🛠️ Tech Stack

- **Mobile:** Android (Java)
- **Backend API:** PHP / CakePHP
- **Cloud:** AWS Lambda, API Gateway, DynamoDB, S3, Cognito, Pinpoint
- **Admin Portal:** PHP, JavaScript, CKEditor
- **CI/CD:** GitHub Actions → AWS

---

## 📦 Getting Started

```bash
# Clone the repo
git clone https://github.com/youngnationagenda/TerraAI.git
cd TerraAI

# Install Node dependencies (for AWS tools)
cd aws/admin-panel
npm install
```

---

## 🤝 Contributing
Pull requests are welcome. For major changes, open an issue first.

---

## 📄 License
MIT
