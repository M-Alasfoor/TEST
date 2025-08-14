# Hard Repo Layout (MUST NOT CHANGE)
/bin
/docs
/frontend
/lambda
/lib
README.md
cdk.json
package.json
tsconfig.json

# Output & Formatting Rules (IMPORTANT)
1) WRITE FILES with the following exact format, one after another:
=== path/from/repo/root ===
<file contents>
2) Include ALL files required to build & run (infra, lambdas, frontend, configs, README).
3) No placeholders like “TODO”; provide working code. Use realistic names/values (except identifiers output by CDK).
4) Do NOT use .env. Frontend config MUST come from /frontend/src/runtime-config.json generated post-deploy by CDK (custom resource or NodejsFunction).
5) Use AWS CDK v2 constructs only (import from "aws-cdk-lib/*"). Node 18.x for Lambdas. TypeScript everywhere.
6) Keep code concise, typed, and lint-friendly. Include minimal package.json scripts for build/dev.
7) CORS: allow the frontend origin (read from runtime-config.json at build time and as an API Gateway CORS config).
8) Use eu-west-1 for Bedrock inference (explicit client region override in the extractor Lambda).
9) Arabic RTL support: basic i18n toggle (en/ar) and RTL layout when ar is active (html dir="rtl", Chakra/MUI dir switch).

# Functional Requirements

## Frontend (/frontend)
- React 18 + TypeScript + Vite.
- UI:
  - Header: title “EconX” left, company logo right (import from /frontend/src/assets/logo.png).
  - Full-width red divider under header.
  - Right-aligned buttons under divider: “Quiksight” (opens embed URL in new tab) and “Logout” (Cognito hosted UI sign-out).
  - Center container:
    - “Upload file” title and drag-and-drop box (PDF, multi-file).
    - “files” list showing per-file progress and “uploaded” once in S3.
    - Bottom “Review” button → navigate to /reviews.
- Reviews page (/reviews):
  - Title “Reviews”.
  - Fetch from GET /reviews (authorized).
  - Table: sortable, sticky header, paginated, responsive. Columns (19 labels exactly):
    file name, CRBR, company name, total asset, current assest, non-curren assets, total liability, current liability, non-curren liability, total equity’s, current equity’s, non-curren equity’s, turnover, income, expenses, interest paid, interest received, dividends paid, dividends received
  - Status badge per row: extracted | needs-review | approved | failed.
  - Actions column (not part of 19 labels) with:
    - Approve: POST /reviews/{id}/approve; disable while pending; update row to approved on success.
  - Refresh button re-fetches data.
  - Row click opens a drawer with all fields/values.

- Tech & libs:
  - React Router, React Query, Chakra UI (preferred) or MUI (pick one and stick to it).
  - auth/cognito.ts: Hosted UI flow (sign-in, sign-out), parse tokens, attach Authorization Bearer token to API calls.
  - Config file: /frontend/src/runtime-config.json populated by CDK. Fields: ApiUrl, Region, UserPoolId, UserPoolClientId, QuicksightUrl, FrontendOrigin.
  - Upload flow: request POST /uploads/init → presigned URL; PUT to S3; then POST /uploads/complete; poll GET /uploads/{uploadId}/status until extracted/failed.

## API Contracts (MUST MATCH)
POST /uploads/init → { uploadId, url, method?: 'PUT'|'POST', fields?: Record<string,string>, key?: string }
POST /uploads/complete → { status: 'uploaded' | 'extracting' }
GET /uploads/{uploadId}/status → { status: 'extracting'|'extracted'|'failed', fileKey, error? }
GET /reviews → ReviewRow[]
POST /reviews/{id}/approve → { id, status: 'approved' }

type ReviewRow = {
  id: string;
  fileName: string;
  crbr?: string;
  companyName?: string;
  totalAsset?: number;
  currentAssest?: number;
  nonCurrenAssets?: number;
  totalLiability?: number;
  currentLiability?: number;
  nonCurrenLiability?: number;
  totalEquitys?: number;
  currentEquitys?: number;
  nonCurrenEquitys?: number;
  turnover?: number;
  income?: number;
  expenses?: number;
  interestPaid?: number;
  interestReceived?: number;
  dividendsPaid?: number;
  dividendsReceived?: number;
  status?: 'extracted'|'needs-review'|'approved'|'failed';
};

