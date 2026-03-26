import AWS from "aws-sdk";

const dynamoAccessKeyId =
  process.env.accesKeyId || process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID;
const dynamoSecretAccessKey =
  process.env.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY;

export const hasDynamoCredentials = Boolean(dynamoAccessKeyId && dynamoSecretAccessKey);

AWS.config.update({
  accessKeyId: dynamoAccessKeyId,
  secretAccessKey: dynamoSecretAccessKey,
  region: "eu-west-1",
});

const dynamodb = new AWS.DynamoDB.DocumentClient({ apiVersion: "latest" });

export default dynamodb;
