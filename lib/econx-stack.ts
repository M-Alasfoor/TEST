import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { UserPool, UserPoolClient, OAuthScope, AccountRecovery } from 'aws-cdk-lib/aws-cognito';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { HttpApi, CorsHttpMethod, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { StateMachine, TaskInput, JsonPath } from 'aws-cdk-lib/aws-stepfunctions';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { join } from 'path';

export class EconxStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const frontendOrigin = this.node.tryGetContext('frontendOrigin') || 'http://localhost:5173';
    const quicksightUrl = this.node.tryGetContext('quicksightUrl') || 'https://quicksight.aws.amazon.com';

    const bucket = new Bucket(this, 'UploadsBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    const table = new Table(this, 'ReviewsTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    const userPool = new UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      accountRecovery: AccountRecovery.EMAIL_ONLY
    });
    const userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
      oAuth: { flows: { authorizationCodeGrant: true }, scopes: [OAuthScope.OPENID, OAuthScope.EMAIL] }
    });

    const initUploadFn = new NodejsFunction(this, 'InitUploadFn', {
      runtime: Runtime.NODEJS_18_X,
      entry: join('lambda', 'uploads', 'initUpload.ts'),
      environment: {
        BUCKET_NAME: bucket.bucketName
      }
    });
    bucket.grantWrite(initUploadFn);

    const completeUploadFn = new NodejsFunction(this, 'CompleteUploadFn', {
      runtime: Runtime.NODEJS_18_X,
      entry: join('lambda', 'uploads', 'completeUpload.ts'),
      environment: {
        TABLE_NAME: table.tableName
      }
    });
    table.grantWriteData(completeUploadFn);

    const statusFn = new NodejsFunction(this, 'GetUploadStatusFn', {
      runtime: Runtime.NODEJS_18_X,
      entry: join('lambda', 'uploads', 'getUploadStatus.ts'),
      environment: { TABLE_NAME: table.tableName }
    });
    table.grantReadData(statusFn);

    const getReviewsFn = new NodejsFunction(this, 'GetReviewsFn', {
      runtime: Runtime.NODEJS_18_X,
      entry: join('lambda', 'reviews', 'getReviews.ts'),
      environment: { TABLE_NAME: table.tableName }
    });
    table.grantReadData(getReviewsFn);

    const approveReviewFn = new NodejsFunction(this, 'ApproveReviewFn', {
      runtime: Runtime.NODEJS_18_X,
      entry: join('lambda', 'reviews', 'approveReview.ts'),
      environment: { TABLE_NAME: table.tableName }
    });
    table.grantWriteData(approveReviewFn);

    const pdfToPngFn = new NodejsFunction(this, 'PdfToPngFn', {
      runtime: Runtime.NODEJS_18_X,
      entry: join('lambda', 'extractor', 'pdfToPng.ts'),
      environment: { BUCKET_NAME: bucket.bucketName }
    });
    bucket.grantReadWrite(pdfToPngFn);

    const extractFn = new NodejsFunction(this, 'ExtractWithBedrockFn', {
      runtime: Runtime.NODEJS_18_X,
      entry: join('lambda', 'extractor', 'extractWithBedrock.ts'),
      environment: { REGION: 'eu-west-1' }
    });
    extractFn.addToRolePolicy(new PolicyStatement({
      actions: ['bedrock:*'],
      resources: ['*']
    }));

    const saveResultsFn = new NodejsFunction(this, 'SaveResultsFn', {
      runtime: Runtime.NODEJS_18_X,
      entry: join('lambda', 'extractor', 'saveResults.ts'),
      environment: { TABLE_NAME: table.tableName }
    });
    table.grantWriteData(saveResultsFn);

    const pdfStep = new LambdaInvoke(this, 'PdfToPngStep', { lambdaFunction: pdfToPngFn });
    const extractStep = new LambdaInvoke(this, 'ExtractStep', { lambdaFunction: extractFn });
    const saveStep = new LambdaInvoke(this, 'SaveStep', { lambdaFunction: saveResultsFn });
    const failStep = new LambdaInvoke(this, 'FailStep', {
      lambdaFunction: saveResultsFn,
      payload: TaskInput.fromObject({
        id: JsonPath.stringAt('$.id'),
        status: 'failed',
        error: JsonPath.stringAt('$.Error')
      })
    });

    pdfStep.addCatch(failStep);
    extractStep.addCatch(failStep);
    saveStep.addCatch(failStep);

    const chain = pdfStep.next(extractStep).next(saveStep);
    const stateMachine = new StateMachine(this, 'ExtractionStateMachine', {
      definition: chain
    });

    completeUploadFn.addEnvironment('STATE_MACHINE_ARN', stateMachine.stateMachineArn);
    completeUploadFn.addEnvironment('BUCKET_NAME', bucket.bucketName);
    stateMachine.grantStartExecution(completeUploadFn);

    const authorizer = new HttpJwtAuthorizer('JWT', userPool.userPoolId, {
      userPoolClients: [userPoolClient]
    });

    const api = new HttpApi(this, 'Api', {
      corsPreflight: {
        allowHeaders: ['authorization', 'content-type'],
        allowMethods: [CorsHttpMethod.ANY],
        allowOrigins: [frontendOrigin]
      }
    });

    api.addRoutes({ path: '/uploads/init', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('InitIntegration', initUploadFn), authorizer });
    api.addRoutes({ path: '/uploads/complete', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('CompleteIntegration', completeUploadFn), authorizer });
    api.addRoutes({ path: '/uploads/{id}/status', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('StatusIntegration', statusFn), authorizer });
    api.addRoutes({ path: '/reviews', methods: [HttpMethod.GET], integration: new HttpLambdaIntegration('GetReviewsIntegration', getReviewsFn), authorizer });
    api.addRoutes({ path: '/reviews/{id}/approve', methods: [HttpMethod.POST], integration: new HttpLambdaIntegration('ApproveIntegration', approveReviewFn), authorizer });

    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, 'ApiUrl', { value: api.apiEndpoint });
    new CfnOutput(this, 'Region', { value: this.region });
    new CfnOutput(this, 'QuicksightUrl', { value: quicksightUrl });
    new CfnOutput(this, 'FrontendOrigin', { value: frontendOrigin });
    new CfnOutput(this, 'S3BucketName', { value: bucket.bucketName });
  }
}
