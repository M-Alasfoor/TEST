import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { writeFileSync } from 'fs';

async function main() {
  const stackName = process.argv[2] || 'EconxStack';
  const cf = new CloudFormationClient({});
  const res = await cf.send(new DescribeStacksCommand({ StackName: stackName }));
  const outputs: Record<string, string> = {};
  res.Stacks?.[0].Outputs?.forEach(o => {
    if (o.OutputKey && o.OutputValue) outputs[o.OutputKey] = o.OutputValue;
  });
  const cfg = {
    ApiUrl: outputs['ApiUrl'],
    Region: outputs['Region'],
    UserPoolId: outputs['UserPoolId'],
    UserPoolClientId: outputs['UserPoolClientId'],
    QuicksightUrl: outputs['QuicksightUrl'],
    FrontendOrigin: outputs['FrontendOrigin']
  };
  writeFileSync('frontend/src/runtime-config.json', JSON.stringify(cfg, null, 2));
  console.log('runtime-config.json written');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
