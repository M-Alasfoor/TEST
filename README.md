# EconX

Full-stack serverless application for processing financial PDFs and managing reviews.

## Prerequisites
- Node.js 18+
- AWS credentials configured

## Setup
```bash
npm install
cd frontend && npm install && cd ..
```

## Build & Deploy
Bootstrap and deploy the CDK stack:
```bash
npm run cdk:bootstrap
npm run cdk:deploy
```
After deployment, emit frontend configuration:
```bash
npm run cdk:emit-config
```
This writes `frontend/src/runtime-config.json` with API and Cognito settings.

## Development
Run the React app:
```bash
npm run frontend:dev
```
Build lambdas:
```bash
npm run lambda:build
```

## Quicksight URL
Provide the Quicksight embed URL via CDK context:
```
cdk deploy -c quicksightUrl=https://example
```