## Backend (AWS-only via CDK in /lib + Lambdas in /lambda)
Resources to create:
- S3 private bucket for uploads.
- Cognito: User Pool + App Client + Hosted UI domain; (optional) Identity Pool if you prefer.
- API Gateway (HTTP API) with Cognito JWT Authorizer.
- DynamoDB table (partition key: id) storing extracted fields + status.
- Step Functions state machine:
  * Triggered by completeUpload
  * Steps:
    1) pdfToPng (Lambda)
    2) extractWithBedrock (Lambda; region eu-west-1; use Claude/appropriate model)
    3) saveResults (Lambda): save fields to DynamoDB with status=extracted
    4) Catch errors → mark status=failed
- Lambdas:
  * initUpload.ts: presigned URL creation.
  * completeUpload.ts: record initial item in DynamoDB, start SFN execution.
  * getUploadStatus.ts: read status from DynamoDB.
  * getReviews.ts: query/scan DynamoDB, map to ReviewRow[].
  * approveReview.ts: update item by id → status=approved.
  * extractor/pdfToPng.ts
  * extractor/extractWithBedrock.ts
  * extractor/saveResults.ts
- IAM: least privilege for bucket, table, SFN, Bedrock, CloudWatch.
- CORS: allow FrontendOrigin.
- Quicksight: expect an embed URL (string) provided via SSM Param or CDK context; output QuicksightUrl in CDK Outputs; also write it into /frontend/src/runtime-config.json.

Wire ARNs/table/bucket/SFN names via Lambda environment variables set by CDK (NO .env).

# CDK Deliverables (TypeScript)
- /bin/app.ts: CDK app bootstrap.
- /lib/econx-stack.ts: define ALL resources above, permissions, and Outputs:
  Outputs: UserPoolId, UserPoolClientId, ApiUrl, QuicksightUrl, Region, S3BucketName, FrontendOrigin
  Also implement a post-deploy custom resource (NodejsFunction) that writes /frontend/src/runtime-config.json (create file content string and write to a CodeBuild artifact or local asset; simplest: Custom Resource writes a file to the same repo directory at deploy time using AWS SDK + S3 artifact → then a script copies it in CI step. If easier, add an npm script `pnpm cdk:emit-config` that runs a small Node script to read CloudFormation outputs and write runtime-config.json locally after `cdk deploy`.)
- cdk.json, tsconfig.json set for ES2020 modules and CDK v2.
- package.json scripts:
  - "cdk:bootstrap", "cdk:deploy", "infra:build"
  - "frontend:dev", "frontend:build", "frontend:preview"
  - "lambda:build" (tsc esbuild where needed)

# Lambda Deliverables (TypeScript under /lambda)
- /lambda/uploads/initUpload.ts
- /lambda/uploads/completeUpload.ts
- /lambda/uploads/getUploadStatus.ts
- /lambda/reviews/getReviews.ts
- /lambda/reviews/approveReview.ts
- /lambda/extractor/pdfToPng.ts
- /lambda/extractor/extractWithBedrock.ts
- /lambda/extractor/saveResults.ts

Implementation notes:
- Use AWS SDK v3 clients.
- Presigned upload: use S3 Presigners; put PDFs under key prefix uploads/{cognitoSub}/{uuid}.pdf
- DynamoDB table schema: id (PK), fileName, fileKey, fields (object of 19 fields), status, createdAt, updatedAt.
- Status values: 'uploaded' | 'extracting' | 'extracted' | 'needs-review' | 'approved' | 'failed'.
- Step Functions event shape: include id, fileKey, bucket, etc.
- pdfToPng: basic conversion stub (if native toolchains are complex, emulate as pass-through and set a note in code). Keep handler interface correct.
- Bedrock call: region eu-west-1; extract structured fields. Map model output safely, coerce numeric fields.
- saveResults: write fields/status=extracted; handle failures.

