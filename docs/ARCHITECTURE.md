# EconX Architecture

The project deploys an AWS-only serverless stack using AWS CDK v2.

- **S3 Bucket** stores uploaded PDF files.
- **Cognito** provides authentication via a User Pool and hosted UI.
- **API Gateway HTTP API** exposes secured endpoints for uploads and review actions with CORS restricted to the frontend origin.
- **Lambda Functions** handle upload flow, review queries, approval, and extraction steps.
- **DynamoDB** table persists extracted fields and review status.
- **Step Functions** orchestrates PDF processing: `pdfToPng` → `extractWithBedrock` → `saveResults`.
- **Bedrock** is invoked from the extraction lambda in `eu-west-1` for inference.
- **Frontend** is a React app served separately that reads configuration from `runtime-config.json` generated after deploy.

Outputs from the CDK stack are written to `frontend/src/runtime-config.json` via the `npm run cdk:emit-config` script.