# Frontend Deliverables (TypeScript under /frontend)
- Vite config for React + TS.
- src/runtime-config.json (generated by CDK post-deploy; include a sample committed file for local dev with placeholders that dev script can overwrite if necessary).
- src/main.tsx, src/App.tsx, routes with React Router.
- State/data: React Query; axios instance attaching Authorization header from cognito.ts.
- Components:
  - components/Header.tsx (title left, logo right)
  - components/RedDivider.tsx
  - components/UploadBox.tsx (drag & drop PDFs, presigned upload, progress per file)
  - components/FileProgressList.tsx
  - components/ReviewsTable.tsx (sortable, sticky header, pagination, responsive; per-row Approve button wired)
  - components/RowDetailsDrawer.tsx
- Pages:
  - pages/Dashboard.tsx
  - pages/Reviews.tsx
- Auth:
  - auth/cognito.ts for Hosted UI sign-in/out, token storage, token refresh if applicable
  - Route guard (redirect to Hosted UI if unauthenticated)
- i18n/RTL: minimal toggle en/ar; when ar, set <html dir="rtl"> and mirror layout.
- Styling: Chakra UI theme with red divider, responsive container.

# API Gateway
- HTTP API with routes:
  POST /uploads/init        → initUpload
  POST /uploads/complete    → completeUpload
  GET  /uploads/{id}/status → getUploadStatus
  GET  /reviews             → getReviews
  POST /reviews/{id}/approve→ approveReview
- Security: Cognito JWT Authorizer (User Pool).

# Acceptance Criteria (restate)
- AWS-only: Cognito, S3, API Gateway, Lambda, Step Functions, DynamoDB, Bedrock, CloudWatch, (optional Quicksight embed).
- Repo structure EXACT.
- EconX UI: header + logo + red divider; right-aligned “Quiksight” & “Logout”; upload & progress; “Review” nav.
- Reviews page: 19 exact labeled columns; Actions column with working per-row Approve; Refresh; row details drawer.
- Presigned URL upload & status polling.
- Arabic RTL supported.
- No .env; frontend config via runtime-config.json from CDK outputs.

# Now generate ALL files.
Include (at minimum) the following paths with complete contents:

=== package.json ===
# root scripts (cdk deploy, build lambdas, workspace for frontend)

=== tsconfig.json ===

=== cdk.json ===

=== bin/app.ts ===

=== lib/econx-stack.ts ===

=== lambda/uploads/initUpload.ts ===
=== lambda/uploads/completeUpload.ts ===
=== lambda/uploads/getUploadStatus.ts ===
=== lambda/reviews/getReviews.ts ===
=== lambda/reviews/approveReview.ts ===
=== lambda/extractor/pdfToPng.ts ===
=== lambda/extractor/extractWithBedrock.ts ===
=== lambda/extractor/saveResults.ts ===

=== frontend/package.json ===
=== frontend/tsconfig.json ===
=== frontend/index.html ===
=== frontend/vite.config.ts ===
=== frontend/src/main.tsx ===
=== frontend/src/App.tsx ===
=== frontend/src/assets/logo.png === (base64 inline or note how to add)
=== frontend/src/runtime-config.json === (placeholder; overwritten post-deploy)
=== frontend/src/auth/cognito.ts ===
=== frontend/src/api/client.ts ===
=== frontend/src/components/Header.tsx ===
=== frontend/src/components/RedDivider.tsx ===
=== frontend/src/components/UploadBox.tsx ===
=== frontend/src/components/FileProgressList.tsx ===
=== frontend/src/components/ReviewsTable.tsx ===
=== frontend/src/components/RowDetailsDrawer.tsx ===
=== frontend/src/pages/Dashboard.tsx ===
=== frontend/src/pages/Reviews.tsx ===
=== frontend/src/router.tsx ===
=== frontend/src/theme.ts ===
=== frontend/src/i18n.ts ===

=== docs/ARCHITECTURE.md ===

=== README.md ===
(install, bootstrap, deploy, run, how the config JSON is emitted/written, and how to set the Quicksight embed URL)

Generate all of the above now, following every rule and contract.